import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { isSuperAdmin } from "@/src/lib/admin";

/**
 * 全テナント一覧を取得（統計情報含む）
 * GET /api/admin/tenants
 */
export async function GET() {
  try {
    // スーパー管理者チェック
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "スーパー管理者権限が必要です" },
        { status: 403 },
      );
    }

    const supabase = createSupabaseServerClient();

    // テナント一覧を取得（統計情報含む）
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (tenantsError) {
      return NextResponse.json(
        { error: tenantsError.message },
        { status: 500 },
      );
    }

    // 各テナントの統計情報を取得
    const tenantsWithStats = await Promise.all(
      (tenants || []).map(async (tenant) => {
        // ユーザー数
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id);

        // 案件数
        const { count: caseCount } = await supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id);

        return {
          ...tenant,
          user_count: userCount || 0,
          case_count: caseCount || 0,
        };
      }),
    );

    return NextResponse.json({ tenants: tenantsWithStats }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "テナント一覧の取得中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


