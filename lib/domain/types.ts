export const profileVisibilityValues = [
  "anonymous",
  "semi_anonymous",
  "nickname_visible",
  "profile_visible"
] as const;

export type PublicProfileVisibility = (typeof profileVisibilityValues)[number];

export const onboardingQuestionTypeValues = [
  "single_choice",
  "multi_choice",
  "scale",
  "short_text"
] as const;

export type OnboardingQuestionType = (typeof onboardingQuestionTypeValues)[number];

export const waveCategoryValues = [
  "work",
  "money",
  "relationships",
  "family",
  "study",
  "health",
  "daily_life"
] as const;

export type WaveCategory = (typeof waveCategoryValues)[number];

export const emotionTagValues = [
  "isolation",
  "self_blame",
  "anxiety",
  "frustration",
  "grief",
  "relief",
  "quiet_hope"
] as const;

export type EmotionTag = (typeof emotionTagValues)[number];

export const waveReactionTypeValues = [
  "touched_me",
  "me_too",
  "add_my_wave",
  "stay_quietly",
  "meaningful_comment",
  "save",
  "qualified_dwell"
] as const;

export type WaveReactionType = (typeof waveReactionTypeValues)[number];

export const waveStateValues = [
  "calm",
  "spreading",
  "surging",
  "lingering",
  "rekindled",
  "fading"
] as const;

export type WaveState = (typeof waveStateValues)[number];

export const notificationDigestModeValues = ["off", "light", "normal"] as const;
export type NotificationDigestMode = (typeof notificationDigestModeValues)[number];

export const notificationToneValues = ["off", "quiet", "balanced"] as const;
export type NotificationTone = (typeof notificationToneValues)[number];

export const notificationChannelValues = ["inapp", "email", "push"] as const;
export type NotificationChannel = (typeof notificationChannelValues)[number];

export const notificationPlatformValues = ["web", "ios", "android"] as const;
export type NotificationPlatform = (typeof notificationPlatformValues)[number];

export const wavePostVisibilityValues = ["public", "private_archive"] as const;
export type WavePostVisibility = (typeof wavePostVisibilityValues)[number];

export const notificationEventTypeValues = [
  "for_you_wave",
  "rekindled_wave",
  "quiet_digest",
  "operational_notice",
  "safety_notice"
] as const;

export type NotificationEventType = (typeof notificationEventTypeValues)[number];

export const notificationEventStateValues = [
  "pending",
  "suppressed",
  "skipped_duplicate",
  "operational_only",
  "sent",
  "read",
  "dismissed"
] as const;

export type NotificationEventState = (typeof notificationEventStateValues)[number];

export const notificationSuppressionReasonValues = [
  "rest_mode",
  "preferences_disabled",
  "quiet_hours",
  "duplicate_window",
  "operational_disabled"
] as const;

export type NotificationSuppressionReason =
  (typeof notificationSuppressionReasonValues)[number];

export const moderationStatusValues = [
  "active",
  "limited",
  "removed",
  "under_review"
] as const;

export type ModerationStatus = (typeof moderationStatusValues)[number];

export const moderationReportTargetTypeValues = ["post", "comment"] as const;
export type ModerationReportTargetType = (typeof moderationReportTargetTypeValues)[number];

export const moderationReportReasonValues = [
  "harmful_expression",
  "personal_attack",
  "privacy_exposure",
  "graphic_or_triggering",
  "spam_or_promotion",
  "other"
] as const;
export type ModerationReportReason = (typeof moderationReportReasonValues)[number];

export const preferredWaveToneValues = ["quiet", "resonant", "light", "mixed"] as const;
export type PreferredWaveTone = (typeof preferredWaveToneValues)[number];

export const exposureToleranceValues = ["low", "medium", "high"] as const;
export type ExposureTolerance = (typeof exposureToleranceValues)[number];

export const restModeAffinityValues = ["low", "medium", "high"] as const;
export type RestModeAffinity = (typeof restModeAffinityValues)[number];

export const readingPreferenceValues = ["short", "mixed", "long"] as const;
export type ReadingPreference = (typeof readingPreferenceValues)[number];

export const empathyPreferenceValues = ["quiet", "shared", "gentle_prompt"] as const;
export type EmpathyPreference = (typeof empathyPreferenceValues)[number];

export type User = {
  id: string;
  email: string;
  createdAt?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  nickname: string;
  displayName: string | null;
  profileVisibility: PublicProfileVisibility;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt: string | null;
  restModeEnabled: boolean;
  notificationOptIn: boolean;
  lastActiveAt: string | null;
};

export type OnboardingQuestionSeedPatch = {
  topics?: Partial<Record<WaveCategory, number>>;
  emotions?: Partial<Record<EmotionTag, number>>;
  preferredWaveTone?: PreferredWaveTone;
  exposureTolerance?: ExposureTolerance;
  privacyPreference?: PublicProfileVisibility;
  restModeAffinity?: RestModeAffinity;
  notificationTone?: NotificationTone;
  readingPreference?: ReadingPreference;
  empathyPreference?: EmpathyPreference;
};

export type OnboardingQuestionOption = {
  key: string;
  label: string;
  description?: string;
  seedPatch?: OnboardingQuestionSeedPatch;
};

export type OnboardingQuestionRule = {
  questionKey: string;
  anyOf: string[];
};

export type OnboardingQuestion = {
  key: string;
  type: OnboardingQuestionType;
  title: string;
  subtitle?: string;
  options?: OnboardingQuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  allowSkip?: boolean;
  branchRules?: OnboardingQuestionRule[];
};

export type OnboardingAnswerValue = string | string[] | number | null;

export type OnboardingAnswer = {
  questionKey: string;
  value: OnboardingAnswerValue;
  skipped?: boolean;
};

export type OnboardingSeedProfile = {
  topicWeights: Partial<Record<WaveCategory, number>>;
  emotionWeights: Partial<Record<EmotionTag, number>>;
  preferredWaveTone: PreferredWaveTone;
  exposureTolerance: ExposureTolerance;
  privacyPreference: PublicProfileVisibility;
  restModeAffinity: RestModeAffinity;
  notificationTone: NotificationTone;
  readingPreference: ReadingPreference;
  empathyPreference: EmpathyPreference;
};

export type WavePost = {
  id: string;
  authorId: string;
  title: string | null;
  body: string;
  categories: WaveCategory[];
  emotionTags: EmotionTag[];
  visibility: WavePostVisibility;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  state: WaveState;
};

export type WaveReactionSummary = {
  reactionType: WaveReactionType;
  hasActivity: boolean;
};

export type WaveComment = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  displayBody: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  authorLabel: string;
  isMine: boolean;
  moderationNotice: string | null;
  canReport: boolean;
  interactionsEnabled: boolean;
};

export type ModerationPresentation = {
  status: ModerationStatus;
  title: string | null;
  description: string | null;
  contentVisible: boolean;
  interactionsEnabled: boolean;
  canReport: boolean;
};

export type WaveDetail = WavePost & {
  reactionSummary: WaveReactionSummary[];
  viewerReactionTypes: WaveReactionType[];
  comments: WaveComment[];
  moderation: ModerationPresentation;
};

export type RestModeSetting = {
  userId: string;
  enabled: boolean;
  startedAt: string | null;
  endsAt: string | null;
  allowOperationalNotifications: boolean;
};

export type NotificationPreference = {
  userId: string;
  enabled: boolean;
  digestMode: NotificationDigestMode;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  maxDailyNotifications: number;
};

export type NotificationEvent = {
  id: string;
  userId: string;
  type: NotificationEventType;
  channel: NotificationChannel;
  postId?: string | null;
  lane?: NotificationCandidateLane | null;
  title: string;
  body: string;
  state: NotificationEventState;
  suppressionReason?: NotificationSuppressionReason | null;
  dedupeKey?: string | null;
  createdAt: string;
};

export type NotificationDevice = {
  id: string;
  userId: string;
  platform: NotificationPlatform;
  pushProvider: string | null;
  deviceToken: string;
  appBuild: string | null;
  deviceLabel: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ModerationReport = {
  id: string;
  reporterUserId: string;
  targetType: ModerationReportTargetType;
  targetId: string;
  reasonKey: ModerationReportReason;
  note: string | null;
  createdAt: string;
};

export type ModerationReportListItem = ModerationReport & {
  targetStatus: ModerationStatus | null;
};

export type ModeratorActionInput = {
  status: ModerationStatus;
};

export type NotificationCandidateLane = "for_you" | "rekindled" | "quiet_digest" | "operational";

export type NotificationCandidate = {
  userId: string;
  type: NotificationEventType;
  lane: NotificationCandidateLane;
  title: string;
  body: string;
  postId: string | null;
  waveState: WaveState | null;
  createdAt: string;
};

export type NotificationEventDecision = {
  userId: string;
  type: NotificationEventType;
  channel: NotificationChannel;
  lane: NotificationCandidateLane | null;
  postId: string | null;
  title: string;
  body: string;
  state: NotificationEventState;
  suppressionReason: NotificationSuppressionReason | null;
  dedupeKey: string;
};

export type NotificationEventWriteSummary = {
  usersScanned: number;
  eventsCreated: number;
  duplicatesSkipped: number;
  suppressedByRestMode: number;
  suppressedByPreference: number;
  suppressedByQuietHours: number;
  operationalOnly: number;
};
