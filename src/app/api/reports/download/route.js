import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export async function GET() {
  return new NextResponse(
    JSON.stringify({ message: 'This endpoint only accepts POST requests' }),
    { status: 405 }
  );
}

export async function POST(request) {
  try {
    console.log('Starting report generation...');
    const { reportType, month } = await request.json();
    console.log('Report type:', reportType, 'Month:', month);
    
    // Parse month string to get year and month
    const [year, month_num] = month.split('-').map(Number);
    const startDate = new Date(year, month_num - 1, 1);
    const endDate = new Date(year, month_num, 0); // Last day of the month

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    if (reportType === 'accession') {
      try {
        // Fetch activities for the selected month with book details
        const activities = await prisma.activity.findMany({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            book: true,
            user: true
          },
          orderBy: {
            timestamp: 'asc'
          }
        });

        console.log('Fetched activities:', activities.length);

        // Set up headers for accession register
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Time', key: 'time', width: 12 },
          { header: 'Action', key: 'action', width: 20 },
          { header: 'Book Title', key: 'bookTitle', width: 40 },
          { header: 'Author', key: 'author', width: 30 },
          { header: 'Genre', key: 'genre', width: 20 },
          { header: 'Library', key: 'library', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Staff ID', key: 'staffId', width: 15 }
        ];

        // Add data rows
        activities.forEach((activity, index) => {
          try {
            const date = new Date(activity.timestamp);
            worksheet.addRow({
              date: date.toLocaleDateString('en-GB'),
              time: date.toLocaleTimeString('en-GB'),
              action: activity.action || 'N/A',
              bookTitle: activity.book?.title || 'N/A',
              author: activity.book?.author || 'N/A',
              genre: activity.book?.genre || 'N/A',
              library: activity.book?.library || 'N/A',
              status: activity.book?.status || 'N/A',
              staffId: activity.user?.empId || 'N/A'
            });
          } catch (rowError) {
            console.error(`Error adding row ${index}:`, rowError);
          }
        });

      } catch (activityError) {
        console.error('Error fetching activities:', activityError);
        throw activityError;
      }

    } else if (reportType === 'transactions') {
      try {
        console.log('Fetching transactions...');
        // Fetch transactions for the selected month with book and borrow details
        const transactions = await prisma.transaction.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            borrow: {
              include: {
                book: true
              }
            }
          },
          orderBy: {
            date: 'asc'
          }
        });

        console.log('Fetched transactions:', transactions.length);

        // Set up headers for transaction report
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Time', key: 'time', width: 12 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Book Title', key: 'bookTitle', width: 40 },
          { header: 'Author', key: 'author', width: 30 },
          { header: 'Genre', key: 'genre', width: 20 },
          { header: 'Library', key: 'library', width: 15 },
          { header: 'Student Name', key: 'studentName', width: 25 },
          { header: 'GR Number', key: 'grNumber', width: 15 },
          { header: 'Class', key: 'class', width: 15 },
          { header: 'Due Date', key: 'dueDate', width: 15 },
          { header: 'Return Date', key: 'returnDate', width: 15 },
          { header: 'Status', key: 'status', width: 15 }
        ];

        // Add data rows
        transactions.forEach((transaction, index) => {
          try {
            const date = new Date(transaction.date);
            worksheet.addRow({
              date: date.toLocaleDateString('en-GB'),
              time: date.toLocaleTimeString('en-GB'),
              type: transaction.type || 'N/A',
              bookTitle: transaction.borrow?.book?.title || 'N/A',
              author: transaction.borrow?.book?.author || 'N/A',
              genre: transaction.borrow?.book?.genre || 'N/A',
              library: transaction.borrow?.book?.library || 'N/A',
              studentName: transaction.borrow?.borrowerName || 'N/A',
              grNumber: transaction.borrow?.grNumber || 'N/A',
              class: transaction.borrow?.className || 'N/A',
              dueDate: transaction.borrow?.dueDate ? new Date(transaction.borrow.dueDate).toLocaleDateString('en-GB') : 'N/A',
              returnDate: transaction.borrow?.returnDate ? new Date(transaction.borrow.returnDate).toLocaleDateString('en-GB') : 'N/A',
              status: transaction.status || 'N/A'
            });
          } catch (rowError) {
            console.error(`Error adding row ${index}:`, rowError);
          }
        });

      } catch (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        throw transactionError;
      }
    }

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 12);
    });

    console.log('Generating Excel buffer...');
    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('Excel buffer generated successfully');

    // Create the response with appropriate headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportType}_report_${month}.xlsx"`,
        'Access-Control-Allow-Origin': '*'
      }
    });

    return response;

  } catch (error) {
    console.error('Error generating report:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate report',
        details: error.message 
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
 