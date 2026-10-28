export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="forma-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" className="h-8 w-8">
          <defs>
            <linearGradient id="formaLogoGradient" x1="5" y1="5" x2="43" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6CD2"/>
              <stop offset=".52" stopColor="#8D63FF"/>
              <stop offset="1" stopColor="#6FAEFF"/>
            </linearGradient>
          </defs>
          <path d="M14 8h22c0 7-4.5 11-11.5 11H19v6h13c0 6.3-4.2 10-10.8 10H19v5H10V17C10 11.5 11.7 8 14 8Z" fill="url(#formaLogoGradient)"/>
          <path d="M29 24c4.5 0 8 3.4 8 8s-3.5 8-8 8h-5.5c5.1-2.2 8.1-6.8 8.1-12.4 0-1.2-.2-2.4-.6-3.6H29Z" fill="#ACD0FF" opacity=".95"/>
        </svg>
      </span>
      {!compact && <span className="forma-wordmark">Forma <span>day</span></span>}
    </div>
  );
}
