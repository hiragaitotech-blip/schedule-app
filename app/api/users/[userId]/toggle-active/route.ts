import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> | { userId: string } },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.userId;

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

    if (userId === user.id) {
      return NextResponse.json(
        { error: "自分自身を無効化することはできません" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active は boolean である必要があります" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active })
      .eq("id", userId)
      .eq("tenant_id", currentProfile.tenant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

