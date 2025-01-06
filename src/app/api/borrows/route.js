import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const borrows = await prisma.borrow.findMany({
      include: { book: true }
    });
    console.log("API: Fetched borrows:", borrows);
    return NextResponse.json(borrows);
  } catch (error) {
    console.error("Error fetching borrows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const borrowData = await request.json();
    console.log("API: Creating new borrow:", borrowData);

    // Create the borrow record
    const newBorrow = await prisma.borrow.create({
      data: {
        bookId: parseInt(borrowData.bookId),
        borrowerName: borrowData.borrowerName,
        grNumber: borrowData.grNumber,
        className: borrowData.className,
        status: "borrowed",
        borrowDate: new Date(borrowData.borrowDate),
        dueDate: new Date(borrowData.dueDate)
      },
      include: { book: true }
    });

    // Create a transaction record for the borrow
    await prisma.transaction.create({
      data: {
        borrowId: newBorrow.id,
        type: "borrow",
        status: "completed"
      }
    });

    return NextResponse.json(newBorrow);
  } catch (error) {
    console.error("API: Error creating borrow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 