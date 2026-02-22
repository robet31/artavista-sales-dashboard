import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')
  
  // Create restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.upsert({
      where: { code: 'PIZZA001' },
      update: {},
      create: { name: 'Pizza Hut Surabaya', code: 'PIZZA001', location: 'Surabaya', description: 'Pizza Hut Surabaya' }
    }),
    prisma.restaurant.upsert({
      where: { code: 'PIZZA002' },
      update: {},
      create: { name: 'Pizza Hut Jakarta', code: 'PIZZA002', location: 'Jakarta', description: 'Pizza Hut Jakarta' }
    }),
    prisma.restaurant.upsert({
      where: { code: 'PIZZA003' },
      update: {},
      create: { name: 'Pizza Hut Bandung', code: 'PIZZA003', location: 'Bandung', description: 'Pizza Hut Bandung' }
    }),
    prisma.restaurant.upsert({
      where: { code: 'PIZZA004' },
      update: {},
      create: { name: 'Domino Pizza Surabaya', code: 'PIZZA004', location: 'Surabaya', description: 'Domino Pizza Surabaya' }
    }),
    prisma.restaurant.upsert({
      where: { code: 'PIZZA005' },
      update: {},
      create: { name: 'Domino Pizza Jakarta', code: 'PIZZA005', location: 'Jakarta', description: 'Domino Pizza Jakarta' }
    })
  ])
  
  console.log('Created restaurants:', restaurants.length)
  
  // Get restaurants
  const allRestaurants = await prisma.restaurant.findMany()
  
  // Create sample delivery data
  const deliveryData = []
  const pizzaTypes = ['Supreme', 'Meat Lovers', 'Cheese', 'Veggie', 'Hawaiian', 'Pepperoni']
  const pizzaSizes = ['Small', 'Medium', 'Large', 'X-Large']
  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'E-Wallet', 'GoPay', 'OVO']
  const trafficLevels = ['Low', 'Normal', 'High', 'Very High']
  
  for (let i = 0; i < 200; i++) {
    const restaurant = allRestaurants[Math.floor(Math.random() * allRestaurants.length)]
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90))
    
    const deliveryDuration = 20 + Math.floor(Math.random() * 40)
    const distanceKm = 1 + Math.random() * 15
    const isPeakHour = [11, 12, 13, 17, 18, 19, 20].includes(orderDate.getHours())
    const isWeekend = [0, 6].includes(orderDate.getDay())
    
    deliveryData.push({
      orderId: 'ORD-' + Date.now() + '-' + i,
      restaurantId: restaurant.id,
      location: 'Jl. Contoh No.' + (Math.floor(Math.random() * 200) + 1),
      orderTime: orderDate,
      deliveryTime: new Date(orderDate.getTime() + deliveryDuration * 60000),
      deliveryDuration: deliveryDuration,
      orderMonth: orderDate.toISOString().slice(0, 7),
      orderHour: orderDate.getHours(),
      pizzaSize: pizzaSizes[Math.floor(Math.random() * pizzaSizes.length)],
      pizzaType: pizzaTypes[Math.floor(Math.random() * pizzaTypes.length)],
      toppingsCount: 1 + Math.floor(Math.random() * 5),
      pizzaComplexity: 1 + Math.floor(Math.random() * 3),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      trafficLevel: trafficLevels[Math.floor(Math.random() * trafficLevels.length)],
      trafficImpact: Math.floor(Math.random() * 5),
      isPeakHour: isPeakHour,
      isWeekend: isWeekend,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentCategory: 'Digital',
      estimatedDuration: deliveryDuration - 5 + Math.floor(Math.random() * 10),
      deliveryEfficiency: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
      delayMin: Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0,
      isDelayed: Math.random() > 0.7,
      uploadedBy: 'system'
    })
  }
  
  // Insert in batches
  for (let i = 0; i < deliveryData.length; i += 50) {
    await prisma.deliveryData.createMany({
      data: deliveryData.slice(i, i + 50)
    })
  }
  
  console.log('Created delivery data:', deliveryData.length)
  console.log('Seeding complete!')
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit())
