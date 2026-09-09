import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { clearReviewerName, getReviewerName } from '../lib/identity'
import { Button, cx } from './ui'

function navClass({ isActive }: { isActive: boolean }): string {
  return cx(
    'shrink-0 rounded-[var(--radius-control)] px-3 py-1.5 text-[14px] font-medium transition-colors',
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

  const links = (
    <>
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
    </>
  )

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <Link to="/" className="flex shrink-0 items-baseline gap-2">
            <span className="text-[17px] font-extrabold tracking-tight">Подбор</span>
            <span className="hidden text-[13px] text-ink-faint lg:inline">трекер объявлений</span>
          </Link>

          {/* На узком экране навигация уезжает во вторую строку, иначе шапка распирает страницу */}
          <nav className="hidden items-center gap-1 sm:flex">{links}</nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
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
                    title="Сменить имя"
                    className="hidden text-[13px] text-ink-soft hover:text-ink sm:block"
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

        <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-2 sm:hidden">
          {links}
          {!isOwner && guestName && (
            <button
              onClick={forgetGuest}
              className="ml-auto shrink-0 px-2 text-[13px] text-ink-faint"
            >
              {guestName}, сменить
            </button>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
