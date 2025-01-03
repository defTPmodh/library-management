const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // First, delete existing data
  await prisma.borrow.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  await prisma.user.createMany({
    data: [
      {
        empId: "GIRLS001",
        password: await bcrypt.hash("password123", 10),
        library: "Girls Library"
      },
      {
        empId: "BOYS001",
        password: await bcrypt.hash("password123", 10),
        library: "Boys Library"
      }
    ]
  });

  // Create some sample books
  await prisma.book.createMany({
    data: [
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        library: "Girls Library"
      },
      {
        title: "Little Women",
        author: "Louisa May Alcott",
        library: "Girls Library"
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        library: "Boys Library"
      },
      {
        title: "Treasure Island",
        author: "Robert Louis Stevenson",
        library: "Boys Library"
      }
    ]
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 