"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAppUrl,
  hasSupabaseEnv,
  sanitizeNextPath
} from "@/lib/supabase/env";
import { getOperatorAccess } from "@/lib/services/operator-access-service";
import {
  operatorPasswordSignInSchema,
  signInRequestSchema
} from "@/lib/validation/schemas";
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
  const redirectTo = new URL("/auth/callback", getAppUrl());
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

  await recordSignupCompletedIfNeeded();
}

export async function exchangeTokenHashForSession(input: {
  tokenHash: string;
  type: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: input.tokenHash,
    type: input.type as never
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordSignupCompletedIfNeeded();
}

async function recordSignupCompletedIfNeeded() {
  const supabase = await createServerSupabaseClient();

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "request-failed";
    redirect(`/auth/sign-in?error=${encodeURIComponent(message)}`);
  }

  redirect("/auth/sign-in?status=check-email");
}

export async function operatorPasswordSignInAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/auth/sign-in?error=missing-env");
  }

  const parsed = operatorPasswordSignInSchema.safeParse({
    email: String(formData.get("operatorEmail") ?? ""),
    password: String(formData.get("operatorPassword") ?? ""),
    next: String(formData.get("next") ?? "/")
  });

  if (!parsed.success) {
    redirect("/auth/sign-in?error=invalid-operator-login");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user?.id) {
    redirect("/auth/sign-in?error=operator-login-failed");
  }

  const operatorAccess = await getOperatorAccess(data.user.id);
  if (!operatorAccess) {
    await supabase.auth.signOut();
    redirect("/auth/sign-in?error=operator-access-required");
  }

  await recordProductEventSafe({
    userId: data.user.id,
    eventKey: "signup_completed",
    targetType: "auth",
    targetId: data.user.id,
    metadata: {
      method: "operator-password"
    }
  });

  redirect(sanitizeNextPath(parsed.data.next) as Route);
}

export async function signOutAction() {
  await signOutCurrentSession();
  redirect("/");
}
