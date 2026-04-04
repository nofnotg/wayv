"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthCallbackUrl,
  hasSupabaseEnv,
  sanitizeNextPath
} from "@/lib/supabase/env";
import { signInRequestSchema } from "@/lib/validation/schemas";
import { recordProductEventSafe } from "@/lib/services/product-event-service";

export async function requestSignInLink(input: { email: string; next?: string }) {
  if (!hasSupabaseEnv()) {
    throw new Error("missing-env");
  }

  const parsed = signInRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-email");
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = new URL(getAuthCallbackUrl());
  redirectTo.searchParams.set("next", sanitizeNextPath(parsed.data.next));

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectTo.toString()
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordProductEventSafe({
    eventKey: "signup_started",
    targetType: "auth",
    metadata: {
      next: sanitizeNextPath(parsed.data.next)
    }
  });

  return {
    ok: true as const,
    email: parsed.data.email,
    next: sanitizeNextPath(parsed.data.next)
  };
}

export async function exchangeAuthCodeForSession(code: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    await recordProductEventSafe({
      userId: user.id,
      eventKey: "signup_completed",
      targetType: "auth",
      targetId: user.id
    });
  }
}

export async function signOutCurrentSession() {
  if (!hasSupabaseEnv()) {
    return { ok: true as const };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function requestSignInLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const next = String(formData.get("next") ?? "/");

  try {
    await requestSignInLink({ email, next });
    redirect("/auth/sign-in?status=check-email");
  } catch (error) {
    const message = error instanceof Error ? error.message : "request-failed";
    redirect(`/auth/sign-in?error=${encodeURIComponent(message)}`);
  }
}

export async function signOutAction() {
  await signOutCurrentSession();
  redirect("/");
}
