import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status, returnDate } = await request.json();
    
    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Get the borrow record
      const borrow = await prisma.borrow.findUnique({
        where: { id: parseInt(id) },
        include: { book: true }
      });

      if (!borrow) {
        throw new Error('Borrow record not found');
      }

      // Update the book status
      await prisma.book.update({
        where: { id: borrow.bookId },
        data: { 
          status: 'available'
        }
      });

      // Update the borrow record
      const updatedBorrow = await prisma.borrow.update({
        where: { id: parseInt(id) },
        data: {
          status,
          returnDate: new Date(returnDate)
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          borrowId: parseInt(id),
          type: "return",
          status: "completed"
        }
      });

      // Create activity record
      const userId = borrow.book.library === "Girls Library" ? "GIRLS001" : "BOYS001";
      await prisma.activity.create({
        data: {
          action: "Book returned",
          bookId: borrow.bookId,
          userId: userId
        }
      });

      return updatedBorrow;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Return book error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to return book' 
    }, { status: 500 });
  }
} 
