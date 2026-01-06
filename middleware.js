import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/'];
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get authentication status from cookies or headers
  // Note: This is a simplified version. In production, you'd verify the Firebase token
  const hasAuthCookie = request.cookies.has('authToken');
  
  // Redirect unauthenticated users to login
  if (!isPublicRoute && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
};