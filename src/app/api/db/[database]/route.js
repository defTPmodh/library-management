import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(request, { params }) {
  try {
    const { database } = params;
    const { query, values } = await request.json();
    const library = database === "books-girls" ? "Girls Library" : "Boys Library";

    if (query.includes("SELECT")) {
      const books = await prisma.book.findMany({
        where: { library },
        orderBy: {
          id: 'asc'
        }
      });
      return NextResponse.json(books);
    } 
    else if (query.includes("INSERT")) {
      const [title, author, genre] = values;
      console.log("Creating book with genre:", genre);

      // Find the lowest available ID
      const existingBooks = await prisma.book.findMany({
        where: { library },
        select: { id: true },
        orderBy: { id: 'asc' }
      });
      
      // Find the first gap in the sequence or use next number
      let newId = 1;
      for (const book of existingBooks) {
        if (book.id !== newId) {
          break;
        }
        newId++;
      }

      // Create the book with the new ID
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
      console.log("Created book:", newBook);

      // Create activity record for the new book
      await prisma.activity.create({
        data: {
          action: "Book added through website",
          bookId: newBook.id,
          userId: library === "Girls Library" ? "GIRLS001" : "BOYS001" // Use appropriate staff ID
        }
      });

      return NextResponse.json(newBook);
    }
    else if (query.includes("DELETE")) {
      const [id] = values;
      console.log("Attempting to delete book with ID:", id);
      
      try {
        // Start a transaction to ensure all operations are atomic
        await prisma.$transaction(async (tx) => {
          // Get all books to determine the order
          const allBooks = await tx.book.findMany({
            where: { library },
            orderBy: { id: 'asc' }
          });

          // Find the book to delete
          const bookToDelete = allBooks.find(b => b.id === parseInt(id));
          if (!bookToDelete) {
            throw new Error("Book not found");
          }

          // Delete all related records for all books (we'll recreate them)
          await tx.transaction.deleteMany({
            where: {
              borrow: {
                book: {
                  library
                }
              }
            }
          });

          await tx.borrow.deleteMany({
            where: {
              book: {
                library
              }
            }
          });

          await tx.activity.deleteMany({
            where: {
              book: {
                library
              }
            }
          });

          // Delete all books
          await tx.book.deleteMany({
            where: { library }
          });

          // Get books to recreate (excluding the deleted one)
          const booksToRecreate = allBooks
            .filter(b => b.id !== parseInt(id))
            .sort((a, b) => a.id - b.id);

          // Recreate books with new sequential IDs
          let newId = 1;
          for (const book of booksToRecreate) {
            const recreatedBook = await tx.book.create({
              data: {
                id: newId,
                title: book.title,
                author: book.author,
                genre: book.genre,
                status: book.status,
                library: book.library,
                borrower: book.borrower,
                gr_number: book.gr_number,
                class_name: book.class_name
              }
            });

            // Create activity record for the recreated book
            await tx.activity.create({
              data: {
                action: "Book recreated during reordering",
                bookId: recreatedBook.id,
                userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
              }
            });

            newId++;
          }
        });

        return NextResponse.json({ 
          success: true,
          message: "Book successfully deleted and IDs reordered"
        });
      } catch (deleteError) {
        console.error("Error in deletion process:", deleteError);
        return NextResponse.json({ 
          error: "Failed to delete book", 
          details: deleteError.message 
        }, { 
          status: 500 
        });
      }
    }
    else if (query.includes("UPDATE")) {
      console.log("Update values:", values);
      const [id] = values; // For return, we only need the ID
      
      // Check if this is a return operation
      if (query.includes("SET status = 'available'")) {
        const book = await prisma.book.update({
          where: { 
            id: parseInt(id)
          },
          data: {
            status: "available",
            borrower: null,
            gr_number: null,
            class_name: null
          }
        });
        return NextResponse.json(book);
      } 
      // This is a borrow operation
      else {
        const [borrower, gr_number, class_name, bookId] = values;
        const book = await prisma.book.update({
          where: { 
            id: parseInt(bookId)
          },
          data: {
            status: "borrowed",
            borrower: borrower,
            gr_number: gr_number,
            class_name: class_name
          }
        });
        return NextResponse.json(book);
      }
    }

    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  return NextResponse.json({ error: "Please use POST method for deletion" }, { status: 405 });
} 