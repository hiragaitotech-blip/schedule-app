import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabaseClient";
import type {
  CandidateAvailabilityInsert,
  Slot,
} from "@/src/types/database";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.case_id !== "string" ||
    !Array.isArray(body.slot_ids) ||
    body.slot_ids.length === 0
  ) {
    return NextResponse.json(
      { error: "case_id と slot_ids を指定してください。" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { case_id, slot_ids, candidate_name, email } = body as {
    case_id: string;
    slot_ids: string[];
    candidate_name?: string;
    email?: string;
  };

  const { data: slots, error: slotError } = await supabase
    .from("slots")
    .select("id")
    .in("id", slot_ids)
    .eq("case_id", case_id);

  if (slotError) {
    return NextResponse.json({ error: slotError.message }, { status: 500 });
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json(
      { error: "有効な候補枠が見つかりませんでした。" },
      { status: 400 },
    );
  }

  const payload: CandidateAvailabilityInsert[] = slots.map((slot) => ({
    case_id,
    slot_id: slot.id,
    candidate_name: candidate_name?.trim() || null,
    email: email?.trim() || null,
    status: "available",
  }));

  const { data, error } = await supabase
    .from("candidate_availabilities")
    .insert(payload)
    .select("slot_id");

  if (error) {
    const message =
      error.code === "23505"
        ? "すでに同じメールで回答済みです。"
        : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ slot_ids: data?.map((row) => row.slot_id) }, { status: 201 });
}

