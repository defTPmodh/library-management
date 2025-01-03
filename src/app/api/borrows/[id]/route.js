import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    console.log("Updating borrow record ID:", id);
    
    // Update the borrow record directly using its ID
    const updatedBorrow = await prisma.borrow.update({
      where: { 
        id: parseInt(id)
      },
      data: {
        status: "returned",
        returnDate: new Date()
      }
    });

    console.log("Updated borrow record:", updatedBorrow);
    return NextResponse.json(updatedBorrow);
  } catch (error) {
    console.error('Return book error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
} 