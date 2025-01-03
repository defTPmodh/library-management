import { NextResponse } from "next/server";

export function middleware(request) {
  const isLoggedIn = request.cookies.get("isLoggedIn");
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (pathname === "/" || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 