import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        book: true,
        user: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      timestamp: activity.timestamp,
      action: activity.action,
      bookTitle: activity.book.title,
      userId: activity.userId
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, bookId, userId } = await request.json();
    
    const activity = await prisma.activity.create({
      data: {
        action,
        bookId: parseInt(bookId),
        userId
      },
      include: {
        book: true,
        user: true
      }
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 