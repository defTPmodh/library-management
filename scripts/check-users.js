const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Attempting to connect to database...');
    const users = await prisma.user.findMany();
    console.log('Successfully connected to database!');
    console.log('\nFound users:', users.length);
    users.forEach(user => {
      console.log(`\nUser ID: ${user.empId}`);
      console.log(`Library: ${user.library}`);
      console.log(`Password Hash: ${user.password.substring(0, 20)}...`);
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 