import { useState, useEffect } from 'react';
// Assuming you're using React Router DOM for routing
// import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx'; // Assuming you still use clsx

import {
  School,
  CalendarCheck,
  FileClock,
  Presentation,
  ChartNoAxesCombined,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
} from 'lucide-react';

// You'll need to define how isAuthenticated and handleLogout are managed in your Vite app.
// For demonstration, I'm providing a dummy state and function.
// In a real app, this would come from a Context API, Redux, Zustand, etc.
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
  { name: 'Tutorial', href: '/tutorial', icon: School },
  { name: 'My Calendar', href: '/calendar', icon: CalendarCheck },
  { name: 'Hours', href: '/hours', icon: FileClock },
  { name: 'Message', href: '/message', icon: MessageCircle },
  { name: 'Meet', href: '/meet', icon: Presentation },
  { name: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
];

export default function Sidebar() {
  // Replace with useLocation from react-router-dom
  // const location = useLocation();
  // const pathname = location.pathname;
  const [pathname, setPathname] = useState('/dashboard'); // Dummy pathname for demonstration

  // Replace with useNavigate from react-router-dom
  // const navigate = useNavigate();
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
    setPathname(path); // Update dummy pathname
    // In a real app: navigate(path);
  };

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
        'relative flex flex-col min-h-screen text-white backdrop-blur-lg bg-black/95 border-r border-stone-400/50 shadow-2xl overflow-hidden z-10 transition-all duration-300',
        collapsed ? 'w-20 !p-3' : 'w-64 !p-6'
      )}
    >
      <div className="absolute -top-32 -left-20 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl z-0" />
      <div className="absolute top-1/3 -right-28 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 -left-28 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl z-0" />

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full !p-1 shadow-md border border-gray-500"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <div className="mb-8 z-10 flex items-center justify-center">
        {!collapsed && (
          <a
            href="/dashboard" // Use href for a tag, or to for React Router Link
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} // Simulate navigation
            className="text-3xl font-extrabold text-white tracking-wide hover:text-sky-300 transition-colors drop-shadow-xl"
          >
            NovaCal
          </a>
        )}
      </div>

      <nav className="flex-1 z-10">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href);

            // Removed isMessageLink and unreadCount logic here
            // const isMessageLink = link.name === 'MemoryMessage';

            return (
              <li key={link.name}>
                {/* Replace Link with a tag or React Router Link */}
                <a
                  href={link.href} // Use href for a tag, or to for React Router Link
                  onClick={(e) => { e.preventDefault(); navigate(link.href); }} // Simulate navigation
                  className={clsx(
                    'relative flex items-center gap-3 !px-4 !py-3 rounded-xl font-medium transition-all duration-200',
                    {
                      'bg-white/30 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-md': isActive,
                      'hover:bg-white/5 hover:text-blue-300': !isActive,
                      'justify-center': collapsed,
                    }
                  )}
                >
                  <LinkIcon className="w-5 h-5" />
                  {!collapsed && <span>{link.name}</span>}

                  {/* Removed unreadCount badge here */}
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
            href="/login" // Use href for a tag, or to for React Router Link
            onClick={(e) => { e.preventDefault(); navigate('/login'); login(); }} // Simulate login and navigation
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