import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPasswordGM = await bcrypt.hash('gm123', 12)
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 12)
  const hashedPasswordManager = await bcrypt.hash('manager123', 12)
  const hashedPasswordStaff = await bcrypt.hash('staff123', 12)

  const restaurant = await prisma.restaurant.findFirst()
  console.log('Restaurant:', restaurant?.name)
  
  // Delete if exists
  await prisma.user.deleteMany({ where: { email: { in: ['gm@sunest.com', 'admin@sunest.com', 'manager@sunest.com', 'staff@sunest.com'] } } })
  
  await prisma.user.create({ data: { email: 'gm@sunest.com', password: hashedPasswordGM, name: 'GM Sunest', role: 'GM', position: 'MANAGER', isActive: true }})
  await prisma.user.create({ data: { email: 'admin@sunest.com', password: hashedPasswordAdmin, name: 'Admin Pusat', role: 'ADMIN_PUSAT', position: 'MANAGER', isActive: true }})
  await prisma.user.create({ data: { email: 'manager@sunest.com', password: hashedPasswordManager, name: 'Manager Sunest', role: 'MANAGER', position: 'MANAGER', restaurantId: restaurant?.id, isActive: true }})
  await prisma.user.create({ data: { email: 'staff@sunest.com', password: hashedPasswordStaff, name: 'Staff Sunest', role: 'STAFF', position: 'STAFF', restaurantId: restaurant?.id, isActive: true }})
  
  const users = await prisma.user.findMany({ select: { email: true, name: true, role: true, position: true } })
  console.log('\n=== ALL USERS ===')
  console.table(users)
  
  await prisma.$disconnect()
}

main()
