
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, PieChart,
  Settings, Globe, CreditCard, Ticket, LogOut, ShieldCheck, Camera,
  RefreshCw, Wrench, Lock
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { loginAdminAccess, fetchAdminAccessByEmail } from '../src/api';

const env = (import.meta as any).env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: env.VITE_FIREBASE_APP_ID as string,
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const SUPERADMIN_EMAIL = env.VITE_SUPERADMIN_EMAIL as string | undefined;

interface AdminLayoutProps {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ isAdmin, setIsAdmin }) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const location = useLocation();
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [accessMap, setAccessMap] = useState<Record<string, boolean> | null>(null);

  // useEffect(() => {
  //   alert(`MongooseError: Operation products.findOne() buffering timed out after 10000ms\n    at Timeout.<anonymous> (https:\\thesoulstich.com\\Project\\node_modules\\mongoose\\lib\\drivers\\node-mongodb-native\\collection.js:185:23)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/timers:502:7)`);
  // }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = (user.email || '').toLowerCase();
        setCurrentAdminEmail(email);
        localStorage.removeItem('soul_admin_local_email');
        setIsAdmin(true);
        localStorage.setItem('soul_admin_logged_in', '1');
        setAccessMap(null);
      } else {
        const localEmail = localStorage.getItem('soul_admin_local_email');
        if (localEmail) {
          const email = localEmail.toLowerCase();
          fetchAdminAccessByEmail(email)
            .then((admin: any) => {
              if (!admin || admin.status === 'blocked') {
                if (admin && admin.status === 'blocked') {
                  alert('Your admin access is blocked. Contact the superadmin.');
                }
                localStorage.removeItem('soul_admin_local_email');
                setIsAdmin(false);
                localStorage.removeItem('soul_admin_logged_in');
                setCurrentAdminEmail(null);
                setAccessMap(null);
                return;
              }
              setCurrentAdminEmail(email);
              setAccessMap(admin.sections || {});
              setIsAdmin(true);
              localStorage.setItem('soul_admin_logged_in', '1');
            })
            .catch(() => {
              localStorage.removeItem('soul_admin_local_email');
              setIsAdmin(false);
              localStorage.removeItem('soul_admin_logged_in');
              setCurrentAdminEmail(null);
              setAccessMap(null);
            });
          return;
        }
        setIsAdmin(false);
        localStorage.removeItem('soul_admin_logged_in');
        setCurrentAdminEmail(null);
        setAccessMap(null);
      }
    });
    return () => unsubscribe();
  }, [setIsAdmin]);

  const handleLogin = () => {
    const email = adminEmail.trim().toLowerCase();
    const password = adminPassword;
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    const superEmail = SUPERADMIN_EMAIL ? SUPERADMIN_EMAIL.toLowerCase() : undefined;
    const hasSuperEmail = !!superEmail;
    const isSuperEmail = !!superEmail && email === superEmail;

    const loginWithFirebase = () => {
      return signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          setCurrentAdminEmail(email);
          localStorage.removeItem('soul_admin_local_email');
          setIsAdmin(true);
          localStorage.setItem('soul_admin_logged_in', '1');
          setAccessMap(null);
        })
        .catch((error: any) => {
          const code = error?.code || '';
          if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
            alert('Invalid admin password');
          } else if (code === 'auth/user-not-found') {
            alert('Admin account not found');
          } else {
            alert('Failed to login. Please try again.');
          }
        });
    };

    if (isSuperEmail) {
      loginWithFirebase();
    } else {
      loginAdminAccess(email, password)
        .then((admin: any) => {
          const normalizedEmail = (admin.email || email).toLowerCase();
          setCurrentAdminEmail(normalizedEmail);
          localStorage.setItem('soul_admin_local_email', normalizedEmail);
          setAccessMap(admin.sections || {});
          setIsAdmin(true);
          localStorage.setItem('soul_admin_logged_in', '1');
        })
        .catch((error: any) => {
          const status = error?.response?.status;
          if (status === 404 && (!hasSuperEmail || email === superEmail)) {
            // If no dedicated superadmin is configured, or this email is the superadmin email,
            // fall back to Firebase login (legacy behavior for superadmin).
            loginWithFirebase();
            return;
          }
          if (status === 404) {
            alert('Admin account not found');
          } else if (status === 403) {
            alert('Your admin access is blocked. Contact the superadmin.');
          } else if (status === 401) {
            alert('Invalid admin password');
          } else {
            alert('Failed to login. Please try again.');
          }
        });
    }
  };

  const isSuperAdmin =
    !!SUPERADMIN_EMAIL &&
    !!currentAdminEmail &&
    currentAdminEmail.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

  const sectionKeyByLabel: Record<string, string> = {
    Dashboard: 'dashboard',
    Products: 'products',
    Orders: 'orders',
    Exchanges: 'exchanges',
    Customers: 'customers',
    Analytics: 'analytics',
    Finance: 'finance',
    Coupons: 'coupons',
    Reviews: 'reviews',
    Website: 'website',
    Tools: 'tools',
    Settings: 'settings',
  };

  const getSectionKeyFromPath = (pathname: string) => {
    if (!pathname.startsWith('/admin')) return 'dashboard';
    const parts = pathname.split('/');
    const section = parts[2] || '';
    if (!section) return 'dashboard';
    return section;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-white/10 p-10 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-green-500 p-4 rounded-2xl mb-6">
              <ShieldCheck className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Terminal Access</h1>
            <p className="text-zinc-500 text-sm mt-2">Enter your clearance codes</p>
          </div>
          <div className="space-y-6">
            <input
              type="email"
              placeholder="Admin Email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              className="w-full bg-black border border-white/10 px-6 py-4 rounded-xl focus:border-green-500 transition-all"
            />
            <input
              type="password"
              placeholder="Passcode"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              className="w-full bg-black border border-white/10 px-6 py-4 rounded-xl focus:border-green-500 transition-all"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-500 transition-all"
            >
              Initiate Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: RefreshCw, label: 'Exchanges', path: '/admin/exchanges' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: PieChart, label: 'Analytics', path: '/admin/analytics' },
    { icon: CreditCard, label: 'Finance', path: '/admin/finance' },
    { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
    { icon: Camera, label: 'Reviews', path: '/admin/reviews' },
    { icon: Globe, label: 'Website', path: '/admin/website' },
    { icon: Wrench, label: 'Tools', path: '/admin/tools' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const currentSectionKey = getSectionKeyFromPath(location.pathname);
  const hasCurrentAccess = isSuperAdmin || accessMap === null || accessMap[currentSectionKey];

  return (
    <div className="flex h-screen bg-black overflow-hidden font-heading">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-white/5 hidden md:flex flex-col">
        <div className="p-8">
          <h2 className="text-xl font-black tracking-tighter">SOUL PANEL</h2>
          <p className="text-[10px] tracking-[0.4em] text-zinc-500 uppercase font-light">Root Access</p>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col">
          <nav className="px-4 space-y-2">
            {menuItems.map((item) => {
              const key = sectionKeyByLabel[item.label] || 'dashboard';
              const allowed = isSuperAdmin || accessMap === null || accessMap?.[key];
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (!allowed) {
                      e.preventDefault();
                      alert('You are not authorized to access this section.');
                    }
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                      ? 'bg-white text-black font-black'
                      : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                    } ${!allowed ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider flex-1">{item.label}</span>
                  {!allowed && <Lock className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>
          <div className="p-8 mt-auto">
            <button
              onClick={() => {
                signOut(auth).catch(() => { });
                localStorage.removeItem('soul_admin_logged_in');
                localStorage.removeItem('soul_admin_local_email');
                setIsAdmin(false);
              }}
              className="flex items-center space-x-3 text-red-500 hover:text-red-400 transition-colors uppercase text-xs font-black tracking-widest"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminate</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-8 md:p-12">
        {hasCurrentAccess ? (
          <Outlet />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-zinc-500 space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-white/10 mb-2">
                <Lock className="w-7 h-7 text-zinc-400" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Access Restricted</h2>
              <p className="text-xs font-bold uppercase tracking-widest">
                You do not have authorization to view this section.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLayout;
