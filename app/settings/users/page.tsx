import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/src/lib/supabaseClient";
import type { Profile } from "@/src/types/database";
import { UserManagementClient } from "@/src/components/users/UserManagementClient";

export default async function UsersPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    redirect("/login?redirectedFrom=/settings/users");
  }

  // アクセストークンからユーザー情報を取得
  const adminClient = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(accessToken);

  if (userError || !user) {
    redirect("/login?redirectedFrom=/settings/users");
  }

  const supabase = createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  let usersWithEmail: Array<Profile & { email: string }> = [];

  try {
    const { data: authUsers } = await adminClient.auth.admin.listUsers();

    usersWithEmail = (users || []).map((profile) => {
      const authUser = authUsers?.users.find((u) => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || "不明",
      };
    });
  } catch (error) {
    console.error("Failed to fetch auth users:", error);
    // フォールバック: メールアドレスなしで表示
    usersWithEmail = (users || []).map((profile) => ({
      ...profile,
      email: "取得失敗",
    }));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          ユーザー管理
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          テナント内のユーザーを管理します
        </p>
      </header>

      <UserManagementClient
        currentUserId={user.id}
        users={usersWithEmail}
        tenantId={profile.tenant_id}
      />
    </div>
  );
}

