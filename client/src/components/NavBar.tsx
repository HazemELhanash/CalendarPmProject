import { Link, useLocation } from 'wouter';

export default function NavBar() {
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'Calendar' },
    { href: '/projects', label: 'Projects' },
    { href: '/kanban', label: 'Kanban' },
  ];

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md transition-colors duration-300">
      <div className="w-full">
        <div className="flex items-center justify-between h-14 w-full">
          <div className="flex items-center gap-3 ml-0 pl-5">
            <div className="text-lg font-extrabold tracking-tight">CalendarFlow</div>
            <div className="text-xs opacity-90">Manage time & tasks</div>
          </div>
          <div className="flex items-center gap-3 mr-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1 rounded text-sm transition-all duration-200 inline-flex items-center ${location === l.href ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:bg-white/10'}`}
                aria-current={location === l.href ? 'page' : undefined}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
