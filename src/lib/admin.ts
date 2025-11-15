import { createSupabaseServerClient } from "./supabaseClient";
import { cookies } from "next/headers";

/**
 * スーパー管理者のメールアドレスを取得
 * 環境変数 SUPER_ADMIN_EMAIL から取得
 */
function getSuperAdminEmail(): string | null {
  return process.env.SUPER_ADMIN_EMAIL || null;
}

/**
 * ユーザーがsystemロールかどうかを判定
 * @param userId ユーザーID
 * @returns systemロールの場合 true
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  
  return profile?.role === "system";
}

/**
 * 現在のユーザーがスーパー管理者かどうかを判定
 * @returns スーパー管理者の場合 true
 */
export async function isSuperAdmin(): Promise<boolean> {
  const superAdminEmail = getSuperAdminEmail();
  
  if (!superAdminEmail) {
    // 環境変数が設定されていない場合は、スーパー管理者機能を無効化
    return false;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return false;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return false;
  }

  // メールアドレスがスーパー管理者のメールアドレスと一致するか確認
  return user.email?.toLowerCase() === superAdminEmail.toLowerCase();
}


