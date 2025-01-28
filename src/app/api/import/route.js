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
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const totalRows = range.e.r; // Total number of rows

    console.log('Total rows in Excel:', totalRows);

    // Define headers based on library type
    const headers = library === "Girls Library" 
      ? ['date', 'accNo', 'subject', 'classNo', 'title', 'author', 'publisher', 'publisherPlace', 'edition', 'pages', 'price', 'series', 'isbn', 'remarks']
      : ['date', 'accNo', 'classNo', 'subject', 'title', 'edition', 'author', 'publishers', 'pages', 'price', 'isbn', 'remark'];

    // Convert to JSON with header mapping and defval to handle empty cells
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: headers,
      range: 1,  // Skip header row
      defval: '', // Default value for empty cells
      raw: false  // Convert all values to strings
    });

    console.log('Parsed rows:', jsonData.length);
    console.log('Sample first row:', jsonData[0]);

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process all books in chunks of 100
    for (let i = 0; i < jsonData.length; i += 100) {
      const chunk = jsonData.slice(i, i + 100);
      
      try {
        await prisma.$transaction(async (tx) => {
          for (const row of chunk) {
            try {
              // Skip empty rows
              if (!row.accNo && !row.title) {
                continue;
              }

              // Extract title
              let title = row.title?.toString() || '';
              if (title.includes(':')) {
                title = title.split(':')[0].trim();
              }

              // Format price
              let priceStr = row.price ? row.price.toString() : '';
              priceStr = priceStr.replace(/Rs\s*/, '').replace(/\s*\([^)]*\)/, '').trim();

              // Handle publisher
              const publisher = library === "Girls Library" 
                ? `${row.publisher || ''}${row.publisherPlace ? ', ' + row.publisherPlace : ''}`
                : row.publishers;

              // Handle remarks
              const remarks = library === "Girls Library"
                ? `${row.series ? 'Series: ' + row.series + '. ' : ''}${row.remarks || ''}`
                : row.remark;

              const book = await tx.book.create({
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

              await tx.activity.create({
                data: {
                  action: "Book imported",
                  bookId: book.id,
                  userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
                }
              });

              results.successful++;
            } catch (error) {
              results.failed++;
              results.errors.push(`Error with book ${row.accNo}: ${error.message}`);
            }
          }
        });

        console.log(`Processed ${Math.min(i + 100, jsonData.length)} of ${jsonData.length} books. Success: ${results.successful}`);
      } catch (error) {
        console.error('Chunk processing error:', error);
        results.errors.push(`Chunk error: ${error.message}`);
      }
    }

    return NextResponse.json({ 
      message: `Import completed. Successfully imported ${results.successful} books.`,
      totalRows: totalRows,
      parsedRows: jsonData.length,
      failedImports: results.failed,
      errors: results.errors.slice(0, 100) // Return first 100 errors only
    });

  } catch (error) {
    console.error("Error importing books:", error);
    return NextResponse.json({ 
      error: error.message,
      hint: "Please ensure your Excel file matches the required format for your library type"
    }, { status: 500 });
  }
} 
