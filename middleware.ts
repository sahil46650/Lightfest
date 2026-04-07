import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Route protection configuration
 * - Protected routes require authentication
 * - Auth routes redirect to account if already logged in
 * - Admin routes require ADMIN or SUPER_ADMIN role
 */
const protectedRoutes = [
  '/account',
  '/account/bookings',
  '/account/edit',
  '/account/settings',
]

const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

const adminRoutes = [
  '/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuthenticated = !!token
  const userRole = token?.role as string | undefined

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if the current route is an admin route
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to account
  if (isAuthRoute && isAuthenticated) {
    // Allow reset-password if user has a valid token in the URL
    if (pathname.startsWith('/reset-password/')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/account', request.url))
  }

  // Restrict admin routes to ADMIN and SUPER_ADMIN roles
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      // Redirect non-admin users to home or show forbidden
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
