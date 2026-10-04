'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { List, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Wordmark } from './Brand';
import { Avatar } from './Avatar';
import { SearchPalette } from './SearchPalette';
import { ME, person } from '@/lib/people';

const NAV = [
  { href: '/', label: 'Meetings' },
  { href: '/clips', label: 'Clips' },
  { href: '/upcoming', label: 'Upcoming' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpenOn, setNavOpenOn] = useState<string | null>(null);
  const navOpen = navOpenOn === pathname;

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
    const onOpen = () => setSearchOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('sounding:search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('sounding:search', onOpen);
    };
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' || pathname.startsWith('/meetings') : pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-abyss/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <button onClick={() => setNavOpenOn(pathname)} aria-label="Open menu" className="-ml-1 rounded-lg p-2 text-fg-soft hover:bg-raised hover:text-fg md:hidden">
            <List size={20} />
          </button>
          <Link href="/" aria-label="Sounding home" className="shrink-0">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[15px] transition-colors ${isActive(href) ? 'bg-raised font-semibold text-fg' : 'text-fg-soft hover:text-fg'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search every meeting"
              className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-2 pl-3.5 pr-2 text-[14px] text-fg-faint transition-colors hover:border-line-strong hover:text-fg-soft"
            >
              <MagnifyingGlass size={16} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[11px] text-fg-faint sm:inline">Ctrl K</kbd>
            </button>
            <span className="hidden items-center gap-2.5 sm:flex" title={`${person(ME).name} · Tandem demo workspace`}>
              <Avatar id={ME} color="var(--sp-0)" size={32} />
            </span>
          </div>
        </div>
      </header>

      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNavOpenOn(null)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 border-r border-line bg-surface px-4 py-5">
            <div className="flex items-center justify-between px-1">
              <Wordmark />
              <button onClick={() => setNavOpenOn(null)} aria-label="Close menu" className="rounded-lg p-1.5 text-fg-soft hover:bg-raised">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Main">
              {NAV.map(({ href, label }) => (
                <Link key={href} href={href} className={`rounded-xl px-3 py-2.5 text-[16px] ${isActive(href) ? 'bg-raised font-semibold text-fg' : 'text-fg-soft'}`}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>

      {!pathname.startsWith('/meetings') && (
      <footer className="border-t border-line px-6 py-5 text-center text-[12px] text-fg-faint">
        Sounding is a Fathom rebuild made for the 8x assignment. Not affiliated with Fathom. Signed in as {person(ME).name} in a demo workspace.
      </footer>
      )}

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
