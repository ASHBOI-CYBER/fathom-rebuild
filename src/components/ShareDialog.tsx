'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Globe2, Lock, Users, X } from 'lucide-react';
import { clock } from '@/lib/format';
import type { Highlight, Meeting } from '@/lib/types';
import { toast } from './Toast';

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

type Access = 'anyone' | 'domain' | 'invited';
const ACCESS: { id: Access; label: string; hint: string; icon: typeof Globe2 }[] = [
  { id: 'anyone', label: 'Anyone with the link', hint: 'No account needed to watch', icon: Globe2 },
  { id: 'domain', label: 'Anyone at tandem.app', hint: 'Teammates sign in to watch', icon: Users },
  { id: 'invited', label: 'Only people you invite', hint: 'Private to the names below', icon: Lock },
];

export function shareUrl(meeting: Meeting, clip?: Highlight) {
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
      <div className="absolute inset-0 bg-ink/35" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-t-2xl border border-rule bg-paper p-5 shadow-[0_24px_60px_-20px_rgba(15,34,54,0.45)] sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="share-title" className="text-[18px] font-semibold">
              {clip ? 'Share this clip' : 'Share the recording'}
            </h2>
            <p className="mt-0.5 truncate text-[14px] text-ink-soft">
              {clip ? `${clip.title} · ${clock(clip.start)}–${clock(clip.end)}` : meeting.title}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-ink-faint hover:bg-shoal hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold text-ink-faint">Who can open the link</legend>
          {ACCESS.map((a) => (
            <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 ${access === a.id ? 'border-ink bg-chart/60' : 'border-rule hover:border-ink-faint'}`}>
              <input type="radio" name="access" value={a.id} checked={access === a.id} onChange={() => setAccess(a.id)} className="sr-only" />
              <a.icon size={17} className={access === a.id ? 'text-ink' : 'text-ink-faint'} />
              <span className="flex-1">
                <span className="block text-[14px] font-semibold">{a.label}</span>
                <span className="block text-[12px] text-ink-faint">{a.hint}</span>
              </span>
              {access === a.id && <Check size={16} />}
            </label>
          ))}
        </fieldset>

        {access === 'invited' && (
          <div className="mt-3 flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" aria-label="Invite by email" className="flex-1 rounded-lg border border-rule px-3 py-1.5 text-[14px] outline-none focus:border-ink-faint" />
            <button
              onClick={() => {
                if (!email.includes('@')) return;
                toast(`Invite to ${email} queued (demo — no email is sent)`);
                setEmail('');
              }}
              className="rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-white"
            >
              Invite
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rule bg-chart/50 p-1.5 pl-3">
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">{url}</span>
          <a href={url} target="_blank" rel="noreferrer" aria-label="Open link in a new tab" className="rounded-md p-1.5 text-ink-faint hover:bg-paper hover:text-ink">
            <ExternalLink size={16} />
          </a>
          <button onClick={copy} className="flex items-center gap-1.5 rounded-lg bg-magenta px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-magenta-deep">
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          {clip
            ? 'They’ll see just this moment with its transcript and the meeting notes, even if they weren’t on the call.'
            : 'They’ll see the recording, transcript and notes. Your private clips and checked-off items stay yours.'}
        </p>
      </div>
    </div>
  );
}
