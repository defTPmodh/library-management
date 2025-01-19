import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const library = searchParams.get('library');
    
    const whereClause = library ? {
      book: {
        library
      }
    } : {};

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        book: true,
        user: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Limit to last 100 activities
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      timestamp: activity.timestamp,
      action: activity.action,
      bookTitle: activity.book?.title || 'Unknown Book',
      bookId: activity.bookId,
      userId: activity.userId,
      library: activity.book?.library,
      staffName: activity.user?.empId
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
    
    if (!action || !bookId || !userId) {
      return NextResponse.json({ 
        error: "Action, bookId, and userId are required" 
      }, { status: 400 });
    }

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
