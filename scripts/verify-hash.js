const bcrypt = require('bcrypt');

async function verifyHash() {
  // The password to check
  const password = "tpmodh";
  
  // The hash we generated
  const hash = "$2b$10$wBXCuS5K7kf7ZjEN7/HNqOrE4dsSpfowdZ2kfBmLBl3wJzGV.rvOW";

  // Check if they match
  const isValid = await bcrypt.compare(password, hash);
  console.log('Input password:', password);
  console.log('Hash:', hash);
  console.log('Password matches hash:', isValid);
}

verifyHash(); 