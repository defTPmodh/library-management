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

    // Different headers for different libraries
    const headers = library === "Girls Library" 
      ? ['date', 'accNo', 'subject', 'classNo', 'title', 'author', 'publisher', 'publisherPlace', 'edition', 'pages', 'price', 'series', 'isbn', 'remarks']
      : ['date', 'accNo', 'classNo', 'subject', 'titleWithDesc', 'edition', 'author', 'publishers', 'pages', 'price', 'isbn', 'remark'];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: headers,
      range: 1,
      defval: '',
      raw: false
    }).filter(row => row.accNo || row.title || row.titleWithDesc);

    console.log('Parsed rows:', jsonData.length);

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process in smaller batches
    const chunkSize = 50;
    const chunks = [];
    
    // Transform data based on library type
    const transformedData = jsonData.map(row => {
      if (library === "Girls Library") {
        return {
          acc_no: row.accNo?.toString(),
          class_no: row.classNo?.toString(),
          title: (row.title?.toString() || "Unknown Title").split(':')[0].trim(),
          author: row.author?.toString() || "Unknown Author",
          publisher: `${row.publisher || ''}${row.publisherPlace ? ', ' + row.publisherPlace : ''}`,
          status: "available",
          library: library,
          genre: row.subject?.toString() || "Uncategorized",
          edition: row.edition?.toString(),
          pages: row.pages?.toString(),
          price: (row.price ? row.price.toString().replace(/Rs\s*/, '').replace(/\s*\([^)]*\)/, '') : '').trim(),
          isbn: row.isbn?.toString(),
          remarks: `${row.series ? 'Series: ' + row.series + '. ' : ''}${row.remarks || ''}`
        };
      } else {
        // Boys Library format
        return {
          acc_no: row.accNo?.toString(),
          class_no: row.classNo?.toString(),
          title: (row.titleWithDesc?.toString() || "Unknown Title").split(':')[0].trim(),
          author: row.author?.toString() || "Unknown Author",
          publisher: row.publishers?.toString(),
          status: "available",
          library: library,
          genre: row.subject?.toString() || "Uncategorized",
          edition: row.edition?.toString(),
          pages: row.pages?.toString(),
          price: (row.price ? row.price.toString().replace(/Rs\s*/, '').replace(/\s*\([^)]*\)/, '') : '').trim(),
          isbn: row.isbn?.toString(),
          remarks: row.remark?.toString()
        };
      }
    });

    // Split into chunks
    for (let i = 0; i < transformedData.length; i += chunkSize) {
      chunks.push(transformedData.slice(i, i + chunkSize));
    }

    // Process chunks
    for (const chunk of chunks) {
      try {
        const createdBooks = await prisma.book.createMany({
          data: chunk,
          skipDuplicates: true
        });

        results.successful += createdBooks.count;
        console.log(`Successfully imported ${createdBooks.count} books from chunk`);

      } catch (error) {
        console.error('Chunk error:', error);
        results.errors.push(error.message);
        results.failed += chunk.length;
      }
    }

    // Create a single activity record
    if (results.successful > 0) {
      await prisma.activity.create({
        data: {
          action: `Imported ${results.successful} books`,
          bookId: 1,
          userId: library === "Girls Library" ? "GIRLS001" : "BOYS001"
        }
      });
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
