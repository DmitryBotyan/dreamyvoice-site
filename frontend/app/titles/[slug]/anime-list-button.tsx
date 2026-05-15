'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, X } from 'lucide-react';
import { clientConfig } from '@/lib/client-config';
import { useAuthModal } from '@/app/auth-modal-context';
import type { AnimeListStatus } from '@/lib/types';

const STATUS_LABELS: Record<AnimeListStatus, string> = {
  WATCHING: 'Смотрю',
  WATCHED: 'Просмотрено',
  DROPPED: 'Брошено',
  PLANNED: 'В планах',
};

const STATUSES = Object.keys(STATUS_LABELS) as AnimeListStatus[];

type Props = { slug: string };

export function AnimeListButton({ slug }: Props) {
  const { openModal } = useAuthModal();
  const [status, setStatus] = useState<AnimeListStatus | null | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${clientConfig.apiProxyBasePath}/anime-list/${encodeURIComponent(slug)}`, {
      credentials: 'include',
    }).then(async (res) => {
      if (cancelled) return;
      if (res.status === 401) { setStatus(null); return; }
      if (!res.ok) { setStatus(null); return; }
      const data = await res.json();
      setStatus(data.status ?? null);
    }).catch(() => setStatus(null));
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const applyStatus = useCallback(async (next: AnimeListStatus | null) => {
    setIsLoading(true);
    setIsOpen(false);
    setSaveError(false);
    try {
      let res: Response;
      if (next === null) {
        res = await fetch(
          `${clientConfig.apiProxyBasePath}/anime-list/${encodeURIComponent(slug)}`,
          { method: 'DELETE', credentials: 'include' },
        );
      } else {
        res = await fetch(
          `${clientConfig.apiProxyBasePath}/anime-list/${encodeURIComponent(slug)}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next }),
          },
        );
      }
      if (res.status === 401) { openModal('login'); return; }
      if (!res.ok) { setSaveError(true); return; }
      setStatus(next);
    } catch {
      setSaveError(true);
    } finally {
      setIsLoading(false);
    }
  }, [slug, openModal]);

  const handleButtonClick = useCallback(() => {
    if (status === undefined || isLoading) return;
    setIsOpen((v) => !v);
  }, [status, isLoading, applyStatus]);

  const isActive = status !== null && status !== undefined;

  return (
    <div className="anime-list-btn-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`anime-list-btn${isActive ? ' anime-list-btn--active' : ''}`}
        onClick={handleButtonClick}
        disabled={status === undefined || isLoading}
        aria-label="Управление списком аниме"
        aria-expanded={isOpen}
      >
        <BookOpen size={16} aria-hidden="true" />
        <span>{isActive ? STATUS_LABELS[status!] : 'В список'}</span>
        {isActive && <ChevronDown size={14} aria-hidden="true" className={isOpen ? 'rotate-180' : ''} />}
      </button>

      {saveError && (
        <p className="anime-list-error" role="alert">
          Список не обновился — это сбой на нашей стороне, попробуйте ещё раз
        </p>
      )}

      {isOpen && (
        <div className="anime-list-dropdown" role="menu">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="menuitem"
              className={`anime-list-dropdown-item${status === s ? ' anime-list-dropdown-item--current' : ''}`}
              onClick={() => applyStatus(s)}
            >
              {status === s && <Check size={14} aria-hidden="true" />}
              {STATUS_LABELS[s]}
            </button>
          ))}
          <div className="anime-list-dropdown-divider" />
          <button
            type="button"
            role="menuitem"
            className="anime-list-dropdown-item anime-list-dropdown-item--remove"
            onClick={() => applyStatus(null)}
          >
            <X size={14} aria-hidden="true" />
            Убрать из списка
          </button>
        </div>
      )}
    </div>
  );
}
