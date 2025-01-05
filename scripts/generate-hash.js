const bcrypt = require('bcrypt');

async function generateHash() {
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedPassword);
}

generateHash(); 