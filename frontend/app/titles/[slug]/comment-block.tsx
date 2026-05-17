'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useState } from 'react';
import { buildMediaUrl } from '@/lib/media';
import type { Comment } from '@/lib/types';
import { CommentDeleteButton } from './comment-delete-button';
import { CommentReplyForm } from './comment-reply-form';
import { CommentReactions } from './comment-reactions';

type Props = {
  comment: Comment;
  titleSlug: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function CommentAuthorBlock({
  comment,
  titleSlug,
  isAdmin,
  isAuthenticated,
  showReply,
  onReplyToggle,
}: {
  comment: Comment;
  titleSlug: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  showReply: boolean;
  onReplyToggle: () => void;
}) {
  const avatarUrl = comment.author.avatarKey
    ? buildMediaUrl('avatars', comment.author.avatarKey)
    : null;
  const status =
    comment.status && comment.status !== 'APPROVED'
      ? comment.status === 'REJECTED'
        ? 'Отклонён'
        : 'На модерации'
      : null;

  return (
    <article className="comment-card">
      <header className="comment-card-header">
        <div className="comment-card-avatar" aria-hidden={!avatarUrl}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={comment.author.username} width={48} height={48} />
          ) : (
            <span>{comment.author.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="comment-card-author">
          <Link href={`/users/${encodeURIComponent(comment.author.username)}`} className="comment-card-username">
            <strong>{comment.author.username}</strong>
          </Link>
          <small suppressHydrationWarning>{formatDate(comment.createdAt)}</small>
        </div>
        {status ? (
          <span className={`comment-card-status ${comment.status === 'REJECTED' ? 'comment-card-status--rejected' : 'comment-card-status--pending'}`}>
            {status}
          </span>
        ) : null}
        {isAdmin ? (
          <CommentDeleteButton titleSlug={titleSlug} commentId={comment.id} authorName={comment.author.username} />
        ) : null}
      </header>
      <p className="comment-card-body">{comment.body}</p>
      <div className="comment-card-footer">
        <CommentReactions
          titleSlug={titleSlug}
          commentId={comment.id}
          likeCount={comment.likeCount}
          dislikeCount={comment.dislikeCount}
          userReaction={comment.userReaction}
          isAuthenticated={isAuthenticated}
        />
        {isAuthenticated && (
          <button type="button" className="comment-reply-btn" onClick={onReplyToggle}>
            {showReply ? 'Отмена' : 'Ответить'}
          </button>
        )}
      </div>
    </article>
  );
}

export function CommentBlock({ comment, titleSlug, isAdmin, isAuthenticated }: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const replies = comment.replies;
  const firstReply = replies[0];
  const hiddenReplies = replies.slice(1);
  const hiddenCount = hiddenReplies.length;

  return (
    <div className="comment-thread">
      <CommentAuthorBlock
        comment={comment}
        titleSlug={titleSlug}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        showReply={showReplyForm}
        onReplyToggle={() => setShowReplyForm((v) => !v)}
      />

      {showReplyForm && (
        <div className="comment-reply-form-wrapper">
          <CommentReplyForm
            titleSlug={titleSlug}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="comment-replies-thread">
          <ul className="comment-replies-list" role="list">
            <li key={firstReply.id} className="comment-reply-item">
              <ReplyCard reply={firstReply} titleSlug={titleSlug} isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
            </li>

            {repliesExpanded && hiddenReplies.map((reply) => (
              <li key={reply.id} className="comment-reply-item">
                <ReplyCard reply={reply} titleSlug={titleSlug} isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <button
              type="button"
              className="comment-replies-toggle"
              onClick={() => setRepliesExpanded((v) => !v)}
            >
              {repliesExpanded
                ? 'Скрыть ответы'
                : `Ещё ${hiddenCount} ${hiddenCount === 1 ? 'ответ' : hiddenCount < 5 ? 'ответа' : 'ответов'}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReplyCard({
  reply,
  titleSlug,
  isAdmin,
  isAuthenticated,
}: {
  reply: Comment;
  titleSlug: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
}) {
  const avatarUrl = reply.author.avatarKey
    ? buildMediaUrl('avatars', reply.author.avatarKey)
    : null;
  const replyStatus =
    reply.status && reply.status !== 'APPROVED'
      ? reply.status === 'REJECTED' ? 'Отклонён' : 'На модерации'
      : null;

  return (
    <article className="comment-card comment-card--reply">
      <header className="comment-card-header">
        <div className="comment-card-avatar comment-card-avatar--sm" aria-hidden={!avatarUrl}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={reply.author.username} width={36} height={36} />
          ) : (
            <span>{reply.author.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="comment-card-author">
          <Link href={`/users/${encodeURIComponent(reply.author.username)}`} className="comment-card-username">
            <strong>{reply.author.username}</strong>
          </Link>
          <small suppressHydrationWarning>{formatDate(reply.createdAt)}</small>
        </div>
        {replyStatus ? (
          <span className={`comment-card-status ${reply.status === 'REJECTED' ? 'comment-card-status--rejected' : 'comment-card-status--pending'}`}>
            {replyStatus}
          </span>
        ) : null}
        {isAdmin ? (
          <CommentDeleteButton titleSlug={titleSlug} commentId={reply.id} authorName={reply.author.username} />
        ) : null}
      </header>
      <p className="comment-card-body">{reply.body}</p>
      <div className="comment-card-footer">
        <CommentReactions
          titleSlug={titleSlug}
          commentId={reply.id}
          likeCount={reply.likeCount}
          dislikeCount={reply.dislikeCount}
          userReaction={reply.userReaction}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </article>
  );
}
