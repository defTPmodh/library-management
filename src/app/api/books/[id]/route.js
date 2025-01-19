import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const library = searchParams.get('library');

    if (!library) {
      return NextResponse.json({ error: "Library parameter is required" }, { status: 400 });
    }

    console.log("Fetching books for library:", library);

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

    console.log("Found books:", books);
    return NextResponse.json(books);
  } catch (error) {
    console.error("Error in GET /api/books:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, values, library } = body;

    if (query === "INSERT") {
      const [title, author, genre] = values;
      console.log("Creating book with genre:", genre);

      // Find the lowest available ID
      const existingBooks = await prisma.book.findMany({
        where: { library },
        select: { id: true },
        orderBy: { id: 'asc' }
      });
      
      let newId = 1;
      for (const book of existingBooks) {
        if (book.id !== newId) break;
        newId++;
      }

      // Create the book
      const newBook = await prisma.book.create({
        data: {
          id: newId,
          title,
          author,
          genre: genre || "Uncategorized",
          library,
          status: "available"
        }
      });

      // Create activity record
      await prisma.activity.create({
        data: {
          action: "Book added",
          bookId: newBook.id,
          userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
        }
      });

      return NextResponse.json(newBook);
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/books:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const library = searchParams.get('library');

    if (!id || !library) {
      return NextResponse.json({ 
        error: "Book ID and library are required" 
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          borrow: {
            bookId: parseInt(id)
          }
        }
      });

      await tx.borrow.deleteMany({
        where: {
          bookId: parseInt(id)
        }
      });

      await tx.activity.deleteMany({
        where: {
          bookId: parseInt(id)
        }
      });

      await tx.book.delete({
        where: {
          id: parseInt(id)
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/books:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ... rest of your route handlers
