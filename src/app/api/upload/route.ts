import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseExcelFile, cleanseData, validateExcelHeaders } from '@/services/cleansing'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    const userId = (session.user as any)?.id || session.user?.email || 'unknown'

    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
    const isManagerOrStaff = userRole === 'MANAGER' || userRole === 'ASMAN' || userRole === 'ASISTEN_MANAGER' || userRole === 'STAFF'

    const contentType = req.headers.get('content-type') || ''
    
    let restaurantId = ''
    let cleansedData: any[] = []
    let rawData: any[] = []

    // Check if receiving JSON (already cleaned data from client)
    if (contentType.includes('application/json')) {
      const body = await req.json()
      restaurantId = body.restaurantId
      cleansedData = body.cleanedData || []
      
      console.log('Received cleaned data from client, count:', cleansedData.length)
    } else {
      // Old way: receive file and parse server-side
      const formData = await req.formData()
      const file = formData.get('file') as File
      restaurantId = formData.get('restaurantId') as string

      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
      }

      // Convert file to buffer and parse
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      try {
        rawData = parseExcelFile(buffer)
      } catch (parseError: any) {
        return NextResponse.json({ 
          error: 'Failed to parse Excel file',
          details: parseError.message
        }, { status: 400 })
      }
    }

    // Validate restaurant
    const assignedRestaurantId = userRestaurantId
    
    if (isManagerOrStaff && !assignedRestaurantId && !restaurantId) {
      return NextResponse.json({ error: 'Pilih restoran terlebih dahulu' }, { status: 400 })
    }

    let targetRestaurantId = assignedRestaurantId || restaurantId

    if (!targetRestaurantId) {
      return NextResponse.json({ error: 'Restaurant tidak ditemukan' }, { status: 400 })
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: targetRestaurantId }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant tidak ditemukan' }, { status: 404 })
    }

    // If rawData exists (old way), run server-side cleansing
    let dataToSave = cleansedData
    if (rawData.length > 0) {
      const cleansed = cleanseData(rawData, targetRestaurantId, userId)
      dataToSave = cleansed.data
    }

    if (dataToSave.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data yang valid',
        data: { totalRows: rawData.length || cleansedData.length, validRows: 0, invalidRows: rawData.length || cleansedData.length, qualityScore: 0, errors: [] }
      }, { status: 400 })
    }

    // Save to database
    const successfullySaved = []
    const failedRows = []

    for (const row of dataToSave) {
      try {
        const orderId = row.orderId || `ORD${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const dataToInsert = {
          orderId: orderId,
          restaurantId: targetRestaurantId,
          location: row.location || '',
          orderTime: row.orderTime ? new Date(row.orderTime) : new Date(),
          deliveryTime: row.deliveryTime ? new Date(row.deliveryTime) : new Date(),
          deliveryDuration: row.deliveryDuration || 0,
          orderMonth: row.orderMonth || 'Unknown',
          orderHour: row.orderHour || 0,
          pizzaSize: row.pizzaSize || 'Unknown',
          pizzaType: row.pizzaType || 'Unknown',
          toppingsCount: row.toppingsCount || 0,
          pizzaComplexity: row.pizzaComplexity || 0,
          toppingDensity: row.toppingDensity || null,
          distanceKm: row.distanceKm || 0,
          trafficLevel: row.trafficLevel || 'Unknown',
          trafficImpact: row.trafficImpact || 1,
          isPeakHour: row.isPeakHour || false,
          isWeekend: row.isWeekend || false,
          paymentMethod: row.paymentMethod || 'Unknown',
          paymentCategory: row.paymentCategory || 'Unknown',
          estimatedDuration: row.estimatedDuration || 0,
          deliveryEfficiency: row.deliveryEfficiency || null,
          delayMin: row.delayMin || 0,
          isDelayed: row.isDelayed || false,
          restaurantAvgTime: row.restaurantAvgTime || null,
          uploadedBy: userId,
          uploadedAt: new Date(),
          validatedAt: new Date(),
          validatedBy: userId,
          qualityScore: row.qualityScore || 0,
          version: 1
        }

        await prisma.deliveryData.upsert({
          where: { orderId: orderId },
          update: { ...dataToInsert, version: { increment: 1 } },
          create: dataToInsert
        })
        
        successfullySaved.push(row)
      } catch (error: any) {
        console.error('Error saving row:', error.message)
        failedRows.push({ orderId: row.orderId, error: error.message })
      }
    }

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'UPLOAD_DATA',
          entity: 'DeliveryData',
          restaurantId: targetRestaurantId,
          details: `Uploaded ${successfullySaved.length} records`,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    console.log('Upload complete - saved:', successfullySaved.length, 'failed:', failedRows.length)

    return NextResponse.json({
      success: true,
      message: `Berhasil upload ${successfullySaved.length} dari ${dataToSave.length} baris data`,
      data: {
        totalRows: dataToSave.length,
        validRows: successfullySaved.length,
        invalidRows: failedRows.length,
        qualityScore: successfullySaved.length > 0 ? 100 : 0,
        errors: failedRows.slice(0, 20)
      },
      lastUpdate: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = (session.user as any).role || (session.user as any).position || 'STAFF'
    const userRestaurantId = (session.user as any)?.restaurantId
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

    let whereClause: any = {}
    if (!isSuperAdmin && userRestaurantId) whereClause.restaurantId = userRestaurantId

    const restaurants = await prisma.restaurant.findMany({
      where: isSuperAdmin ? {} : { id: userRestaurantId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(restaurants)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
