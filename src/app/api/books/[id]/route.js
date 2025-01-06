import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    console.log('Deleting book with ID:', id);

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Delete all related transactions first
      const deletedTransactions = await tx.transaction.deleteMany({
        where: {
          borrow: {
            bookId: parseInt(id)
          }
        }
      });
      console.log('Deleted transactions:', deletedTransactions.count);

      // Delete all related borrows
      const deletedBorrows = await tx.borrow.deleteMany({
        where: {
          bookId: parseInt(id)
        }
      });
      console.log('Deleted borrows:', deletedBorrows.count);

      // Delete all related activities
      const deletedActivities = await tx.activity.deleteMany({
        where: {
          bookId: parseInt(id)
        }
      });
      console.log('Deleted activities:', deletedActivities.count);

      // Finally, delete the book
      const deletedBook = await tx.book.delete({
        where: {
          id: parseInt(id)
        }
      });
      console.log('Deleted book:', deletedBook);

      return deletedBook;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book', details: error.message },
      { status: 500 }
    );
  }
} 