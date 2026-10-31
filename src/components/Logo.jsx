import { useId } from 'react'

export function PulseMark({ className = 'h-8 w-8' }) {
  const id = `pm${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--g1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--g2)' }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" className="fill-fg/[0.06]" />
      <path
        d="M8 34h12l5-12 8 24 6-16 4 4h13"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Logo({ size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  const mark = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  return (
    <span className="inline-flex items-center gap-2.5">
      <PulseMark className={mark} />
      <span className={`font-display font-bold italic tracking-tighter ${text}`}>
        <span className="text-pulse">Pulse</span>
        <span>Fit</span>
      </span>
    </span>
  )
}
