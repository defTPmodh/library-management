import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { compare } from "bcrypt";

export async function POST(request) {
  try {
    const { employeeId, password } = await request.json();
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { empId: employeeId }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare passwords
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 