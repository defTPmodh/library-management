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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const totalRows = range.e.r;

    console.log('Total rows in Excel:', totalRows);

    const headers = library === "Girls Library" 
      ? ['date', 'accNo', 'subject', 'classNo', 'title', 'author', 'publisher', 'publisherPlace', 'edition', 'pages', 'price', 'series', 'isbn', 'remarks']
      : ['date', 'accNo', 'classNo', 'subject', 'title', 'edition', 'author', 'publishers', 'pages', 'price', 'isbn', 'remark'];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: headers,
      range: 1,
      defval: '',
      raw: false
    });

    console.log('Parsed rows:', jsonData.length);

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process in very small chunks of 25 books
    const chunkSize = 25;
    for (let i = 0; i < jsonData.length; i += chunkSize) {
      const chunk = jsonData.slice(i, i + chunkSize);
      
      try {
        // Process each book in the chunk
        for (const row of chunk) {
          if (!row.accNo && !row.title) continue;

          try {
            const bookData = {
              acc_no: row.accNo?.toString(),
              class_no: row.classNo?.toString(),
              title: (row.title?.toString() || "Unknown Title").split(':')[0].trim(),
              author: row.author?.toString() || "Unknown Author",
              publisher: library === "Girls Library" 
                ? `${row.publisher || ''}${row.publisherPlace ? ', ' + row.publisherPlace : ''}`
                : row.publishers?.toString(),
              status: "available",
              library: library,
              genre: row.subject?.toString() || "Uncategorized",
              edition: row.edition?.toString(),
              pages: row.pages?.toString(),
              price: (row.price ? row.price.toString().replace(/Rs\s*/, '').replace(/\s*\([^)]*\)/, '') : '').trim(),
              isbn: row.isbn?.toString(),
              remarks: library === "Girls Library"
                ? `${row.series ? 'Series: ' + row.series + '. ' : ''}${row.remarks || ''}`
                : row.remark?.toString()
            };

            // Create book and activity in a single transaction
            await prisma.$transaction(async (tx) => {
              const book = await tx.book.create({
                data: bookData
              });

              await tx.activity.create({
                data: {
                  action: "Book imported",
                  bookId: book.id,
                  userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
                }
              });
            });

            results.successful++;
          } catch (error) {
            console.error(`Error importing book ${row.accNo}:`, error);
            results.failed++;
            results.errors.push(`Error with book ${row.accNo}: ${error.message}`);
          }
        }

        // Add a small delay between chunks to prevent overload
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`Processed ${Math.min(i + chunkSize, jsonData.length)} of ${jsonData.length} books. Success: ${results.successful}`);
      } catch (error) {
        console.error('Chunk error:', error);
        results.errors.push(`Error processing chunk ${i}-${i + chunkSize}: ${error.message}`);
        results.failed += chunk.length;
      }
    }

    return NextResponse.json({ 
      message: `Import completed. Successfully imported ${results.successful} books.`,
      totalRows: totalRows,
      parsedRows: jsonData.length,
      failedImports: results.failed,
      errors: results.errors.slice(0, 100)
    });

  } catch (error) {
    console.error("Error importing books:", error);
    return NextResponse.json({ 
      error: error.message,
      hint: "Please ensure your Excel file matches the required format for your library type"
    }, { status: 500 });
  }
} 
