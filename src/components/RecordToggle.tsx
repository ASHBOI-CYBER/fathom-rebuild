'use client';

export function RecordToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex shrink-0 items-center gap-2.5 text-[14px] text-fg-soft">
      <span className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${on ? 'bg-signal' : 'bg-hover'}`}>
        <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
      </span>
      {on ? 'Will record' : 'Won’t record'}
    </button>
  );
}
