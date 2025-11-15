import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/src/lib/supabaseClient";
import type { TenantInsert } from "@/src/types/database";

/**
 * 新しいテナント（企業）と初期管理者アカウントを作成
 * 
 * リクエストボディ:
 * {
 *   tenant_name: string,        // テナント名（企業名）
 *   admin_email: string,        // 管理者のメールアドレス
 *   admin_password?: string    // 管理者のパスワード（省略時は自動生成）
 * }
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 管理者チェック（オプション: スーパー管理者のみ許可する場合は実装）
    // 現時点では、認証済みユーザーであれば誰でも作成可能
    // 本番環境では、スーパー管理者のみが実行可能にすることを推奨

    const body = await request.json();
    const { tenant_name, admin_email, admin_password } = body;

    if (!tenant_name || typeof tenant_name !== "string") {
      return NextResponse.json(
        { error: "テナント名が必要です" },
        { status: 400 },
      );
    }

    if (!admin_email || typeof admin_email !== "string") {
      return NextResponse.json(
        { error: "管理者のメールアドレスが必要です" },
        { status: 400 },
      );
    }

    const adminClient = createSupabaseAdminClient();

    // 1. テナントを作成
    // mailbox_address を生成（形式: tenant-{tenant_idの最初の8文字}@example.com）
    // 実際の本番環境では、適切なドメインを使用してください
    const mailboxAddress = `tenant-${Date.now().toString(36)}@example.com`;
    
    const tenantInsert: TenantInsert = {
      name: tenant_name.trim(),
      mailbox_address: mailboxAddress,
      is_active: true,
    };

    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .insert(tenantInsert)
      .select("id, name")
      .single();

    if (tenantError) {
      return NextResponse.json(
        { error: `テナント作成に失敗しました: ${tenantError.message}` },
        { status: 500 },
      );
    }

    if (!tenantData) {
      return NextResponse.json(
        { error: "テナント作成に失敗しました" },
        { status: 500 },
      );
    }

    // 2. 管理者アカウントを作成
    const finalPassword =
      admin_password && admin_password.length >= 8
        ? admin_password
        : generateTemporaryPassword();

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: admin_email.trim().toLowerCase(),
        password: finalPassword,
        email_confirm: true,
      });

    if (authError) {
      // テナント作成に失敗した場合はロールバック（オプション）
      // await supabase.from("tenants").delete().eq("id", tenantData.id);
      return NextResponse.json(
        { error: `管理者アカウント作成に失敗しました: ${authError.message}` },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "管理者アカウント作成に失敗しました" },
        { status: 500 },
      );
    }

    // 3. プロフィールを作成
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        tenant_id: tenantData.id,
        role: "admin",
        is_active: true,
      })
      .select("id, tenant_id, role")
      .single();

    if (profileError) {
      // ロールバック: 作成したユーザーとテナントを削除
      await adminClient.auth.admin.deleteUser(authData.user.id);
      await supabase.from("tenants").delete().eq("id", tenantData.id);
      return NextResponse.json(
        { error: `プロフィール作成に失敗しました: ${profileError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        tenant: {
          id: tenantData.id,
          name: tenantData.name,
        },
        admin: {
          id: authData.user.id,
          email: authData.user.email,
          role: profileData.role,
        },
        password: finalPassword,
        message: "テナントと管理者アカウントを作成しました",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "テナント作成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateTemporaryPassword(length: number = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

