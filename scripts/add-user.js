const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function addUser(empId, password, library) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        empId,
        password: hashedPassword,
        library
      }
    });
    console.log('User created:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage:
// addUser('GIRLS002', 'password123', 'Girls Library');
// addUser('BOYS002', 'password123', 'Boys Library'); 