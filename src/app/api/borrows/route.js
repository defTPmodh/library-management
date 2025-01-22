import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const borrows = await prisma.borrow.findMany({
      include: { 
        book: true,
        transactions: true
      },
      orderBy: {
        borrowDate: 'desc'
      }
    });
    
    return NextResponse.json(borrows);
  } catch (error) {
    console.error("Error fetching borrows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const borrowData = await request.json();
    console.log("API: Creating new borrow:", borrowData);

    // Validate required fields
    if (!borrowData.bookId || !borrowData.borrowerName || !borrowData.grNumber || !borrowData.className) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Check if book exists and is available
      const book = await prisma.book.findUnique({
        where: { id: borrowData.bookId }
      });

      if (!book) {
        throw new Error("Book not found");
      }

      if (book.status === 'borrowed') {
        throw new Error("Book is already borrowed");
      }

      // Update book status
      await prisma.book.update({
        where: { id: borrowData.bookId },
        data: { 
          status: 'borrowed'
        }
      });

      // Create borrow record
      const newBorrow = await prisma.borrow.create({
        data: {
          bookId: borrowData.bookId,
          borrowerName: borrowData.borrowerName,
          grNumber: borrowData.grNumber,
          className: borrowData.className,
          status: "borrowed",
          borrowDate: new Date(borrowData.borrowDate),
          dueDate: new Date(borrowData.dueDate)
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          borrowId: newBorrow.id,
          type: "borrow",
          status: "completed"
        }
      });

      // Create activity record
      const library = book.library;
      const userId = library === "Girls Library" ? "GIRLS001" : "BOYS001";
      await prisma.activity.create({
        data: {
          action: "Book borrowed",
          bookId: borrowData.bookId,
          userId: userId
        }
      });

      return newBorrow;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API: Error creating borrow:", error);
    if (error.message === "Book not found" || error.message === "Book is already borrowed") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
} 
