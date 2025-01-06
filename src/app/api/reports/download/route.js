import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { reportType, month } = await request.json();
    
    // Parse month string to get year and month
    const [year, month_num] = month.split('-').map(Number);
    const startDate = new Date(year, month_num - 1, 1);
    const endDate = new Date(year, month_num, 0); // Last day of the month

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    if (reportType === 'accession') {
      // Fetch activities for the selected month with book details
      const activities = await prisma.activity.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          book: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

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
        { header: 'Details', key: 'details', width: 40 }
      ];

      // Add data rows
      activities.forEach(activity => {
        const date = new Date(activity.timestamp);
        worksheet.addRow({
          date: date.toLocaleDateString('en-GB'),
          time: date.toLocaleTimeString('en-GB'),
          action: activity.action,
          bookTitle: activity.book?.title || activity.bookTitle || 'N/A',
          author: activity.book?.author || activity.bookAuthor || 'N/A',
          genre: activity.book?.genre || 'N/A',
          library: activity.book?.library || activity.library || 'N/A',
          status: activity.book?.status || 'N/A',
          details: activity.details || 'N/A'
        });
      });

    } else if (reportType === 'transactions') {
      // Fetch transactions for the selected month with book and student details
      const transactions = await prisma.transaction.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          book: true,
          borrow: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Set up headers for transaction report
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 12 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Book Title', key: 'bookTitle', width: 40 },
        { header: 'Author', key: 'author', width: 30 },
        { header: 'Genre', key: 'genre', width: 20 },
        { header: 'Library', key: 'library', width: 15 },
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
        { header: 'Return Date', key: 'returnDate', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      // Add data rows
      transactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        worksheet.addRow({
          date: date.toLocaleDateString('en-GB'),
          time: date.toLocaleTimeString('en-GB'),
          type: transaction.type,
          bookTitle: transaction.book?.title || 'N/A',
          author: transaction.book?.author || 'N/A',
          genre: transaction.book?.genre || 'N/A',
          library: transaction.book?.library || 'N/A',
          studentId: transaction.studentId || 'N/A',
          studentName: transaction.studentName || 'N/A',
          class: transaction.borrow?.className || 'N/A',
          dueDate: transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('en-GB') : 'N/A',
          returnDate: transaction.returnDate ? new Date(transaction.returnDate).toLocaleDateString('en-GB') : 'N/A',
          status: transaction.status || 'N/A'
        });
      });
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

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Create the response with appropriate headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportType}_report_${month}.xlsx"`
      }
    });

    return response;

  } catch (error) {
    console.error('Error generating report:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 