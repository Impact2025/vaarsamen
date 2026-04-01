'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'dark' | 'light' | 'ghost' | 'tonal'
type Size    = 'sm' | 'md' | 'lg'
type Shape   = 'pill' | 'rounded'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  shape?: Shape
  loading?: boolean
  icon?: React.ReactNode
  iconEnd?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  // Teal gradient op donkere achtergrond — primary CTA
  dark:  'gradient-primary text-on-primary shadow-glow hover:brightness-110 active:brightness-95 disabled:shadow-none',
  // Wit/licht — voor gebruik op donkere achtergrond als second CTA of in modals
  light: 'bg-white text-surface font-semibold shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:bg-white/90 active:bg-white/80 disabled:bg-white/40 disabled:shadow-none',
  // Transparant met teal border — ghost/outlined
  ghost: 'bg-transparent border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 active:bg-primary/15 disabled:opacity-40',
  // Teal tint achtergrond — zacht accent
  tonal: 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 active:bg-primary/25 disabled:opacity-40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
  lg: 'px-8 py-4 text-base gap-2.5',
}

const shapeClasses: Record<Shape, string> = {
  pill:    'rounded-full',
  rounded: 'rounded-2xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'dark',
      size    = 'md',
      shape   = 'pill',
      loading = false,
      icon,
      iconEnd,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          'inline-flex items-center justify-center font-label font-semibold',
          'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'select-none',
          variantClasses[variant],
          sizeClasses[size],
          shapeClasses[shape],
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin shrink-0"
            style={{ width: size === 'sm' ? 14 : 16, height: size === 'sm' ? 14 : 16 }}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="12"
            />
          </svg>
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        ) : null}

        {children && <span>{children}</span>}

        {!loading && iconEnd && (
          <span className="shrink-0" aria-hidden="true">{iconEnd}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, Variant as ButtonVariant, Size as ButtonSize, Shape as ButtonShape }
