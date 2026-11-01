/**
 * ZENO logo — a simple geometric "Z" mark built from a single path,
 * with a cyan-to-green gradient echoing the app's accent system.
 */

interface ZenoLogoProps {
  className?: string;
  size?: number;
}

export function ZenoLogo({ className, size = 32 }: ZenoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="zeno-mark" x1="6" y1="5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-highlight)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" stroke="url(#zeno-mark)" strokeWidth="1.75" opacity="0.45" />
      <path
        d="M8.5 9.5h15v3.4L13.4 22.6h10.1v3.4h-15v-3.4l10.1-9.7H8.5z"
        fill="url(#zeno-mark)"
      />
    </svg>
  );
}
