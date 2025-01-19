import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { database } = params;
    const { query, values } = await request.json();
    const library = database === "books-girls" ? "Girls Library" : "Boys Library";

    console.log("Received request:", { database, query, values });

    if (query.includes("SELECT")) {
      const books = await prisma.book.findMany({
        where: { library },
        orderBy: { id: 'asc' },
        include: {
          borrows: {
            where: { status: "borrowed" },
            orderBy: { borrowDate: 'desc' },
            take: 1
          }
        }
      });
      return NextResponse.json(books);
    } 
    else if (query.includes("INSERT")) {
      // Extract values and ensure bookId is a valid number
      const [bookIdRaw, title, author, genre] = values;
      const bookId = parseInt(bookIdRaw);

      if (isNaN(bookId)) {
        return NextResponse.json({ 
          error: "Invalid book ID", 
          details: "Book ID must be a number" 
        }, { status: 400 });
      }

      console.log("Creating book with:", { bookId, title, author, genre, library });

      try {
        // Find if book ID already exists
        const existingBook = await prisma.book.findUnique({
          where: { id: bookId }
        });

        if (existingBook) {
          return NextResponse.json({ 
            error: "Duplicate book ID", 
            details: "A book with this ID already exists" 
          }, { status: 400 });
        }

        // Create the book
        const newBook = await prisma.book.create({
          data: {
            id: bookId,
            title,
            author,
            genre: genre || "Uncategorized",
            library,
            status: "available"
          }
        });

        console.log("Book created:", newBook);

        // Create activity record
        await prisma.activity.create({
          data: {
            action: "Book added",
            bookId: newBook.id,
            userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
          }
        });

        return NextResponse.json(newBook);
      } catch (createError) {
        console.error("Error creating book:", createError);
        return NextResponse.json({ 
          error: "Failed to create book",
          details: createError.message 
        }, { status: 500 });
      }
    }
    else if (query.includes("DELETE")) {
      const [idRaw] = values;
      const id = parseInt(idRaw);

      if (isNaN(id)) {
        return NextResponse.json({ 
          error: "Invalid book ID", 
          details: "Book ID must be a number" 
        }, { status: 400 });
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Delete related records first
          await tx.transaction.deleteMany({
            where: { borrow: { bookId: id } }
          });

          await tx.borrow.deleteMany({
            where: { bookId: id }
          });

          await tx.activity.deleteMany({
            where: { bookId: id }
          });

          await tx.book.delete({
            where: { id }
          });
        });

        return NextResponse.json({ success: true });
      } catch (deleteError) {
        console.error("Error deleting book:", deleteError);
        return NextResponse.json({ 
          error: "Failed to delete book",
          details: deleteError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/db/[database]:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  return NextResponse.json({ error: "Please use POST method for deletion" }, { status: 405 });
} 
