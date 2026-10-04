import { BASE } from './ShareDialog';

/** A faint strip of seabed behind a page title, fading into the page. */
export function PageBand() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[-4rem] -z-10 h-[460px] w-screen -translate-x-1/2 bg-cover bg-center opacity-45"
      style={{
        backgroundImage: `url(${BASE}/seabed-band.jpg)`,
        maskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
      }}
    />
  );
}
