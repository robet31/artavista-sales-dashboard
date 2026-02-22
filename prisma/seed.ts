import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Adidas Restaurant/Region
  const adidasStore = await prisma.restaurant.upsert({
    where: { code: 'ADI' },
    update: {},
    create: {
      name: "Adidas Indonesia",
      code: 'ADI',
      location: 'Indonesia',
      description: 'Adidas Sales Dashboard - Retailer: Transmart'
    }
  })

  console.log('✅ Created restaurant:', adidasStore.name)

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Create Adidas Users - Multi Account System
  const users = await Promise.all([
    // GM - Full Access
    prisma.user.upsert({
      where: { email: 'gm@adidas.id' },
      update: {},
      create: {
        email: 'gm@adidas.id',
        password: hashedPassword,
        name: 'General Manager Adidas',
        role: 'GM',
        position: 'GENERAL_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    // Admin Pusat
    prisma.user.upsert({
      where: { email: 'admin@adidas.id' },
      update: {},
      create: {
        email: 'admin@adidas.id',
        password: hashedPassword,
        name: 'Admin Pusat Adidas',
        role: 'ADMIN_PUSAT',
        position: 'ADMIN',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    // Regional Manager
    prisma.user.upsert({
      where: { email: 'manager.sumatera@adidas.id' },
      update: {},
      create: {
        email: 'manager.sumatera@adidas.id',
        password: hashedPassword,
        name: 'Regional Manager Sumatera',
        role: 'MANAGER',
        position: 'REGIONAL_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager.jawa@adidas.id' },
      update: {},
      create: {
        email: 'manager.jawa@adidas.id',
        password: hashedPassword,
        name: 'Regional Manager Jawa',
        role: 'MANAGER',
        position: 'REGIONAL_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager.kalimantan@adidas.id' },
      update: {},
      create: {
        email: 'manager.kalimantan@adidas.id',
        password: hashedPassword,
        name: 'Regional Manager Kalimantan',
        role: 'MANAGER',
        position: 'REGIONAL_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    // Assistant Manager
    prisma.user.upsert({
      where: { email: 'asman.medan@adidas.id' },
      update: {},
      create: {
        email: 'asman.medan@adidas.id',
        password: hashedPassword,
        name: 'Assistant Manager Medan',
        role: 'ASMAN',
        position: 'ASST_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'asman.jakarta@adidas.id' },
      update: {},
      create: {
        email: 'asman.jakarta@adidas.id',
        password: hashedPassword,
        name: 'Assistant Manager Jakarta',
        role: 'ASMAN',
        position: 'ASST_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'asman.surabaya@adidas.id' },
      update: {},
      create: {
        email: 'asman.surabaya@adidas.id',
        password: hashedPassword,
        name: 'Assistant Manager Surabaya',
        role: 'ASMAN',
        position: 'ASST_MANAGER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    // Sales Analyst
    prisma.user.upsert({
      where: { email: 'analyst@adidas.id' },
      update: {},
      create: {
        email: 'analyst@adidas.id',
        password: hashedPassword,
        name: 'Sales Analyst',
        role: 'ANALYST',
        position: 'ANALYST',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    // Staff
    prisma.user.upsert({
      where: { email: 'staff.medan@adidas.id' },
      update: {},
      create: {
        email: 'staff.medan@adidas.id',
        password: hashedPassword,
        name: 'Staff Medan',
        role: 'STAFF',
        position: 'STAFF',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'staff.jakarta@adidas.id' },
      update: {},
      create: {
        email: 'staff.jakarta@adidas.id',
        password: hashedPassword,
        name: 'Staff Jakarta',
        role: 'STAFF',
        position: 'STAFF',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'staff.bandung@adidas.id' },
      update: {},
      create: {
        email: 'staff.bandung@adidas.id',
        password: hashedPassword,
        name: 'Staff Bandung',
        role: 'STAFF',
        position: 'STAFF',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'staff.surabaya@adidas.id' },
      update: {},
      create: {
        email: 'staff.surabaya@adidas.id',
        password: hashedPassword,
        name: 'Staff Surabaya',
        role: 'STAFF',
        position: 'STAFF',
        restaurantId: adidasStore.id,
        isActive: true
      }
    }),
    // View Only - Read Only Access
    prisma.user.upsert({
      where: { email: 'viewer@adidas.id' },
      update: {},
      create: {
        email: 'viewer@adidas.id',
        password: hashedPassword,
        name: 'Viewer (Read Only)',
        role: 'VIEWER',
        position: 'VIEWER',
        restaurantId: adidasStore.id,
        isActive: true
      }
    })
  ])

  console.log('✅ Created users:', users.length)

  // Create Settings
  await prisma.settings.upsert({
    where: { key: 'app_settings' },
    update: {},
    create: {
      key: 'app_settings',
      value: '{"appName":"Adidas Sales Dashboard","dataRetentionDays":365,"maxUploadSize":10,"allowedFileTypes":["xlsx","xls","csv"]}',
      description: 'Application settings'
    }
  })

  console.log('✅ Created settings')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('📝 Adidas Login credentials (password: admin123):')
  console.log('')
  console.log('🔑 GM Level:')
  console.log('   gm@adidas.id')
  console.log('')
  console.log('🔑 Admin:')
  console.log('   admin@adidas.id')
  console.log('')
  console.log('🔑 Regional Managers:')
  console.log('   manager.sumatera@adidas.id')
  console.log('   manager.jawa@adidas.id')
  console.log('   manager.kalimantan@adidas.id')
  console.log('')
  console.log('🔑 Assistant Managers:')
  console.log('   asman.medan@adidas.id')
  console.log('   asman.jakarta@adidas.id')
  console.log('   asman.surabaya@adidas.id')
  console.log('')
  console.log('🔑 Analyst:')
  console.log('   analyst@adidas.id')
  console.log('')
  console.log('🔑 Staff:')
  console.log('   staff.medan@adidas.id')
  console.log('   staff.jakarta@adidas.id')
  console.log('   staff.bandung@adidas.id')
  console.log('   staff.surabaya@adidas.id')
  console.log('')
  console.log('🔑 Viewer:')
  console.log('   viewer@adidas.id')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
