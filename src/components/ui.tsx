import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------
// Button
// ---------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark border-transparent',
  secondary: 'bg-card text-ink border-line hover:border-line-strong',
  ghost: 'bg-transparent text-ink-soft border-transparent hover:bg-black/5',
  danger: 'bg-card text-alarm border-line hover:bg-alarm-soft hover:border-alarm/30',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-medium',
        'transition-colors disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-[14px]',
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  )
}

// ---------------------------------------------------------
// Поля формы
// ---------------------------------------------------------

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-faint">{hint}</span>}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx('field-input', className)} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx('field-input min-h-24 resize-y', className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx('field-input appearance-none pr-8', className)}>
      {children}
    </select>
  )
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={cx('flex items-center gap-2.5 text-[14px]', disabled && 'opacity-50')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-line-strong text-accent focus:ring-accent/30"
      />
      <span>{label}</span>
    </label>
  )
}

// ---------------------------------------------------------
// Служебные
// ---------------------------------------------------------

export function Badge({
  children,
  className,
  dot,
}: {
  children: ReactNode
  className?: string
  dot?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset',
        className,
      )}
    >
      {dot && <span className={cx('size-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft">
      <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      {label && <span className="text-[14px]">{label}</span>}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="max-w-md text-[14px] leading-relaxed text-ink-soft">{description}</p>
      {action}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
      {action}
    </div>
  )
}
