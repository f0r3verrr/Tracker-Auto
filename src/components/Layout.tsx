import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { clearReviewerName, getReviewerName } from '../lib/identity'
import { Button, cx } from './ui'

function navClass({ isActive }: { isActive: boolean }): string {
  return cx(
    'rounded-[var(--radius-control)] px-3 py-1.5 text-[14px] font-medium transition-colors',
    isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:text-ink',
  )
}

export function Layout() {
  const { isOwner, signOut } = useAuth()
  const navigate = useNavigate()
  const [guestName, setGuestName] = useState(getReviewerName())

  function forgetGuest() {
    clearReviewerName()
    setGuestName(null)
    navigate('/')
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="mr-1 flex items-baseline gap-2">
            <span className="text-[17px] font-extrabold tracking-tight">Подбор</span>
            <span className="hidden text-[13px] text-ink-faint sm:inline">трекер объявлений</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Список
            </NavLink>
            <NavLink to="/compare" className={navClass}>
              Сравнение
            </NavLink>
            {isOwner && (
              <NavLink to="/settings" className={navClass}>
                Настройки
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isOwner ? (
              <>
                <Button size="sm" variant="primary" onClick={() => navigate('/car/new')}>
                  Добавить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                {guestName && (
                  <button
                    onClick={forgetGuest}
                    className="hidden text-[13px] text-ink-soft hover:text-ink sm:block"
                    title="Сменить имя"
                  >
                    {guestName}
                  </button>
                )}
                <Button size="sm" variant="secondary" onClick={() => navigate('/login')}>
                  Вход
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
