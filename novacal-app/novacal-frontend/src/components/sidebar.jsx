import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import {
  Target,
  CalendarCheck,
  FileClock,
  Presentation,
  ChartNoAxesCombined,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';


const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Dummy state
  const logout = () => {
    console.log('Logging out...');
    setIsAuthenticated(false);
    // In a real app, clear tokens, user data, etc.
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
  { name: 'Hours', href: '/hours', icon: FileClock },
  { name: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const { isAuthenticated, logout, login } = useAuth(); // Using the dummy useAuth hook
  const [collapsed, setCollapsed] = useState(false);
  // Removed unreadCount and socket states as per request

  const handleLogout = () => {
    logout();
    navigate('/'); // Use navigate instead of router.push
  };

  // Simulate updating pathname for demonstration purposes
  useEffect(() => {
    // This effect is for demonstration to show active links change
    // In a real app, use `useLocation().pathname` from React Router DOM
    // For example: setPathname(location.pathname);
  }, []);

  return (
    <aside
      className={clsx(
        'relative flex flex-col min-h-screen text-white backdrop-blur-lg bg-black border-r border-stone-400/50 shadow-2xl overflow-hidden z-10 transition-all duration-300',
        collapsed ? 'w-20 !p-3' : 'w-64 !p-6'
      )}
    >
      {/* Background circles for decoration 
      <div className="absolute -top-32 -left-20 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl z-0" />
      <div className="absolute top-1/3 -right-28 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 -left-28 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl z-0" />
      */}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full !p-1 shadow-md border border-gray-500"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <div className="mb-8 z-10 flex items-center justify-center">
        {!collapsed && (
          <a
            href="/dashboard"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            className="text-white w-full drop-shadow-xl flex justify-between items-center"
          >
            <div className="p-3 rounded-xl bg-amber-50/50 mr-3 text-white"><Target></Target></div>
            <div className='flex-1'>
              <div className="text-xl font-semibold">Novacal</div>
              <div className='text-sm text-gray-400'>A new, smart calendar</div>
            </div>
          </a>
        )}
      </div>
      
      {!collapsed && (
        <div className="text-gray-400 font-semibold mb-3 ">Workspace</div>
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
                    'relative flex items-center gap-3 !px-3 !py-2 rounded-xl font-medium transition-all duration-200',
                    {
                      'bg-white/30 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-md': isActive,
                      'hover:bg-white/5 hover:text-blue-300': !isActive,
                      'justify-center': collapsed,
                    }
                  )}
                >
                  <LinkIcon className="w-5 h-5" />
                  {!collapsed && <span>{link.name}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto !pt-6 border-t border-white/10 z-10">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center w-full !px-4 !py-3 text-red-300 hover:bg-white/5 rounded-xl transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {!collapsed && <span>Log Out</span>}
          </button>
        ) : (
          <a
            href="/login"
            onClick={(e) => { e.preventDefault(); navigate('/login'); login(); }}
            className={clsx(
              'flex items-center w-full !px-4 !py-3 text-green-300 hover:bg-white/5 rounded-xl transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogIn className="w-5 h-5 mr-3" />
            {!collapsed && <span>Login</span>}
          </a>
        )}
        {!collapsed && <p className="text-white/30 text-xs mt-2 text-center">v0.1.0</p>}
      </div>
    </aside>
  );
}