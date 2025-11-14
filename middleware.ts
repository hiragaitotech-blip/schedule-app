import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/cases", "/settings", "/admin"];
const PROTECTED_API_PATHS = [
  "/api/create-case-from-email",
  "/api/cases",
  "/api/users",
  "/api/tenants",
  "/api/admin",
];

// 一般公開を禁止するパス（管理者のみアクセス可能）
const ADMIN_ONLY_PATHS = ["/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 一般公開を禁止するパス（管理者のみアクセス可能）
  const isAdminOnly = ADMIN_ONLY_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isAdminOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requiresAuth = PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );

  const isProtectedApi = PROTECTED_API_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  if (requiresAuth || isProtectedApi) {
    const accessToken = request.cookies.get("sb-access-token")?.value;

    if (!accessToken) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "認証が必要です。" },
          { status: 401 },
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/cases/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/signup",
    "/api/create-case-from-email",
    "/api/cases/:path*",
    "/api/users/:path*",
    "/api/tenants/:path*",
    "/api/admin/:path*",
  ],
};

