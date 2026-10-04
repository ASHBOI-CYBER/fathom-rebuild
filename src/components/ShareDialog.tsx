'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ArrowSquareOut, GlobeSimple, LockSimple, UsersThree, X } from '@phosphor-icons/react';
import { clock } from '@/lib/format';
import type { Highlight, Meeting } from '@/lib/types';
import { toast } from './Toast';

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

type Access = 'anyone' | 'domain' | 'invited';
const ACCESS: { id: Access; label: string; hint: string; icon: typeof GlobeSimple }[] = [
  { id: 'anyone', label: 'Anyone with the link', hint: 'No account needed to watch', icon: GlobeSimple },
  { id: 'domain', label: 'Anyone at tandem.app', hint: 'Teammates sign in to watch', icon: UsersThree },
  { id: 'invited', label: 'Only people you invite', hint: 'Private to the names below', icon: LockSimple },
];

export function shareUrl(meeting: Pick<Meeting, 'id'>, clip?: Pick<Highlight, 'start' | 'end' | 'title'>) {
  const base = `${typeof window !== 'undefined' ? window.location.origin : ''}${BASE}/share/${meeting.id}/`;
  if (!clip) return base;
  const p = new URLSearchParams({ from: clip.start.toFixed(1), to: clip.end.toFixed(1), title: clip.title });
  return `${base}?${p}`;
}

export function ShareDialog({ meeting, clip, onClose }: { meeting: Meeting; clip?: Highlight; onClose: () => void }) {
  const [access, setAccess] = useState<Access>('anyone');
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const url = useMemo(() => shareUrl(meeting, clip), [meeting, clip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    toast(clip ? 'Clip link copied' : 'Meeting link copied');
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[540px] rounded-t-3xl border border-line-strong bg-surface p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="share-title" className="text-[20px] font-semibold">
              {clip ? 'Share this clip' : 'Share the recording'}
            </h2>
            <p className="mt-1 truncate text-[15px] text-fg-soft">
              {clip ? `${clip.title} · ${clock(clip.start)}–${clock(clip.end)}` : meeting.title}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-fg-faint hover:bg-raised hover:text-fg">
            <X size={18} />
          </button>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="mb-2 text-[14px] text-fg-soft">Who can open the link</legend>
          {ACCESS.map((a) => (
            <label key={a.id} className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3 transition-colors ${access === a.id ? 'border-signal/60 bg-signal-soft' : 'border-line hover:border-line-strong'}`}>
              <input type="radio" name="access" value={a.id} checked={access === a.id} onChange={() => setAccess(a.id)} className="sr-only" />
              <a.icon size={18} className={access === a.id ? 'text-signal' : 'text-fg-faint'} />
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-fg">{a.label}</span>
                <span className="block text-[13px] text-fg-faint">{a.hint}</span>
              </span>
              {access === a.id && <Check size={17} className="text-signal" />}
            </label>
          ))}
        </fieldset>

        {access === 'invited' && (
          <div className="mt-3 flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" aria-label="Invite by email" className="flex-1 rounded-full border border-line bg-abyss/50 px-4 py-2 text-[14px] text-fg outline-none placeholder:text-fg-faint focus:border-line-strong" />
            <button
              onClick={() => {
                if (!email.includes('@')) return;
                toast(`Invite to ${email} queued. This is a demo, so no email is sent.`);
                setEmail('');
              }}
              className="rounded-full bg-fg px-4 py-2 text-[14px] font-semibold text-abyss"
            >
              Invite
            </button>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-full border border-line bg-abyss/50 p-1.5 pl-4">
          <span className="min-w-0 flex-1 truncate text-[13px] text-fg-soft">{url}</span>
          <a href={url} target="_blank" rel="noreferrer" aria-label="Open link in a new tab" className="rounded-full p-2 text-fg-faint hover:bg-raised hover:text-fg">
            <ArrowSquareOut size={16} />
          </a>
          <button onClick={copy} className="flex items-center gap-1.5 rounded-full bg-signal px-4 py-2 text-[14px] font-semibold text-on-signal hover:bg-signal-hover">
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-fg-faint">
          {clip
            ? 'They’ll see just this moment with its transcript and the meeting notes, even if they weren’t on the call.'
            : 'They’ll see the recording, transcript and notes. Your private clips and checked-off items stay yours.'}
        </p>
      </div>
    </div>
  );
}
