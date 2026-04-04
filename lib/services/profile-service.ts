"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  notificationPreferencesSchema,
  profileSchema,
  restModeSchema,
  restModeStartSchema
} from "@/lib/validation/schemas";
import { recordProductEventSafe } from "@/lib/services/product-event-service";
import { clamp } from "@/lib/utils";

export async function updateProfileSettings(input: {
  nickname: string;
  displayName?: string | null;
  bio?: string | null;
  profileVisibility: string;
  notificationOptIn: boolean;
}, userId: string) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-profile");
  }

  const now = new Date().toISOString();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("user_profiles")
    .update({
      nickname: parsed.data.nickname,
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      profile_visibility: parsed.data.profileVisibility,
      notification_opt_in: parsed.data.notificationOptIn,
      updated_at: now
    })
    .eq("id", userId);

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateNotificationPreferences(input: {
  enabled: boolean;
  digestMode: "off" | "light" | "normal";
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  maxDailyNotifications: number;
}, userId: string) {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-notifications");
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      enabled: parsed.data.enabled,
      digest_mode: parsed.data.digestMode,
      quiet_hours_start: parsed.data.quietHoursStart,
      quiet_hours_end: parsed.data.quietHoursEnd,
      max_daily_notifications: parsed.data.maxDailyNotifications,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  revalidatePath("/settings/notifications");
  return { ok: true as const };
}

function resolveRestModeHours(input: { enabled: boolean; hours?: number; duration?: string }) {
  if (!input.enabled) {
    return null;
  }

  if (typeof input.hours === "number") {
    return clamp(input.hours, 1, 168);
  }

  if (input.duration) {
    const numeric = Number(input.duration.slice(0, -1));
    const unit = input.duration.slice(-1);
    if (unit === "d") {
      return clamp(numeric * 24, 1, 168);
    }
    if (unit === "h") {
      return clamp(numeric, 1, 168);
    }
  }

  return 24;
}

export async function updateRestModeSetting(input: {
  enabled: boolean;
  hours?: number;
  duration?: string;
}, userId: string) {
  const parsed = input.duration
    ? restModeStartSchema.safeParse(input)
    : restModeSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("invalid-rest-mode");
  }

  const now = new Date();
  const hours = resolveRestModeHours(input);
  const endsAt = input.enabled && hours
    ? new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
    : null;

  const supabase = await createServerSupabaseClient();
  await supabase.from("rest_mode_settings").upsert(
    {
      user_id: userId,
      enabled: input.enabled,
      started_at: input.enabled ? now.toISOString() : null,
      ends_at: endsAt,
      allow_operational_notifications: true,
      updated_at: now.toISOString()
    },
    { onConflict: "user_id" }
  );

  await supabase
    .from("user_profiles")
    .update({
      rest_mode_enabled: input.enabled,
      updated_at: now.toISOString()
    })
    .eq("id", userId);

  await recordProductEventSafe({
    userId,
    eventKey: input.enabled ? "rest_mode_started" : "rest_mode_ended",
    targetType: "user_profile",
    targetId: userId,
    metadata: {
      endsAt
    }
  });

  revalidatePath("/");
  revalidatePath("/settings/rest-mode");
  return { ok: true as const, endsAt };
}

export async function updateProfileAction(formData: FormData) {
  const { getViewerContext } = await import("@/lib/services/viewer-service");
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in");
  }

  try {
    await updateProfileSettings(
      {
        nickname: String(formData.get("nickname") ?? ""),
        displayName: String(formData.get("displayName") ?? "") || null,
        bio: String(formData.get("bio") ?? "") || null,
        profileVisibility: String(formData.get("profileVisibility") ?? "anonymous"),
        notificationOptIn: formData.get("notificationOptIn") === "on"
      },
      viewer.userId
    );
    redirect("/profile?status=saved");
  } catch {
    redirect("/profile?error=invalid-profile");
  }
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const { getViewerContext } = await import("@/lib/services/viewer-service");
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in");
  }

  try {
    await updateNotificationPreferences(
      {
        enabled: formData.get("enabled") === "on",
        digestMode: String(formData.get("digestMode") ?? "light") as "off" | "light" | "normal",
        quietHoursStart: String(formData.get("quietHoursStart") ?? "") || null,
        quietHoursEnd: String(formData.get("quietHoursEnd") ?? "") || null,
        maxDailyNotifications: Number(formData.get("maxDailyNotifications") ?? 1)
      },
      viewer.userId
    );
    redirect("/settings/notifications?status=saved");
  } catch {
    redirect("/settings/notifications?error=invalid-notifications");
  }
}

export async function updateRestModeAction(formData: FormData) {
  const { getViewerContext } = await import("@/lib/services/viewer-service");
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in");
  }

  try {
    await updateRestModeSetting(
      {
        enabled: formData.get("enabled") === "true",
        hours: Number(formData.get("hours") ?? 24)
      },
      viewer.userId
    );
    redirect("/settings/rest-mode?status=saved");
  } catch {
    redirect("/settings/rest-mode?error=invalid-rest-mode");
  }
}
