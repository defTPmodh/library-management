import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const library = formData.get('library');

    console.log('Starting import for library:', library);

    if (!file || !library) {
      return NextResponse.json({ 
        error: "Missing file or library" 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: ''
    });

    console.log('Raw data first row:', rawData[0]);

    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    const transformedData = rawData.map((row, index) => {
      try {
        // Only include fields that exist in your schema
        const transformed = {
          acc_no: String(row['Acc. No.'] || ''),
          class_no: String(row['Class No.'] || ''),
          title: String(row['Title (with Discription)'] || 'Unknown Title'),
          author: String(row['Author'] || 'Unknown Author'),
          publisher: String(row['Publisher'] || ''),
          status: "available",
          library: library,
          genre: String(row['Subject'] || 'Uncategorized'),
          edition: String(row['Edition'] || ''),
          pages: String(row['pages'] || ''),
          price: String(row['Price'] || '').replace(/Rs\s*/, '').trim(),
          isbn: String(row['ISBN'] || ''),
          remarks: String(row['Remark'] || '')
        };

        // Validate required fields
        if (!transformed.title || !transformed.author) {
          console.warn(`Skipping row ${index + 2}: Missing required fields`);
          return null;
        }

        return transformed;
      } catch (error) {
        console.error(`Error transforming row ${index + 2}:`, error);
        return null;
      }
    }).filter(Boolean);

    console.log(`Transformed ${transformedData.length} valid rows`);
    console.log('Sample transformed row:', transformedData[0]);

    if (transformedData.length === 0) {
      throw new Error('No valid data to import after transformation');
    }

    // Process in smaller batches
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < transformedData.length; i += chunkSize) {
      chunks.push(transformedData.slice(i, i + chunkSize));
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

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
        results.errors.push(`${error.message} (${error.code})`);
        results.failed += chunk.length;
      }
    }

    // Log final results
    console.log('Import results:', {
      successful: results.successful,
      failed: results.failed,
      errors: results.errors
    });

    return NextResponse.json({ 
      message: `Import completed. Successfully imported ${results.successful} books.`,
      totalRows: rawData.length,
      importedRows: results.successful,
      failedImports: results.failed,
      errors: results.errors
    });

  } catch (error) {
    console.error("Error importing books:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      hint: "Please ensure your Excel file matches the required format"
    }, { status: 500 });
  }
} 
