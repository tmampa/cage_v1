'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AdminGuard from '../../../components/AdminGuard';
import {
  AdminBadge,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPanel,
  AdminShell,
} from '../../../components/admin/AdminLayout';
import { adminFetch } from '../../../lib/adminFetch';

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    let cancelled = false;

    adminFetch(`/api/admin/users?sortBy=${sortBy}&order=${order}&search=${encodeURIComponent(search)}`)
      .then((data) => {
        if (!cancelled) {
          setUsers(data.users || []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sortBy, order, search]);

  const toggleSort = (field) => {
    setLoading(true);
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const handleSearchChange = (value) => {
    setLoading(true);
    setSearch(value);
  };

  const sortIndicator = (field) => {
    if (sortBy !== field) return null;
    return <span className="ml-1 text-slate-400">{order === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <AdminShell
      title="User Management"
      description="Review player accounts, scores, completion progress, and latest activity."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by username"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <AdminBadge tone="slate">{users.length} players</AdminBadge>
        </div>

        {error && <AdminError message={error} />}

        {loading ? (
          <AdminLoading label="Loading users..." />
        ) : (
          <AdminPanel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Player</th>
                    <th
                      className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase text-slate-500 transition hover:text-slate-950"
                      onClick={() => toggleSort('score')}
                    >
                      Score{sortIndicator('score')}
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Levels</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Last Played</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-xl">
                            {user.avatarEmoji || '👤'}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{user.username}</p>
                            <p className="text-xs text-slate-500">Player ID {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">{user.score || 0}</td>
                      <td className="px-5 py-4">
                        <AdminBadge tone={user.levelsCompleted > 0 ? 'blue' : 'slate'}>
                          {user.levelsCompleted}/6 complete
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.lastPlayed ? new Date(user.lastPlayed).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10">
                        <AdminEmpty title="No users found" description="Try changing the search term." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        )}
      </div>
    </AdminShell>
  );
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}
