import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { compare } from "bcrypt";

export async function POST(request) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const { employeeId, password } = await request.json();
    
    if (!employeeId || !password) {
      return NextResponse.json(
        { error: "Employee ID and password are required" }, 
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { empId: employeeId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Compare passwords
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Set cookie for authentication
    const response = NextResponse.json({ 
      success: true, 
      library: user.library 
    });
    
    response.cookies.set('isLoggedIn', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Detailed auth error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
