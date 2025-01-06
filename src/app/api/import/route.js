import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const library = formData.get('library');

    // Get the employee ID based on the library
    const employeeId = library === "Girls Library" ? "GIRLS001" : "BOYS001";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file buffer to array buffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Get first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,
      header: ["title", "author", "genre"] // Map columns directly in order: Title, Author, Genre
    });

    // Remove the header row if it exists
    if (data.length > 0 && data[0].title === "Title") {
      data.shift();
    }

    // Validate data structure
    if (!data.length) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    // Map and validate the data
    const books = data.map((row, index) => {
      // Clean up the data by removing any extra spaces
      const title = row.title?.toString().trim();
      const author = row.author?.toString().trim();
      const genre = row.genre?.toString().trim();

      if (!title || !author) {
        throw new Error(`Row ${index + 2}: Title and Author are required. Found Title: "${title}", Author: "${author}"`);
      }

      return {
        title,
        author,
        genre: genre || "Uncategorized",
        library,
        status: "available"
      };
    });

    // Import books in batches of 100
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      const createdBooks = await prisma.$transaction(
        batch.map(book => 
          prisma.book.create({
            data: book
          })
        )
      );
      results.push(...createdBooks);
    }

    // Create activity records for the import
    await prisma.activity.createMany({
      data: results.map(book => ({
        action: "Book imported from Excel",
        bookId: book.id,
        userId: employeeId // Use the actual employee ID
      }))
    });

    return NextResponse.json({
      success: true,
      importedCount: results.length,
      message: `Successfully imported ${results.length} books.`
    });

  } catch (error) {
    console.error("Error importing books:", error);
    return NextResponse.json({ 
      error: error.message,
      hint: "Please ensure your Excel file has three columns in order: Title, Author, and Genre."
    }, { status: 500 });
  }
} 