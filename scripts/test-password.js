const bcrypt = require('bcrypt');

async function testPassword() {
  const password = "tpmodh";
  
  // Generate hash
  console.log('Generating hash for:', password);
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  // Verify immediately
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification result:', isValid);
}

testPassword(); 