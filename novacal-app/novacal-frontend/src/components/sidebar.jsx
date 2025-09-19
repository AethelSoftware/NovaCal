import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import {
  Target,
  CalendarCheck,
  ClockFading,
  ChartNoAxesCombined,
  LogOut,
  LogIn,
  LayoutDashboard,
  CalendarSync
} from 'lucide-react';


const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const logout = () => {
    console.log('Logging out...');
    setIsAuthenticated(false);
  };
  const login = () => {
    console.log('Logging in...');
    setIsAuthenticated(true);
  };
  return { isAuthenticated, logout, login };
};

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: CalendarCheck },
  { name: 'Hours', href: '/hours', icon: ClockFading },
  { name: 'Habits', href: '/habits', icon: CalendarSync },
  { name: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const { isAuthenticated, logout, login } = useAuth();
  const [isHovering, setIsHovering] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={clsx(
        'relative flex flex-col min-h-screen border-r border-zinc-700 bg-zinc-950 text-white shadow-xl overflow-hidden z-10 transition-all duration-300',
        isHovering ? 'w-64 !p-6' : 'w-20 !p-3'
      )}
    >
      <div className="mb-8 z-10 flex items-center justify-center">
        <a
          href="/dashboard"
          onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          className="text-white w-full drop-shadow-xl flex items-center"
        >
          <div className={clsx("p-3 rounded-xl bg-zinc-800 text-white", isHovering && "mr-3")}><Target className="w-6 h-6" /></div>
          {isHovering && (
            <div className='flex-1'>
              <div className="text-xl font-semibold">Novacal</div>
              <div className='text-sm text-zinc-400'>A new, smart calendar</div>
            </div>
          )}
        </a>
      </div>

      {isHovering && (
        <div className="text-zinc-400 font-semibold text-sm mb-3">MENU</div>
      )}

      <nav className="flex-1 z-10">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href);

            return (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                  className={clsx(
                    'relative flex items-center gap-4 !px-4 !py-3 rounded-lg font-medium transition-colors duration-200',
                    {
                      'bg-zinc-800 text-white border-l-4 border-white': isActive,
                      'hover:bg-zinc-800 hover:text-white text-zinc-400': !isActive,
                      'justify-center border-l-0': !isHovering,
                    }
                  )}
                >
                  <LinkIcon className="w-5 h-5 shrink-0" />
                  {isHovering && <span className="truncate">{link.name}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto !pt-6 border-t border-zinc-800 z-10">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center w-full !px-4 !py-3 text-red-500 hover:bg-zinc-800 rounded-lg transition-colors duration-200',
              !isHovering && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            {isHovering && <span className="truncate">Log Out</span>}
          </button>
        ) : (
          <a
            href="/login"
            onClick={(e) => { e.preventDefault(); navigate('/login'); login(); }}
            className={clsx(
              'flex items-center w-full !px-4 !py-3 text-white hover:bg-zinc-800 rounded-lg transition-colors duration-200',
              !isHovering && 'justify-center'
            )}
          >
            <LogIn className="w-5 h-5 mr-3 shrink-0" />
            {isHovering && <span className="truncate">Login</span>}
          </a>
        )}
        {isHovering && <p className="text-zinc-500 text-xs mt-2 text-center">v 1.0.0</p >}
      </div>
    </aside>
  );
}