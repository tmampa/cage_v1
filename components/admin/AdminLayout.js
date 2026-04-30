'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  EnvelopeIcon,
  HomeIcon,
  ArrowRightStartOnRectangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Overview', href: '/admin', icon: HomeIcon },
  { label: 'Users', href: '/admin/users', icon: UsersIcon },
  { label: 'Feedback', href: '/admin/feedback', icon: EnvelopeIcon },
  { label: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
];

function isActivePath(pathname, href) {
  if (href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ title, description, eyebrow, actions, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 [font-family:ui-sans-serif,system-ui,sans-serif]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                C
              </span>
              <span>
                <span className="block text-sm font-semibold leading-5 text-slate-900">CagE Admin</span>
                <span className="block text-xs leading-4 text-slate-500">Management console</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {actions}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export function AdminPanel({ title, description, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}

export function AdminStatCard({ label, value, icon: Icon, tone = 'slate', helper }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          {helper && <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>}
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 place-items-center rounded-md ${tones[tone] || tones.slate}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminBadge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

export function AdminLoading({ label = 'Loading...' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function AdminError({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

export function AdminEmpty({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
