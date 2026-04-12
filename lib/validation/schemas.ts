import { z } from "zod";

import {
  betaAccessStatusValues,
  betaFeedbackCategoryValues,
  contentGuardrailActionValues,
  contentGuardrailReasonValues,
  contentGuardrailTargetTypeValues,
  emotionTagValues,
  moderationStatusValues,
  moderationReportReasonValues,
  notificationDigestModeValues,
  notificationEventStateValues,
  notificationPlatformValues,
  profileVisibilityValues,
  productEventKeyValues,
  seedAuthorTypeValues,
  waveReactionTypeValues,
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

export const betaApplicationSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
  applicantName: z.string().trim().min(1).max(40).nullable().optional(),
  applicationNote: z.string().trim().min(8).max(600)
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

export const reactionMutationSchema = z.object({
  reactionType: z.enum(waveReactionTypeValues)
});

export const commentSchema = z.object({
  body: z.string().trim().min(2).max(220)
});

export const feedbackSubmissionSchema = z.object({
  category: z.enum(betaFeedbackCategoryValues),
  message: z.string().trim().min(4).max(1000),
  pagePath: nextPathSchema.nullable().optional(),
  contactEmail: z
    .string()
    .trim()
    .email("올바른 이메일을 입력해 주세요.")
    .nullable()
    .optional()
});

export const seedWavePostImportSchema = z.object({
  entries: z.array(
    z.object({
      authorUserId: z.string().uuid(),
      title: z.string().trim().max(80).nullable().optional(),
      body: z.string().trim().min(20).max(4000),
      categories: z.array(z.enum(waveCategoryValues)).min(1).max(3),
      emotionTags: z.array(z.enum(emotionTagValues)).max(3).default([]),
      visibility: z.enum(["public", "private_archive"]).default("public"),
      seedBatch: z.string().trim().min(1).max(80),
      seedAuthorType: z.enum(seedAuthorTypeValues)
    })
  )
});

export const moderationReportSchema = z.object({
  reasonKey: z.enum(moderationReportReasonValues),
  note: z.string().trim().max(280).nullable().optional()
});

export const moderationUpdateSchema = z.object({
  status: z.enum(moderationStatusValues)
});

export const notificationDeviceSchema = z.object({
  platform: z.enum(notificationPlatformValues),
  deviceToken: z.string().trim().min(8),
  pushProvider: z.string().trim().max(40).nullable().optional(),
  appBuild: z.string().trim().max(40).nullable().optional(),
  deviceLabel: z.string().trim().max(80).nullable().optional(),
  isActive: z.boolean().default(true)
});

export const notificationDeliveryClaimSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  userId: z.string().uuid().optional(),
  channel: z.enum(["inapp", "email", "push"]).optional(),
  claimTtlMinutes: z.number().int().min(1).max(60).optional()
});

export const notificationDeliveryOutcomeSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1).max(100),
  claimToken: z.string().uuid(),
  outcome: z.enum(["sent", "failed", "retryable"]),
  retryAfterMinutes: z.number().int().min(1).max(1440).optional(),
  lastError: z.string().trim().max(500).optional()
});

export const notificationDeliveryRunSchema = notificationDeliveryClaimSchema.extend({
  retryAfterMinutes: z.number().int().min(1).max(1440).optional()
});

export const notificationDeliveryControlSchema = z.object({
  action: z.enum(["requeue", "release_expired_claim"]),
  eventIds: z.array(z.string().uuid()).min(1).max(100)
});

export const notificationDebugStateFilterSchema = z
  .array(z.enum(notificationEventStateValues))
  .max(10);

export const reviewExportFormatSchema = z.enum(["json", "csv"]).default("json");

const reviewDateSchema = z.string().trim().min(1);

export const betaFeedbackReviewQuerySchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  dateFrom: reviewDateSchema.nullable().optional(),
  dateTo: reviewDateSchema.nullable().optional(),
  category: z.enum(betaFeedbackCategoryValues).nullable().optional(),
  pagePath: z.string().trim().min(1).nullable().optional(),
  format: reviewExportFormatSchema
});

export const productEventReviewQuerySchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  dateFrom: reviewDateSchema.nullable().optional(),
  dateTo: reviewDateSchema.nullable().optional(),
  eventKey: z.enum(productEventKeyValues).nullable().optional(),
  isSeed: z.boolean().nullable().optional(),
  format: reviewExportFormatSchema
});

export const contentGuardrailReviewQuerySchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  dateFrom: reviewDateSchema.nullable().optional(),
  dateTo: reviewDateSchema.nullable().optional(),
  action: z
    .enum(["allow_with_guidance", "soft_hold", "safety_hold", "hard_block"])
    .nullable()
    .optional(),
  targetType: z.enum(contentGuardrailTargetTypeValues).nullable().optional(),
  reason: z.enum(contentGuardrailReasonValues).nullable().optional(),
  format: reviewExportFormatSchema
});

export const operatorRoleSeedSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["operator", "admin"]),
  isActive: z.boolean().default(true)
});

export const betaAccessDecisionSchema = z.object({
  status: z.enum(["approved", "rejected", "revoked"]),
  note: z.string().trim().max(280).nullable().optional()
});

export const betaAccessListQuerySchema = z.object({
  status: z.enum(betaAccessStatusValues).nullable().optional(),
  limit: z.number().int().min(1).max(100).default(20)
});
