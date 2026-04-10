import { cache } from "react";

import type {
  BetaAccessRequest,
  NotificationPreference,
  RestModeSetting,
  UserProfile
} from "@/lib/domain/types";
import { getOrCreateViewerBetaAccess } from "@/lib/services/beta-access-service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deriveNickname } from "@/lib/utils";

export type ViewerContext = {
  userId: string;
  email: string;
  profile: UserProfile;
  betaAccess: BetaAccessRequest;
  notificationPreferences: NotificationPreference | null;
  restMode: RestModeSetting | null;
};

function mapProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    nickname: String(row.nickname),
    displayName: (row.display_name as string | null) ?? null,
    profileVisibility: row.profile_visibility as UserProfile["profileVisibility"],
    avatarUrl: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    onboardingCompletedAt: (row.onboarding_completed_at as string | null) ?? null,
    restModeEnabled: Boolean(row.rest_mode_enabled),
    notificationOptIn: Boolean(row.notification_opt_in),
    lastActiveAt: (row.last_active_at as string | null) ?? null
  };
}

export const getViewerContext = cache(async (): Promise<ViewerContext | null> => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const now = new Date().toISOString();

  await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email: user.email,
      nickname: deriveNickname(user.email),
      profile_visibility: "anonymous",
      notification_opt_in: true,
      last_active_at: now
    },
    { onConflict: "id" }
  );

  await supabase
    .from("notification_preferences")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  await supabase
    .from("rest_mode_settings")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  const [{ data: profile }, { data: notificationPreferences }, { data: restMode }] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase.from("rest_mode_settings").select("*").eq("user_id", user.id).single()
    ]);

  const betaAccess = await getOrCreateViewerBetaAccess({
    userId: user.id,
    email: user.email
  });

  if (!profile) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    profile: mapProfileRow(profile),
    betaAccess,
    notificationPreferences: notificationPreferences
      ? {
          userId: String(notificationPreferences.user_id),
          enabled: Boolean(notificationPreferences.enabled),
          digestMode: notificationPreferences.digest_mode,
          quietHoursStart: notificationPreferences.quiet_hours_start,
          quietHoursEnd: notificationPreferences.quiet_hours_end,
          maxDailyNotifications: Number(notificationPreferences.max_daily_notifications)
        }
      : null,
    restMode: restMode
      ? {
          userId: String(restMode.user_id),
          enabled: Boolean(restMode.enabled),
          startedAt: restMode.started_at,
          endsAt: restMode.ends_at,
          allowOperationalNotifications: Boolean(restMode.allow_operational_notifications)
        }
      : null
  };
});
