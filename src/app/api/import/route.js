import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import * as XLSX from 'xlsx';

const BATCH_SIZE = 100; // Process 100 books at a time

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

    console.log(`Total books to import: ${jsonData.length}`);

    // Process books in batches
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Split data into batches
    for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
      const batch = jsonData.slice(i, i + BATCH_SIZE);
      
      // Process batch in transaction
      await prisma.$transaction(async (prisma) => {
        for (const row of batch) {
          try {
            // Extract title
            let title = row.title || '';
            if (typeof title === 'string' && title.includes(':')) {
              title = title.split(':')[0].trim();
            }

            // Format price
            let priceStr = row.price ? row.price.toString() : '';
            priceStr = priceStr.replace(/Rs\s*/, '').replace(/\s*\([^)]*\)/, '').trim();

            // Handle publisher
            const publisher = library === "Girls Library" 
              ? `${row.publisher || ''}${row.publisherPlace ? ', ' + row.publisherPlace : ''}`
              : row.publishers;

            // Handle series and remarks
            const remarks = library === "Girls Library"
              ? `${row.series ? 'Series: ' + row.series + '. ' : ''}${row.remarks || ''}`
              : row.remark;

            // Check for duplicate acc_no
            const existingBook = await prisma.book.findFirst({
              where: {
                acc_no: row.accNo?.toString(),
                library: library
              }
            });

            if (existingBook) {
              results.failed++;
              results.errors.push(`Duplicate acc_no: ${row.accNo}`);
              continue;
            }

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

            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Error with book ${row.accNo}: ${error.message}`);
          }
        }
      });

      // Log progress
      console.log(`Processed ${Math.min((i + BATCH_SIZE), jsonData.length)} of ${jsonData.length} books`);
    }

    return NextResponse.json({ 
      message: `Import completed. Successfully imported ${results.successful} books.`,
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
