import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(request, { params }) {
  try {
    const { database } = params;
    const { query, values } = await request.json();
    const library = database === "books-girls" ? "Girls Library" : "Boys Library";

    if (query.includes("SELECT")) {
      const books = await prisma.book.findMany({
        where: { library }
      });
      return NextResponse.json(books);
    } 
    else if (query.includes("INSERT")) {
      const [title, author, genre] = values;
      console.log("Creating book with genre:", genre); // Debug log
      const newBook = await prisma.book.create({
        data: {
          title,
          author,
          genre: genre || "Uncategorized", // Ensure genre is set
          library,
          status: "available"
        }
      });
      console.log("Created book:", newBook); // Debug log
      return NextResponse.json(newBook);
    }
    else if (query.includes("DELETE")) {
      const [id] = values;
      console.log("Attempting to delete book with ID:", id);
      
      try {
        // Delete all related records
        console.log("Deleting related transactions...");
        const deletedTransactions = await prisma.transaction.deleteMany({
          where: {
            borrow: {
              bookId: parseInt(id)
            }
          }
        });
        console.log("Deleted transactions:", deletedTransactions.count);

        console.log("Deleting related borrows...");
        const deletedBorrows = await prisma.borrow.deleteMany({
          where: {
            bookId: parseInt(id)
          }
        });
        console.log("Deleted borrows:", deletedBorrows.count);

        console.log("Deleting related activities...");
        const deletedActivities = await prisma.activity.deleteMany({
          where: {
            bookId: parseInt(id)
          }
        });
        console.log("Deleted activities:", deletedActivities.count);

        console.log("Deleting book...");
        const deletedBook = await prisma.book.delete({
          where: {
            id: parseInt(id)
          }
        });
        console.log("Successfully deleted book:", deletedBook);

        return NextResponse.json({ success: true, deletedBook });
      } catch (deleteError) {
        console.error("Error in deletion process:", deleteError);
        throw deleteError; // Re-throw to be caught by outer try-catch
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