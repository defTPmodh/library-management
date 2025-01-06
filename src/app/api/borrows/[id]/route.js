import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status, returnDate } = await request.json();
    console.log("Updating borrow record ID:", id);
    
    // Update the borrow record with return date
    const updatedBorrow = await prisma.borrow.update({
      where: { 
        id: parseInt(id)
      },
      data: {
        status,
        returnDate: returnDate ? new Date(returnDate) : new Date()
      }
    });

    // Create a transaction record for the return
    await prisma.transaction.create({
      data: {
        borrowId: parseInt(id),
        type: "return",
        status: "completed"
      }
    });

    console.log("Updated borrow record:", updatedBorrow);
    return NextResponse.json(updatedBorrow);
  } catch (error) {
    console.error('Return book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 