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
import { submitBetaApplication } from "@/lib/services/beta-access-service";
import {
  operatorPasswordSignInSchema,
  passwordSignInSchema,
  passwordSignUpSchema,
  socialSignInSchema
} from "@/lib/validation/schemas";
import { recordProductEventSafe } from "@/lib/services/product-event-service";

const PASSWORD_SIGNUP_BETA_NOTE =
  "회원가입으로 생성된 베타 승인 대기 요청입니다. 운영자 승인 후 사용 가능합니다.";

export async function requestSignInLink(input: { email: string; next?: string }) {
  void input;
  throw new Error("magic-link-disabled");
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
  void formData;
  redirect("/auth/sign-in?error=magic-link-disabled");
}

export async function passwordSignInAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/auth/sign-in?error=missing-env");
  }

  const parsed = passwordSignInSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "/")
  });

  if (!parsed.success) {
    redirect("/auth/sign-in?error=invalid-password-login");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user?.id) {
    redirect("/auth/sign-in?error=password-login-failed");
  }

  await recordProductEventSafe({
    userId: data.user.id,
    eventKey: "signup_completed",
    targetType: "auth",
    targetId: data.user.id,
    metadata: {
      method: "password"
    }
  });

  redirect(sanitizeNextPath(parsed.data.next) as Route);
}

export async function passwordSignUpAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/auth/sign-up?error=missing-env" as Route);
  }

  const parsed = passwordSignUpSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    next: String(formData.get("next") ?? "/beta/apply")
  });

  if (!parsed.success) {
    redirect("/auth/sign-up?error=invalid-sign-up" as Route);
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = new URL("/auth/callback", getAppUrl());
  redirectTo.searchParams.set("next", sanitizeNextPath(parsed.data.next));
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: redirectTo.toString()
    }
  });

  if (error || !data.user?.id) {
    redirect("/auth/sign-up?error=sign-up-failed" as Route);
  }

  await recordProductEventSafe({
    userId: data.user.id,
    eventKey: "signup_started",
    targetType: "auth",
    targetId: data.user.id,
    metadata: {
      method: "password",
      next: sanitizeNextPath(parsed.data.next)
    }
  });

  await submitBetaApplication({
    email: parsed.data.email,
    applicantName: null,
    applicationNote: PASSWORD_SIGNUP_BETA_NOTE,
    userId: data.user.id
  });

  if (data.session) {
    redirect("/beta/apply" as Route);
  }

  redirect(
    `/auth/sign-in?status=signup-pending&next=${encodeURIComponent("/beta/apply")}`
  );
}

export async function socialSignInAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/auth/sign-in?error=missing-env");
  }

  const parsed = socialSignInSchema.safeParse({
    provider: String(formData.get("provider") ?? ""),
    next: String(formData.get("next") ?? "/")
  });

  if (!parsed.success) {
    redirect("/auth/sign-in?error=invalid-social-provider");
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = new URL("/auth/callback", getAppUrl());
  redirectTo.searchParams.set("next", sanitizeNextPath(parsed.data.next));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: {
      redirectTo: redirectTo.toString()
    }
  });

  if (error || !data.url) {
    redirect("/auth/sign-in?error=social-login-unavailable");
  }

  await recordProductEventSafe({
    eventKey: "signup_started",
    targetType: "auth",
    metadata: {
      method: parsed.data.provider,
      next: sanitizeNextPath(parsed.data.next)
    }
  });

  redirect(data.url as Route);
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
