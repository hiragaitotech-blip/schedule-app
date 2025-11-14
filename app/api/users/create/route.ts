import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/src/lib/supabaseClient";
import type { ProfileInsert } from "@/src/types/database";

function generateTemporaryPassword(length: number = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, role, tenant_id } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 },
      );
    }

    if (role && !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "ロールは admin または member である必要があります" },
        { status: 400 },
      );
    }

    const temporaryPassword = generateTemporaryPassword();

    const adminClient = createSupabaseAdminClient();
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: temporaryPassword,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました" },
        { status: 500 },
      );
    }

    const profileInsert: ProfileInsert = {
      id: authData.user.id,
      tenant_id: tenant_id || currentProfile.tenant_id,
      role: role || "member",
      is_active: true,
    };

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert(profileInsert)
      .select()
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: profileData.role,
        },
        password: temporaryPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "ユーザー作成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

