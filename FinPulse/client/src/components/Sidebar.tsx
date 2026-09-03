import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/alert-rules', label: 'Alert Rules' },
];

export function Sidebar() {
  return (
    <nav className="w-48 shrink-0 border-r border-ink-border bg-ink-900 py-6 px-3 hidden md:block">
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-sm text-sm transition-colors ${
                  isActive ? 'bg-ink-700 text-marigold-400' : 'text-paper-500 hover:text-paper-100 hover:bg-ink-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
