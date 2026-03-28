import { systemCopy } from "@/lib/copy/system-copy";
import type {
  ModerationPresentation,
  ModerationStatus,
  WaveComment,
  WavePost
} from "@/lib/domain/types";

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
};

export function canViewerAccessPostDetail(
  post: Pick<WavePost, "authorId" | "visibility" | "moderationStatus">,
  viewerId?: string | null
) {
  const isOwner = viewerId === post.authorId;
  if (isOwner) {
    return true;
  }

  if (post.visibility !== "public") {
    return false;
  }

  return true;
}

export function canSurfacePostInPublicLanes(status: ModerationStatus) {
  return status === "active";
}

export function getPostModerationPresentation(
  status: ModerationStatus,
  isOwner: boolean
): ModerationPresentation {
  if (status === "limited") {
    return {
      status,
      title: systemCopy.moderation.limitedPostTitle,
      description: systemCopy.moderation.limitedPostDescription,
      contentVisible: true,
      interactionsEnabled: false,
      canReport: !isOwner
    };
  }

  if (status === "under_review") {
    return {
      status,
      title: systemCopy.moderation.underReviewTitle,
      description: systemCopy.moderation.underReviewDescription,
      contentVisible: isOwner,
      interactionsEnabled: false,
      canReport: false
    };
  }

  if (status === "removed") {
    return {
      status,
      title: systemCopy.moderation.removedTitle,
      description: systemCopy.moderation.removedDescription,
      contentVisible: false,
      interactionsEnabled: false,
      canReport: false
    };
  }

  return {
    status,
    title: null,
    description: null,
    contentVisible: true,
    interactionsEnabled: true,
    canReport: !isOwner
  };
}

export function presentCommentForViewer(
  row: CommentRow,
  viewerId?: string | null
): WaveComment | null {
  const isMine = viewerId === row.user_id;

  if (row.moderation_status === "under_review") {
    if (!isMine) {
      return null;
    }

    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      body: row.body,
      displayBody: systemCopy.moderation.underReviewComment,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorLabel: "내가 남긴 말",
      isMine,
      moderationNotice: systemCopy.moderation.underReviewComment,
      canReport: false,
      interactionsEnabled: false
    };
  }

  if (row.moderation_status === "removed") {
    if (!isMine) {
      return null;
    }

    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      body: row.body,
      displayBody: systemCopy.moderation.removedComment,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorLabel: "내가 남긴 말",
      isMine,
      moderationNotice: systemCopy.moderation.removedComment,
      canReport: false,
      interactionsEnabled: false
    };
  }

  const authorLabel = isMine ? "내가 남긴 말" : "익명의 파도";

  if (row.moderation_status === "limited") {
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      body: row.body,
      displayBody: isMine ? row.body : systemCopy.moderation.limitedComment,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorLabel,
      isMine,
      moderationNotice: systemCopy.moderation.limitedComment,
      canReport: !isMine,
      interactionsEnabled: false
    };
  }

  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    body: row.body,
    displayBody: row.body,
    moderationStatus: row.moderation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorLabel,
    isMine,
    moderationNotice: null,
    canReport: !isMine,
    interactionsEnabled: true
  };
}
