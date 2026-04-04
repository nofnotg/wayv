import { createAdminSupabaseClient } from "@/lib/supabase/server";

type OperatorAccess = {
  userId: string;
  role: "operator" | "admin";
  isActive?: boolean;
};

function mapOperatorRow(row: Record<string, unknown>): OperatorAccess {
  return {
    userId: String(row.user_id),
    role: row.role as OperatorAccess["role"]
  };
}

export async function getOperatorAccess(userId: string): Promise<OperatorAccess | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("internal_operators")
    .select("user_id, role, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapOperatorRow(data as Record<string, unknown>);
}

export async function upsertOperatorAccess(input: {
  userId: string;
  role: "operator" | "admin";
  isActive?: boolean;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("internal_operators")
    .upsert(
      {
        user_id: input.userId,
        role: input.role,
        is_active: input.isActive ?? true
      },
      { onConflict: "user_id" }
    )
    .select("user_id, role, is_active")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "operator-access-upsert-failed");
  }

  return {
    ...mapOperatorRow(data as Record<string, unknown>),
    isActive: Boolean((data as { is_active?: boolean }).is_active)
  };
}
