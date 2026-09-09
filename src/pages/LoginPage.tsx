import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { isOwner, signIn, signInWithLink } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'link'>('password')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (isOwner) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'password') {
        await signIn(email.trim(), password)
        navigate('/')
      } else {
        await signInWithLink(email.trim())
        setSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Войти не удалось')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-[24px] font-extrabold leading-tight">Вход владельца</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        Вход нужен только для редактирования. Смотреть карточки и оставлять отзывы можно без него.
      </p>

      {sent ? (
        <p className="mt-6 rounded-[var(--radius-control)] bg-accent-soft px-4 py-3 text-[14px] text-accent">
          Ссылка для входа отправлена на {email}. Открой её на этом устройстве.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Почта">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          {mode === 'password' && (
            <Field label="Пароль">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
          )}

          {error && <p className="text-[13px] text-alarm">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? 'Проверяю' : mode === 'password' ? 'Войти' : 'Прислать ссылку'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'link' : 'password')
              setError(null)
            }}
            className="w-full text-[13px] text-ink-soft hover:text-ink"
          >
            {mode === 'password' ? 'Войти по ссылке на почту' : 'Войти по паролю'}
          </button>
        </form>
      )}
    </div>
  )
}
