import { z } from "zod";

import {
  emotionTagValues,
  notificationDigestModeValues,
  notificationPlatformValues,
  profileVisibilityValues,
  waveCategoryValues
} from "@/lib/domain/types";

export const nextPathSchema = z
  .string()
  .trim()
  .default("/")
  .refine((value) => value.startsWith("/") && !value.startsWith("//"), {
    message: "next path must be a local path"
  });

export const emailSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해 주세요.")
});

export const signInRequestSchema = emailSchema.extend({
  next: nextPathSchema.optional()
});

export const profileSchema = z.object({
  nickname: z.string().trim().min(2).max(24),
  displayName: z.string().trim().max(40).nullable().optional(),
  bio: z.string().trim().max(200).nullable().optional(),
  profileVisibility: z.enum(profileVisibilityValues),
  notificationOptIn: z.boolean().default(true)
});

export const notificationPreferencesSchema = z.object({
  enabled: z.boolean(),
  digestMode: z.enum(notificationDigestModeValues),
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),
  maxDailyNotifications: z.number().int().min(0).max(5)
});

export const restModeSchema = z.object({
  enabled: z.boolean(),
  hours: z.number().int().min(1).max(168).optional()
});

export const restModeStartSchema = z.object({
  hours: z.number().int().min(1).max(168).optional(),
  duration: z
    .string()
    .regex(/^\d+[hd]$/)
    .optional()
});

export const onboardingAnswerSchema = z.object({
  questionKey: z.string().min(1),
  value: z.union([z.string(), z.array(z.string()), z.number(), z.null()]),
  skipped: z.boolean().optional()
});

export const onboardingSubmissionSchema = z.object({
  answers: z.array(onboardingAnswerSchema).min(1)
});

export const wavePostSchema = z.object({
  title: z.string().trim().max(80).nullable().optional(),
  body: z.string().trim().min(20).max(4000),
  categories: z.array(z.enum(waveCategoryValues)).min(1).max(3),
  emotionTags: z.array(z.enum(emotionTagValues)).max(3).default([]),
  visibility: z.enum(["public", "private_archive"]).default("public")
});

export const notificationDeviceSchema = z.object({
  platform: z.enum(notificationPlatformValues),
  deviceToken: z.string().trim().min(8),
  pushProvider: z.string().trim().max(40).nullable().optional(),
  appBuild: z.string().trim().max(40).nullable().optional(),
  deviceLabel: z.string().trim().max(80).nullable().optional(),
  isActive: z.boolean().default(true)
});
