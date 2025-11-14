import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/src/lib/admin";

/**
 * 現在のユーザーがスーパー管理者かどうかを確認するAPI
 * GET /api/admin/check-super-admin
 */
export async function GET() {
  try {
    const isAdmin = await isSuperAdmin();
    return NextResponse.json({ isSuperAdmin: isAdmin }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 });
  }
}


