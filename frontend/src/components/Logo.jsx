/**
 * SplitUp logo — stylized "S" formed by two ribbons/hands exchanging a
 * gold coin, with spark marks. Colors are theme-aware via CSS variables:
 *   dark mode  → silver ribbons (matches the cinematic theme)
 *   light mode → original blue / purple ribbons
 * The coin stays gold in both modes.
 */
export function LogoMark({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lgTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="stop-top-a" />
          <stop offset="1" className="stop-top-b" />
        </linearGradient>
        <linearGradient id="lgBot" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" className="stop-bot-a" />
          <stop offset="1" className="stop-bot-b" />
        </linearGradient>
        <linearGradient id="lgCoin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd54f" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* top ribbon (hand passing the coin) */}
      <path
        d="M88 40 A28 28 0 0 0 32 40 C32 52 40 57 49 59"
        fill="none"
        stroke="url(#lgTop)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      {/* bottom ribbon (hand receiving) */}
      <path
        d="M32 80 A28 28 0 0 0 88 80 C88 68 80 63 71 61"
        fill="none"
        stroke="url(#lgBot)"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* open palm below the coin */}
      <path
        d="M48 77 C54 85 66 85 72 77"
        stroke="url(#lgBot)"
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* coin */}
      <circle cx="60" cy="60" r="12" fill="url(#lgCoin)" />
      <circle cx="60" cy="60" r="8.6" fill="none" stroke="#b45309" strokeWidth="1.6" opacity="0.55" />
      <text
        x="60"
        y="64.6"
        textAnchor="middle"
        fontFamily="Manrope, system-ui, sans-serif"
        fontWeight="800"
        fontSize="12.5"
        fill="#ffffff"
      >
        $
      </text>

      {/* top hand fingers gripping the coin (in front) */}
      <path
        d="M45 49 L59 54 M43 58 L55 62"
        stroke="url(#lgTop)"
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* sparkles */}
      <path
        d="M78 42 L84 36 M82 54 L90 51 M42 78 L36 84 M38 66 L30 69"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** "SplitUp" wordmark — "Up" carries the theme gradient. */
export function Wordmark({ className = "" }) {
  return (
    <span className={`brand-word ${className}`}>
      Split
      <span className="grad">Up</span>
    </span>
  );
}
