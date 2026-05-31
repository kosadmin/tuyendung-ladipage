import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Bật/tắt chế độ bảo trì tại đây ───────────────────────────────────────
const MAINTENANCE_MODE = true;
// ─────────────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Cho phép truy cập chính trang maintenance (tránh redirect loop)
  // và các static asset cần thiết
  if (
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/banners')
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
