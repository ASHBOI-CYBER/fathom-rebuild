'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarClock, Menu, Scissors, Search, Waves, X } from 'lucide-react';
import { Wordmark } from './Brand';
import { Avatar } from './Avatar';
import { SearchPalette } from './SearchPalette';
import { ME, person } from '@/lib/people';

const NAV = [
  { href: '/', label: 'Meetings', icon: Waves },
  { href: '/clips', label: 'Clips', icon: Scissors },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarClock },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpenOn, setNavOpenOn] = useState<string | null>(null);
  const navOpen = navOpenOn === pathname;
  const setNavOpen = (open: boolean) => setNavOpenOn(open ? pathname : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === '/' && !(e.target as HTMLElement)?.closest('input, textarea, [contenteditable]')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' || pathname.startsWith('/meetings') : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors ${
            isActive(href) ? 'bg-paper font-semibold text-ink shadow-[0_0_0_1px_var(--rule)]' : 'text-ink-soft hover:bg-shoal/60 hover:text-ink'
          }`}
        >
          <Icon size={18} strokeWidth={isActive(href) ? 2.2 : 1.8} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const searchButton = (
    <button
      onClick={() => setSearchOpen(true)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-rule bg-paper px-3 py-2 text-left text-[14px] text-ink-faint transition-colors hover:border-ink-faint"
    >
      <Search size={16} />
      <span className="flex-1">Search all meetings</span>
      <kbd className="rounded border border-rule px-1.5 text-[11px] text-ink-faint">Ctrl K</kbd>
    </button>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 border-r border-rule px-4 py-5 lg:flex">
        <Link href="/" className="px-2" aria-label="Sounding home">
          <Wordmark />
        </Link>
        {searchButton}
        {nav}
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar id={ME} color="var(--sp-0)" size={30} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{person(ME).name}</div>
              <div className="truncate text-xs text-ink-faint">Tandem · demo workspace</div>
            </div>
          </div>
          <p className="px-2 text-[11px] leading-snug text-ink-faint">
            A Fathom rebuild for the 8x assignment. Not affiliated with Fathom.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule bg-chart/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="-ml-1 rounded-md p-1.5 hover:bg-shoal">
            <Menu size={20} />
          </button>
          <Link href="/" aria-label="Sounding home">
            <Wordmark />
          </Link>
          <button onClick={() => setSearchOpen(true)} aria-label="Search all meetings" className="ml-auto rounded-md p-1.5 hover:bg-shoal">
            <Search size={20} />
          </button>
        </header>
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-ink/30" onClick={() => setNavOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-chart px-4 py-5 shadow-xl">
              <div className="flex items-center justify-between px-2">
                <Wordmark />
                <button onClick={() => setNavOpen(false)} aria-label="Close menu" className="rounded-md p-1.5 hover:bg-shoal">
                  <X size={20} />
                </button>
              </div>
              {searchButton}
              {nav}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
