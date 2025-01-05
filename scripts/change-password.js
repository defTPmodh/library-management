const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function changePassword(empId, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { empId: empId },
      data: { password: hashedPassword }
    });
    console.log('Password updated for:', empId);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Update both users
changePassword('GIRLS001', 'password123');
changePassword('BOYS001', 'password123'); 