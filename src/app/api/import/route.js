import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const library = formData.get('library');

    if (!file || !library) {
      return NextResponse.json({ 
        error: "Missing file or library" 
      }, { status: 400 });
    }

    // Convert file buffer to array buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Define headers based on library type
    const headers = library === "Girls Library" 
      ? ['date', 'accNo', 'subject', 'classNo', 'title', 'author', 'publisher', 'publisherPlace', 'edition', 'pages', 'price', 'series', 'isbn', 'remarks']
      : ['date', 'accNo', 'subject', 'classNo', 'title', 'edition', 'author', 'publishers', 'pages', 'price', 'isbn', 'remark'];

    // Convert to JSON with custom header mapping
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: headers,
      range: 1  // Skip header row
    });

    console.log('Parsed Excel data:', jsonData); // Debug log

    // Process each row
    const books = await Promise.all(jsonData.map(async (row) => {
      try {
        // Extract title from the format "Title (with Description)"
        let title = row.title || '';
        if (typeof title === 'string' && title.includes(':')) {
          title = title.split(':')[0].trim();
        }

        // Format price to remove "Rs" and handle "(5 vols)" format
        let priceStr = row.price ? row.price.toString() : '';
        priceStr = priceStr.replace(/Rs\s*/, '').replace(/\s*\([^)]*\)/, '').trim();

        // Handle publisher based on library type
        const publisher = library === "Girls Library" 
          ? `${row.publisher || ''}${row.publisherPlace ? ', ' + row.publisherPlace : ''}`
          : row.publishers;

        // Handle series for girls library
        const remarks = library === "Girls Library"
          ? `${row.series ? 'Series: ' + row.series + '. ' : ''}${row.remarks || ''}`
          : row.remark;

        // Create book record
        const book = await prisma.book.create({
          data: {
            acc_no: row.accNo?.toString(),
            class_no: row.classNo?.toString(),
            title: title || "Unknown Title",
            author: row.author?.toString() || "Unknown Author",
            publisher: publisher?.toString(),
            status: "available",
            library: library,
            genre: row.subject?.toString() || "Uncategorized",
            edition: row.edition?.toString(),
            pages: row.pages?.toString(),
            price: priceStr,
            isbn: row.isbn?.toString(),
            remarks: remarks?.toString()
          }
        });

        // Create activity record
        await prisma.activity.create({
          data: {
            action: "Book imported",
            bookId: book.id,
            userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
          }
        });

        console.log('Successfully imported book:', book); // Debug log
        return book;
      } catch (error) {
        console.error(`Error importing book ${row.accNo}:`, error);
        return null;
      }
    }));

    // Filter out failed imports
    const successfulImports = books.filter(book => book !== null);
    console.log(`Total successful imports: ${successfulImports.length}`); // Debug log

    return NextResponse.json({ 
      message: `Successfully imported ${successfulImports.length} books`,
      failedImports: books.length - successfulImports.length,
      books: successfulImports 
    });

  } catch (error) {
    console.error("Error importing books:", error);
    return NextResponse.json({ 
      error: error.message,
      hint: "Please ensure your Excel file matches the required format for your library type"
    }, { status: 500 });
  }
} 
