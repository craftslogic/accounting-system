'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tag,
  Settings,
  TrendingUp,
  LogOut,
  Users,
  X,
  PiggyBank,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/funds', label: 'Funds', icon: PiggyBank },
  { href: '/people', label: 'People', icon: Users },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/budgets', label: 'Budgets', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full bg-card border-r border-white/10 w-64">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Finora Logo" className="w-24 h-auto object-contain" />
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Mobile App Download */}
      <div className="p-4 border-t border-white/10">
        <a 
          href="https://github.com/craftslogic/accounting-system/releases/download/finora/application-5deee316-22da-493c-aeb0-21cf43c5a37c.apk"
          download="Finora.apk"
          className="flex items-center gap-3 px-3 py-2.5 mb-2 w-full rounded-xl text-sm font-medium transition-all duration-200 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
        >
          <Smartphone className="w-5 h-5 shrink-0" />
          Get Mobile App
        </a>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  )
}
