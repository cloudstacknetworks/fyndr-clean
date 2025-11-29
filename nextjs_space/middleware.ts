import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow unauthenticated access to /supplier/access (magic link endpoint)
    if (path === '/supplier/access') {
      return NextResponse.next();
    }

    // If no token, NextAuth will redirect to login
    if (!token) {
      return NextResponse.next();
    }

    const userRole = token.role || 'buyer'; // Default to buyer if no role

    // Supplier users should only access /supplier routes
    if (userRole === 'supplier' && path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/supplier', req.url));
    }

    // Buyer users should not access /supplier routes (except /supplier/access)
    if (userRole === 'buyer' && path.startsWith('/supplier') && path !== '/supplier/access') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow unauthenticated access to /supplier/access
        if (path === '/supplier/access') {
          return true;
        }

        // All other protected routes require a token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/supplier/:path*'],
};
