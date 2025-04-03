import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/authUtils';

// Define paths that require authentication
const protectedPaths = [
    '/api/patients', 
    '/api/visits',   
    '/api/appointments',
];

export async function middleware(request: NextRequest) {
  console.log('[Middleware] Minimal middleware running for path:', request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname;

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected) {
    try {
        const rawToken = request.headers.get('authorization')?.split(' ')[1];
        console.log('[Middleware] Token found:', rawToken ? 'Yes' : 'No');
        
        if (!rawToken) {
           return NextResponse.json({ message: 'Authentication token missing' }, { status: 401 });
        }
        const decoded = verifyToken(rawToken);
        console.log('[Middleware] Decoded Token:', decoded);
        
        const requestHeaders = new Headers(request.headers);
        let doctorIdSet = false;
        if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
            const doctorId = decoded.id as string;
            requestHeaders.set('X-Doctor-ID', doctorId);
            doctorIdSet = true;
            console.log(`[Middleware] Set X-Doctor-ID header to: ${doctorId}`);
        } else {
           console.log('[Middleware] Could not extract doctor ID from token payload.');
        }
        
        return NextResponse.next({ 
          request: {
            headers: requestHeaders,
          }
        });
  
      } catch (error: any) {
        console.error('[Middleware] Token Verification Error:', error);
        let message = 'Invalid or expired token';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired';
        }
        return NextResponse.json({ message }, { status: 401 });
      }
  }

  return NextResponse.next();
}

// Keep the config
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/signup).*)',
  ],
}; 