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
      // Fetch activities for the selected month
      const activities = await prisma.activity.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Set up headers for accession register
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Book Title', key: 'bookTitle', width: 30 },
        { header: 'Author', key: 'author', width: 20 },
        { header: 'Library', key: 'library', width: 15 },
        { header: 'Details', key: 'details', width: 40 }
      ];

      // Add data rows
      activities.forEach(activity => {
        worksheet.addRow({
          date: activity.timestamp.toLocaleDateString('en-GB'),
          action: activity.action,
          bookTitle: activity.bookTitle,
          author: activity.bookAuthor,
          library: activity.library,
          details: activity.details
        });
      });

    } else if (reportType === 'transactions') {
      // Fetch transactions for the selected month
      const transactions = await prisma.transaction.findMany({
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

      // Set up headers for transaction report
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Book Title', key: 'bookTitle', width: 30 },
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 20 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      // Add data rows
      transactions.forEach(transaction => {
        worksheet.addRow({
          date: transaction.timestamp.toLocaleDateString('en-GB'),
          type: transaction.type,
          bookTitle: transaction.book.title,
          studentId: transaction.studentId,
          studentName: transaction.studentName,
          dueDate: transaction.dueDate?.toLocaleDateString('en-GB') || '-',
          status: transaction.status
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