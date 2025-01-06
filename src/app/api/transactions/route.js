import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        borrow: {
          include: {
            book: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      status: transaction.status,
      bookTitle: transaction.borrow.book.title,
      borrowerName: transaction.borrow.borrowerName
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { borrowId, type, status } = await request.json();
    
    const transaction = await prisma.transaction.create({
      data: {
        borrowId: parseInt(borrowId),
        type,
        status
      },
      include: {
        borrow: {
          include: {
            book: true
          }
        }
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 