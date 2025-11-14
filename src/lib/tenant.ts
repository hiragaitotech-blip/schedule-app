import { createSupabaseServerClient } from "./supabaseClient";
import { cookies } from "next/headers";

/**
 * 現在ログインしているユーザーのtenant_idを取得
 * @returns tenant_id または null（未認証の場合）
 */
export async function getCurrentUserTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  return profile?.tenant_id ?? null;
}

/**
 * 案件へのアクセス権限を確認
 * @param caseId 案件ID
 * @param tenantId テナントID
 * @returns アクセス可能な場合 true
 */
export async function verifyCaseAccess(
  caseId: string,
  tenantId: string | null,
): Promise<boolean> {
  if (!tenantId) return false;

  const supabase = createSupabaseServerClient();
  const { data: caseData } = await supabase
    .from("cases")
    .select("tenant_id")
    .eq("id", caseId)
    .single();

  return caseData?.tenant_id === tenantId;
}

/**
 * スロットへのアクセス権限を確認
 * @param slotId スロットID
 * @param tenantId テナントID
 * @returns アクセス可能な場合 true
 */
export async function verifySlotAccess(
  slotId: string,
  tenantId: string | null,
): Promise<boolean> {
  if (!tenantId) return false;

  const supabase = createSupabaseServerClient();
  const { data: slot } = await supabase
    .from("slots")
    .select("case_id, cases!inner(tenant_id)")
    .eq("id", slotId)
    .single();

  if (!slot || !("cases" in slot)) {
    return false;
  }

  const caseData = slot.cases as { tenant_id: string | null };
  return caseData.tenant_id === tenantId;
}

/**
 * 現在のユーザー情報とプロフィールを取得
 * @returns { user, profile } または null
 */
export async function getCurrentUserWithProfile(): Promise<{
  user: { id: string; email?: string };
  profile: { tenant_id: string | null; role: string | null };
} | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    user: { id: user.id, email: user.email },
    profile: {
      tenant_id: profile.tenant_id,
      role: profile.role,
    },
  };
}

