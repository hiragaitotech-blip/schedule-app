import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import { isSuperAdmin } from "@/src/lib/admin";
import { TenantManagementClient } from "@/src/components/admin/TenantManagementClient";

export default async function AdminTenantsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    redirect("/login?redirectedFrom=/admin/tenants");
  }

  // スーパー管理者チェック
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          テナント管理
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          すべての企業（テナント）を管理します
        </p>
      </header>

      <TenantManagementClient />
    </div>
  );
}


