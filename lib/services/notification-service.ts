import type { NotificationDevice } from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notificationDeviceSchema } from "@/lib/validation/schemas";

export async function upsertNotificationDevice(input: {
  platform: "web" | "ios" | "android";
  deviceToken: string;
  pushProvider?: string | null;
  appBuild?: string | null;
  deviceLabel?: string | null;
  isActive?: boolean;
}, userId: string) {
  const parsed = notificationDeviceSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-device");
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  await supabase.from("notification_devices").upsert(
    {
      user_id: userId,
      platform: parsed.data.platform,
      device_token: parsed.data.deviceToken,
      push_provider: parsed.data.pushProvider ?? null,
      app_build: parsed.data.appBuild ?? null,
      device_label: parsed.data.deviceLabel ?? null,
      is_active: parsed.data.isActive,
      last_seen_at: now,
      updated_at: now
    },
    { onConflict: "user_id,platform,device_token" }
  );

  return { ok: true as const };
}

export async function getNotificationDevices(userId: string): Promise<NotificationDevice[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("notification_devices")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    platform: row.platform,
    pushProvider: row.push_provider,
    deviceToken: row.device_token,
    appBuild: row.app_build,
    deviceLabel: row.device_label,
    isActive: Boolean(row.is_active),
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
