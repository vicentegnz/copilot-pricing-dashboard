'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Activity, DollarSign, MessageSquare } from 'lucide-react';

const nav = [
  { href: '/', label: 'Overview', icon: BarChart3 },
  { href: '/sessions', label: 'Sessions', icon: MessageSquare },
  { href: '/costs', label: 'Costs', icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-400" />
          <span className="font-bold text-white text-lg">copilot-ometer</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">GitHub Copilot CLI Analytics</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
