import React, { useState, useEffect, Component, ReactNode, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, 
  serverTimestamp, writeBatch, orderBy, getDocs, getDoc, setDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  confirmPasswordReset, updateProfile, updatePassword
} from 'firebase/auth';
import { db, auth } from './firebase';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import { 
  User, Lock, Eye, EyeOff, ChevronRight, Package, LogOut, LayoutDashboard, 
  Truck, Settings, AlertCircle, CheckCircle2, Search, FileCode, RefreshCw, 
  Store, Layers, Bell, ChevronDown, FileText, BarChart3, AlertTriangle,
  PieChart, Database, Hash, FileWarning, Zap, ShoppingBag, GitBranch, UserCircle, Sliders,
  Copy, Check, Edit2, Trash2, XCircle, Plus, X, ShieldCheck, Info, Upload, Download,
  Shield, Key, Save, Mail, LayoutGrid, List, History, FileSpreadsheet, Building2, Barcode,
  Contact, Activity, Settings2, Building, Fingerprint
} from 'lucide-react';

// Mock User for local development
const mockUser = {
  uid: 'local-user-id',
  email: 'demo@example.com',
  displayName: 'Demo User',
  emailVerified: true,
  isAnonymous: false,
  providerData: []
};

import emailjs from 'emailjs-com';

// --- Custom Search Icon (Grid) ---
const CustomSearchIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <div className={`flex items-center justify-center rounded-xl bg-[#f0fdf4] p-1.5 border border-[#dcfce7] ${className}`}>
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#059669" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  </div>
);

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a192f] p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-xl">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
            <p className="text-red-200/60 text-sm mb-6">{this.state.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-xl transition-colors font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Enhanced NTN pattern to include alphanumeric NTNs like A123457, B123456, D123457 and handle optional hyphens
// Added support for NTN.NO, NTN.N0, etc.
// Stricter digit matching to avoid picking up random text
const NTN_REGEX = /\b(NTN(?:\.NO|\.N0|\s*NO|\s*N0|\s*[:#.]?)\s*[A-Z]?\d{6,8}(?:-\d)?)\b|\b(\d{5}-\d{7}-\d)\b|\b(\d{13})\b|\b(\d{7,8}-\d)\b|\b(\d{7,8})\b|\b([A-Z]\d{6,8})\b|\b([A-Z]-\d{6,8})\b/i;

const cleanNtnValue = (ntn: string) => {
  if (!ntn) return '';
  // Clean up extra words like (MID:...)
  let cleaned = ntn.split('(')[0].trim();
  // Remove NTN prefixes, dots, etc.
  cleaned = cleaned.replace(/NTN(?:\.NO|\.N0|\s*NO|\s*N0|\s*[:#.]?)/gi, '').trim();
  // Remove anything that's not alphanumeric or hyphen
  cleaned = cleaned.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  
  // If it's a CNIC (13 digits), format it
  if (/^\d{13}$/.test(cleaned)) {
    cleaned = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 12) + '-' + cleaned.slice(12);
  }
  // Ensure it's in standard format if it's 8 digits
  else if (/^\d{8}$/.test(cleaned)) {
    cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
  }
  
  // Return only the cleaned value if it looks like a number/NTN
  return cleaned.length >= 7 ? `NTN ${cleaned}` : '';
};

const getRawNtn = (ntn: string) => {
  if (!ntn) return '';
  // Remove NTN prefixes, dots, etc.
  let cleaned = ntn.replace(/NTN(?:\.NO|\.N0|\s*NO|\s*N0|\s*[:#.]?)/gi, '').trim();
  // Remove anything that's not alphanumeric
  return cleaned.replace(/[^A-Z0-9]/gi, '').toUpperCase();
};

// --- Main App Component ---
const ScreenLockOverlay = memo(({ isScreenLocked, handleUnlock, enteredPin, setEnteredPin, pinError }: any) => (
  <AnimatePresence>
    {isScreenLocked && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#0a192f]/95 backdrop-blur-2xl flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/10 border border-white/20 rounded-[40px] p-10 max-w-sm w-full text-center backdrop-blur-xl shadow-2xl"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-600/20">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Screen Locked</h2>
          <p className="text-blue-200/60 text-sm mb-8 font-medium">Enter your security PIN to unlock the dashboard</p>
          
          <div className="space-y-4">
            <input 
              type="password"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              className={`w-full bg-white/5 border ${pinError ? 'border-red-500' : 'border-white/10'} rounded-2xl py-4 px-6 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/20`}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
            {pinError && (
              <motion.p 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-red-400 text-[10px] font-black uppercase tracking-widest"
              >
                Invalid PIN. Please try again.
              </motion.p>
            )}
            <button 
              onClick={handleUnlock}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Unlock Dashboard
            </button>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-4">Default PIN: 1234</p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

const SidebarItem = memo(({ 
  icon: Icon, 
  label, 
  activeTab, 
  setActiveTab, 
  isSidebarHovered,
  index,
  hasSubmenu,
  hasArrow,
  showSubmenu,
  showArrowDropdown,
  onClick
}: any) => (
  <div className="space-y-1">
    <button 
      onClick={onClick}
      className={`w-full flex items-center ${isSidebarHovered ? 'px-4' : 'justify-center'} py-3 rounded-2xl group relative ${
        activeTab === label 
          ? 'text-white' 
          : 'text-gray-400 hover:text-white'
      }`}
      title={!isSidebarHovered ? label : ''}
    >
      <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
        activeTab === label 
          ? 'bg-blue-600 shadow-lg shadow-blue-600/40 scale-110' 
          : 'bg-white/5 group-hover:bg-white/10'
      }`}>
        <Icon size={22} className={activeTab === label ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
      </div>
      
      {isSidebarHovered && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="ml-4 font-bold text-sm whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}

      {isSidebarHovered && label === 'NTN Search' && <span className="ml-auto text-[10px] opacity-50">®</span>}
      
      {isSidebarHovered && hasSubmenu && (
        <ChevronRight size={14} className={`ml-auto transition-transform ${showSubmenu ? 'rotate-90' : ''}`} />
      )}
      
      {isSidebarHovered && hasArrow && (
        <ChevronDown size={14} className={`ml-auto transition-transform ${showArrowDropdown ? 'rotate-180' : ''}`} />
      )}

      {!isSidebarHovered && activeTab === label && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
        />
      )}
    </button>
  </div>
));
const Sidebar = memo(({ 
  activeTab, 
  setActiveTab, 
  user, 
  ADMIN_EMAIL, 
  handleLogout, 
  profile,
  isScreenLocked,
  setIsScreenLocked,
  lockPin
}: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
  user: any; 
  ADMIN_EMAIL: string; 
  handleLogout: () => void; 
  profile: any;
  isScreenLocked: boolean;
  setIsScreenLocked: (locked: boolean) => void;
  lockPin: string;
}) => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [showScreenLock, setShowScreenLock] = useState(false);
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleUnlock = useCallback(() => {
    const correctPin = lockPin || '1234';
    if (enteredPin === correctPin) {
      setIsScreenLocked(false);
      setEnteredPin('');
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
    }
  }, [enteredPin, lockPin]);

  const menuItems = useMemo(() => [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Search, label: 'NTN Search' },
    { icon: FileText, label: 'HS Code' },
    { icon: AlertCircle, label: 'NTN Missing' },
    { icon: RefreshCw, label: 'NTN Auto Update' },
    { icon: ShoppingBag, label: 'Bucket Shop' },
    { icon: Layers, label: 'Different Lines' },
    ...(user?.email === ADMIN_EMAIL ? [{ icon: ShieldCheck, label: 'User Management' }] : []),
    { icon: User, label: 'Profile' },
    { icon: Lock, label: 'Security', hasSubmenu: true },
    { icon: LogOut, label: 'Logout', hasArrow: true },
  ], [user?.email, ADMIN_EMAIL]);

  const handleItemClick = useCallback((item: any) => {
    if (item.label === 'Logout') {
      if (item.hasArrow) {
        setShowLogoutDropdown(prev => !prev);
      } else {
        handleLogout();
      }
    } else if (item.label === 'Security') {
      setShowScreenLock(prev => !prev);
    } else {
      setActiveTab(item.label);
    }
  }, [setActiveTab, handleLogout]);

  return (
    <>
      <ScreenLockOverlay 
        isScreenLocked={isScreenLocked}
        handleUnlock={handleUnlock}
        enteredPin={enteredPin}
        setEnteredPin={setEnteredPin}
        pinError={pinError}
      />

      <motion.aside 
        initial={false}
        animate={{ width: isSidebarHovered ? 260 : 80 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => {
          setIsSidebarHovered(false);
          setShowScreenLock(false);
          setShowLogoutDropdown(false);
        }}
        className="bg-[#1e293b] text-white flex flex-col z-20 sticky top-0 h-screen overflow-hidden border-r border-white/5"
        style={{ willChange: 'width' }}
      >
      <div 
        className={`p-4 flex items-center justify-center border-b border-white/5 h-20 overflow-hidden shrink-0`}
      >
        <motion.div 
          animate={{ 
            width: isSidebarHovered ? 140 : 40,
            height: isSidebarHovered ? 50 : 40,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 shrink-0"
        >
          <img 
            src="https://www.vectorlogo.zone/logos/fedex/fedex-ar21.svg" 
            alt="FedEx Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      <nav className="flex-1 py-8 px-3 space-y-4 overflow-y-auto scrollbar-none overflow-x-hidden">
        {menuItems.map((item, i) => (
          <React.Fragment key={i}>
            <SidebarItem 
              {...item}
              index={i}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isSidebarHovered={isSidebarHovered}
              showSubmenu={showScreenLock}
              showArrowDropdown={showLogoutDropdown}
              onClick={() => handleItemClick(item)}
            />

            {isSidebarHovered && item.label === 'Security' && showScreenLock && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-12 space-y-1 overflow-hidden"
              >
                <button 
                  onClick={() => setIsScreenLocked(true)}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <Shield size={14} />
                  <span>Screen Lock</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('Profile');
                    setShowScreenLock(false);
                    setTimeout(() => {
                      const element = document.getElementById('security-settings');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        document.getElementById('new-password-input')?.focus();
                      }
                    }, 300);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <Key size={14} />
                  <span>Change Password</span>
                </button>
              </motion.div>
            )}

            {isSidebarHovered && item.label === 'Logout' && showLogoutDropdown && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-12 space-y-1 overflow-hidden"
              >
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-red-400 hover:bg-red-400/10 font-bold"
                >
                  <LogOut size={14} />
                  <span>Confirm Logout</span>
                </button>
                <button 
                  onClick={() => setShowLogoutDropdown(false)}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-[#1a2233]">
        <div className={`flex items-center ${isSidebarHovered ? 'space-x-3 px-4' : 'justify-center'} py-2`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <UserCircle size={24} className="text-white" />
          </div>
          {isSidebarHovered && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{profile.name}</p>
              <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest font-black">Administrator</p>
            </div>
          )}
        </div>
      </div>
      </motion.aside>
    </>
  );
});

const Header = memo(({ 
  profile, 
  pendingUsers, 
  allUsers, 
  user, 
  ADMIN_EMAIL, 
  handleLogout, 
  setActiveTab,
  setSuccessMessage
}: {
  profile: any;
  pendingUsers: any[];
  allUsers: any[];
  user: any;
  ADMIN_EMAIL: string;
  handleLogout: () => void;
  setActiveTab: (tab: string) => void;
  setSuccessMessage: (msg: string) => void;
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const toggleNotifications = useCallback(() => setShowNotifications(prev => !prev), []);
  const toggleProfile = useCallback(() => setShowProfileDropdown(prev => !prev), []);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between z-10 sticky top-0">
      <div className="flex flex-1 items-center justify-between max-w-[1600px] mx-auto w-full">
        <div className="flex items-center space-x-4">
          <div className="fedex-logo-badge scale-75 origin-left">
            <span className="badge-letter ntn-text" style={{ animationDelay: '0.1s' }}>N</span>
            <span className="badge-letter ntn-text" style={{ animationDelay: '0.2s' }}>T</span>
            <span className="badge-letter ntn-text" style={{ animationDelay: '0.3s' }}>N</span>
            
            <div className="dual-tone-dot"></div>
            
            <span className="badge-letter system-text" style={{ animationDelay: '0.5s' }}>S</span>
            <span className="badge-letter system-text" style={{ animationDelay: '0.6s' }}>Y</span>
            <span className="badge-letter system-text" style={{ animationDelay: '0.7s' }}>S</span>
            <span className="badge-letter system-text" style={{ animationDelay: '0.8s' }}>T</span>
            <span className="badge-letter system-text" style={{ animationDelay: '0.9s' }}>E</span>
            <span className="badge-letter system-text" style={{ animationDelay: '1.0s' }}>M</span>
          </div>
        </div>
      
      <div className="flex items-center space-x-6 ml-8">
        <div className="relative">
          <div 
            onClick={toggleNotifications}
            className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors relative"
          >
            <Bell size={20} />
            {user?.email === ADMIN_EMAIL && allUsers.filter(u => u.status === 'pending').length > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
            )}
          </div>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-gray-100 p-4 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Notifications</h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {pendingUsers.length} New Requests
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
                  {user?.email === ADMIN_EMAIL ? (
                    pendingUsers.length > 0 ? (
                      pendingUsers.map((u) => (
                        <div key={u.id} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-inner border border-white">
                              <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{u.displayName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await updateDoc(doc(db, 'users', u.id), { status: 'approved' });
                                } catch (err) {
                                  console.error('Error approving user:', err);
                                }
                              }}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await updateDoc(doc(db, 'users', u.id), { status: 'rejected' });
                                } catch (err) {
                                  console.error('Error rejecting user:', err);
                                }
                              }}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell size={20} className="text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400 font-medium">No pending requests</p>
                      </div>
                    )
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-xs text-gray-400 font-medium">No new notifications</p>
                    </div>
                  )}
                </div>
                {user?.email === ADMIN_EMAIL && allUsers.length > 0 && (
                  <button 
                    onClick={() => {
                      setActiveTab('User Management');
                      setShowNotifications(false);
                    }}
                    className="w-full mt-4 py-3 bg-gray-50 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    Go to User Management
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <button 
            onClick={toggleProfile}
            className="flex items-center space-x-4 pl-6 border-l border-gray-200 hover:bg-gray-50/50 p-2 rounded-2xl transition-all group"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-blue-600">
                {profile.name}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Administrator</p>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-blue-100 p-0.5 group-hover:border-blue-300 transition-colors">
              <img 
                src={profile.photoURL} 
                alt="User" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Account Settings</p>
                </div>
                {[
                  { icon: User, label: 'My Profile', color: 'blue' },
                  { icon: ShieldCheck, label: 'Security', color: 'indigo' },
                  { icon: FileText, label: 'Activity Log', color: 'purple' },
                  { icon: LogOut, label: 'Logout', color: 'red' },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      if (item.label === 'Logout') {
                        handleLogout();
                      } else {
                        setActiveTab('Profile');
                        if (item.label === 'Security') {
                          setTimeout(() => {
                            const element = document.getElementById('security-settings');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                              document.getElementById('new-password-input')?.focus();
                            }
                          }, 300);
                        }
                      }
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-500 group-hover:scale-110 transition-transform`}>
                      <item.icon size={16} />
                    </div>
                    <span className="text-sm font-bold">{item.label}</span>
                  </button>
                ))}
                <div className="mt-1 pt-1 border-t border-gray-50">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LogOut size={16} />
                    </div>
                    <span className="text-sm font-bold">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </header>
  );
});

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const pendingUsers = useMemo(() => allUsers.filter(u => u.status === 'pending'), [allUsers]);
  const [emailjsServiceId, setEmailjsServiceId] = useState('');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState('');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState('');

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 4000); // Changed to 4 seconds as requested
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Show splash when returning to tab if logged out
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !user && !showSplash && !authLoading) {
        setShowSplash(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, showSplash, authLoading]);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const serviceDoc = await getDoc(doc(db, 'settings', 'emailjs_service_id'));
        const templateDoc = await getDoc(doc(db, 'settings', 'emailjs_template_id'));
        const publicDoc = await getDoc(doc(db, 'settings', 'emailjs_public_key'));

        if (serviceDoc.exists()) setEmailjsServiceId(serviceDoc.data().value);
        if (templateDoc.exists()) setEmailjsTemplateId(templateDoc.data().value);
        if (publicDoc.exists()) setEmailjsPublicKey(publicDoc.data().value);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const ADMIN_EMAIL = 'imran666777qq@gmail.com';

  // Auth Listener
  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (firebaseUser) {
        setAuthLoading(true);
        setIsCheckingApproval(true);
        
        // Check if admin
        if (firebaseUser.email === ADMIN_EMAIL) {
          setIsApproved(true);
          setUser(firebaseUser);
          setIsCheckingApproval(false);
          setAuthLoading(false);
          return;
        }

        // Listen to user's own document for approval status
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) {
            // New user, create pending request
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'New User',
              photoURL: firebaseUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
              status: 'pending',
              role: 'user',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newUser);
              
              // Send Email Notification to Admin
              const templateParams = {
                to_email: ADMIN_EMAIL,
                user_name: newUser.displayName,
                user_email: newUser.email,
                message: `A new user has signed up and is waiting for approval: ${newUser.displayName} (${newUser.email})`
              };

              // Fetch settings directly to avoid race condition
              const serviceDoc = await getDoc(doc(db, 'settings', 'emailjs_service_id'));
              const templateDoc = await getDoc(doc(db, 'settings', 'emailjs_template_id'));
              const publicDoc = await getDoc(doc(db, 'settings', 'emailjs_public_key'));

              const sId = serviceDoc.exists() ? serviceDoc.data().value : emailjsServiceId;
              const tId = templateDoc.exists() ? templateDoc.data().value : emailjsTemplateId;
              const pKey = publicDoc.exists() ? publicDoc.data().value : emailjsPublicKey;

              if (sId && tId && pKey) {
                emailjs.send(sId, tId, templateParams, pKey)
                  .then((result) => {
                      console.log('Email successfully sent!', result.text);
                  }, (error) => {
                      console.log('Failed to send email...', error.text);
                  });
              } else {
                console.log('EmailJS not configured. New user signup notification would be sent to:', ADMIN_EMAIL);
              }
              
            } catch (err) {
              console.error('Error creating user profile:', err);
            }
            setIsApproved(false);
          } else {
            const userData = docSnap.data();
            setIsApproved(userData?.status === 'approved');
          }
          setIsCheckingApproval(false);
          setAuthLoading(false);
        }, (err) => {
          console.error('Error listening to user doc:', err);
          setIsCheckingApproval(false);
          setAuthLoading(false);
        });

        setUser(firebaseUser);
      } else {
        setUser(null);
        setIsApproved(false);
        setAuthLoading(false);
        setIsCheckingApproval(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // Fetch all users for admin
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(usersList);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Inactivity Auto-Logout
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;
    const INACTIVITY_LIMIT = autoLogoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        setError(`You have been logged out due to ${autoLogoutMinutes} minutes of inactivity.`);
      }, INACTIVITY_LIMIT);
    };

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Start timer

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if ((activeTab === 'NTN Search' || activeTab === 'Dashboard') && searchQuery) {
      setTimeout(() => {
        setSearchQuery('');
      }, 500);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      name: 'Imran Ahmed',
      photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      employeeId: '#FEDEX-8821',
      email: 'imran666777qq@gmail.com',
      phone: '+92 300 1234567'
    };
  });

  const [loginHistory, setLoginHistory] = useState(() => {
    const saved = localStorage.getItem('fedex_ntn_login_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastLogin, setLastLogin] = useState(() => {
    const saved = localStorage.getItem('lastLogin');
    return saved || new Date().toLocaleString();
  });

  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(() => {
    const saved = localStorage.getItem('autoLogoutMinutes');
    return saved ? parseInt(saved) : 10;
  });

  useEffect(() => {
    localStorage.setItem('autoLogoutMinutes', autoLogoutMinutes.toString());
  }, [autoLogoutMinutes]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('fedex_ntn_login_history', JSON.stringify(loginHistory));
  }, [loginHistory]);

  useEffect(() => {
    localStorage.setItem('lastLogin', lastLogin);
  }, [lastLogin]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ collectionName: string, id: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newRecord, setNewRecord] = useState({
    ref: '',
    name: '',
    ntn: '',
    cnic: '',
    status: 'Active',
    color: 'emerald'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ ...profile });

  const getCollectionName = (tab: string) => {
    switch (tab) {
      case 'HS Code': return 'hs_code_records';
      case 'NTN Missing': return 'missing_records';
      case 'Auto Update': return 'auto_update_records';
      case 'Bucket Shop': return 'bucket_shop_records';
      case 'Different Lines': return 'different_lines_records';
      default: return 'ntn_records';
    }
  };

  const handleSaveProfile = () => {
    setProfile({ ...editProfileData });
    setIsEditingProfile(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  const [isNtnRecordsModalOpen, setIsNtnRecordsModalOpen] = useState(false);
  const [selectedNtnRecords, setSelectedNtnRecords] = useState<string[]>([]);
  const [ntnRecordsSearchQuery, setNtnRecordsSearchQuery] = useState('');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [ntnRecords, setNtnRecords] = useState<any[]>([]);
  const [hsCodeRecords, setHsCodeRecords] = useState<any[]>([]);
  const [ntnMissingRecords, setNtnMissingRecords] = useState<any[]>([]);
  const [ntnAutoUpdateRecords, setNtnAutoUpdateRecords] = useState<any[]>([]);
  const [bucketShopRecords, setBucketShopRecords] = useState<any[]>([]);
  const [differentLinesRecords, setDifferentLinesRecords] = useState<any[]>([]);

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error.message || String(error),
      operation,
      path,
      auth: {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified
      }
    };
    console.error(`Firestore Error [${operation}] on [${path}]:`, JSON.stringify(errInfo));
    setError(`Permission Error: ${error.message}. Please ensure you are logged in with Google.`);
  };

  // Sync with Firestore
  useEffect(() => {
    if (!user || !isApproved) return;

    const collections = [
      { name: 'ntn_records', setter: setNtnRecords },
      { name: 'hs_code_records', setter: setHsCodeRecords },
      { name: 'missing_records', setter: setNtnMissingRecords },
      { name: 'auto_update_records', setter: setNtnAutoUpdateRecords },
      { name: 'bucket_shop_records', setter: setBucketShopRecords },
      { name: 'different_lines_records', setter: setDifferentLinesRecords },
    ];

    const unsubscribes = collections.map(({ name, setter }) => {
      const q = query(
        collection(db, name),
        where('userId', '==', user.uid)
      );

      return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setter(records);

        // Update recent activity states with the latest 5 records from Firestore
        if (name === 'hs_code_records') setRecentHSCodeActivity(records.slice(0, 5));
        if (name === 'missing_records') setRecentNtnMissingActivity(records.slice(0, 5));
        if (name === 'auto_update_records') setRecentNtnAutoUpdateActivity(records.slice(0, 5));
        if (name === 'bucket_shop_records') setRecentBucketShopActivity(records.slice(0, 5));
        if (name === 'different_lines_records') setRecentDifferentLinesActivity(records.slice(0, 5));
      }, (err) => {
        handleFirestoreError(err, 'LIST', name);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const [hsCodeResults, setHsCodeResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('last_hs_code_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentHSCodeActivity, setRecentHSCodeActivity] = useState<any[]>([]);
  const [ntnMissingResults, setNtnMissingResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('last_ntn_missing_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentNtnMissingActivity, setRecentNtnMissingActivity] = useState<any[]>([]);
  const [ntnAutoUpdateResults, setNtnAutoUpdateResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('last_ntn_auto_update_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentNtnAutoUpdateActivity, setRecentNtnAutoUpdateActivity] = useState<any[]>([]);
  const [bucketShopResults, setBucketShopResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('last_bucket_shop_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentBucketShopActivity, setRecentBucketShopActivity] = useState<any[]>([]);
  const [differentLinesResults, setDifferentLinesResults] = useState<any[]>(() => {
    const saved = localStorage.getItem('last_different_lines_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentDifferentLinesActivity, setRecentDifferentLinesActivity] = useState<any[]>([]);

  // Persist tool results to local storage
  useEffect(() => {
    localStorage.setItem('last_hs_code_results', JSON.stringify(hsCodeResults));
  }, [hsCodeResults]);

  useEffect(() => {
    localStorage.setItem('last_ntn_missing_results', JSON.stringify(ntnMissingResults));
  }, [ntnMissingResults]);

  useEffect(() => {
    localStorage.setItem('last_ntn_auto_update_results', JSON.stringify(ntnAutoUpdateResults));
  }, [ntnAutoUpdateResults]);

  useEffect(() => {
    localStorage.setItem('last_bucket_shop_results', JSON.stringify(bucketShopResults));
  }, [bucketShopResults]);

  useEffect(() => {
    localStorage.setItem('last_different_lines_results', JSON.stringify(differentLinesResults));
  }, [differentLinesResults]);


  const [lockPin, setLockPin] = useState('1234');
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  const [loginUsername, setLoginUsername] = useState('admin@example.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [newUsername, setNewUsername] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  const processHSCodeFile = (data: any[]) => {
    // Filter out rows where CE Commodity Description is blank AND Recip Cntry is US
    const filteredData = data.filter(row => {
      const desc = row['CE Commodity Description'] || row['Description'] || '';
      const country = row['Recip Cntry'] || row['Country'] || '';
      return desc.toString().trim() !== '' && country.toString().trim().toUpperCase() === 'US';
    });

    const results = filteredData.map((row, index) => {
      const tracking = row['Tracking Number'] || row['tracking'] || '';
      let shipper = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const hsCodeRaw = row['Commodity Harmonized Code'] || row['hs'] || '';
      const desc = (row['CE Commodity Description'] || row['Description'] || '').toString().trim();
      const addr1 = (row['Shipper Address line 1'] || row['address1'] || '').toString().trim();
      
      // Extract NTN if present in shipper, description or address
      let foundNtn = null;
      [shipper, desc, addr1].forEach(text => {
        if (!foundNtn) {
          const match = text.match(NTN_REGEX);
          if (match) {
            foundNtn = cleanNtnValue(match[0]);
          }
        }
      });

      if (foundNtn) {
        const rawFound = getRawNtn(foundNtn);
        const finalRaw = getRawNtn(shipper);
        if (rawFound && !finalRaw.includes(rawFound)) {
          shipper = `${shipper} ${foundNtn}`;
        }
      }

      // Extract only digits from HS Code
      const hsCodeDigits = hsCodeRaw.toString().replace(/\D/g, '');
      const isValid = hsCodeDigits.length >= 10;
      
      return {
        id: index.toString(),
        tracking,
        shipper,
        hs: hsCodeRaw,
        hsDigits: hsCodeDigits,
        isValid,
        service: row['Service Type'] || row['service'] || 'N/A',
        country: row['Recip Cntry'] || row['Country'] || 'US',
        color: isValid ? 'emerald' : 'red'
      };
    });

    // Sort: Invalid codes (isValid === false) at the top
    const sortedResults = [...results].sort((a, b) => {
      if (a.isValid === b.isValid) return 0;
      return a.isValid ? 1 : -1;
    });

    setHsCodeResults(sortedResults);
    // Show only the last 5 rows of the current upload in recent activity
    setRecentHSCodeActivity(sortedResults.slice(0, 5));
    setSuccessMessage(`Processed ${results.length} US shipments successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const processNtnMissingFile = (data: any[]) => {
    const cnicPattern = /\b\d{5}-\d{7}-\d\b|\b\d{13}\b/;
    const invalidSuffixes = [/-eform$/i, /-a$/i, /-e form$/i, /-E FORM$/i];

    const filteredData = data.filter(row => {
      const desc = (row['CE Commodity Description'] || row['Description'] || '').toString().trim();
      const company = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const name = (row['Shipper Name'] || row['name'] || '').toString().trim();
      const taxId = (row['Shpr Tax ID Number'] || row['tax_id'] || row['NTN'] || '').toString().trim();
      const customsValueRaw = row['Customs Value'] || row['value'] || 0;
      const customsValue = parseFloat(customsValueRaw.toString().replace(/[^0-9.]/g, '')) || 0;

      // 1. Description must not be blank
      if (desc === '') return false;

      // 2. Customs Value must be < 500
      if (customsValue >= 500) return false;

      // 3. Company, Name or Tax ID must not contain NTN or CNIC
      if (NTN_REGEX.test(company) || cnicPattern.test(company) || NTN_REGEX.test(name) || cnicPattern.test(name) || NTN_REGEX.test(taxId) || cnicPattern.test(taxId)) return false;

      // 4. Company must not end with specific suffixes
      const hasInvalidSuffix = invalidSuffixes.some(regex => regex.test(company));
      if (hasInvalidSuffix) return false;

      return true;
    });

    const results = filteredData.map((row, index) => ({
      id: index.toString(),
      tracking: row['Tracking Number'] || row['tracking'] || 'N/A',
      shipper: row['Shipper Company'] || row['shipper'] || 'N/A',
      name: row['Shipper Name'] || row['name'] || 'N/A',
      service: row['Service Type'] || row['service'] || 'N/A',
      value: row['Customs Value'] || row['value'] || '0',
      color: 'orange'
    }));

    setNtnMissingResults(results);
    setRecentNtnMissingActivity(results.slice(0, 5));
    setSuccessMessage(`Processed ${results.length} NTN Missing records!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const processNtnAutoUpdateFile = (data: any[]) => {
    const results = data.map((row, index) => {
      const tracking = (row['Tracking Number'] || row['tracking'] || '').toString().trim();
      const shipperCompany = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const shipperName = (row['Shipper Name'] || row['name'] || '').toString().trim();
      
      // Fuzzy match logic
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedShipper = normalize(shipperCompany);
      
      const match = ntnRecords.find(record => {
        const normalizedRecordName = normalize(record.name);
        return normalizedShipper.includes(normalizedRecordName) || normalizedRecordName.includes(normalizedShipper);
      });
      
      let updatedShipper = shipperCompany;
      let status = 'Not Found';
      let color = 'red';
      let foundNtn = '';
      
      if (match) {
        foundNtn = match.ntn || match.cnic || '';
        // Remove NTN prefix if it exists to satisfy user request for this tool
        if (foundNtn) {
          foundNtn = foundNtn.replace(/^NTN\s*/i, '');
        }
        
        const rawFound = getRawNtn(foundNtn);
        const finalRaw = getRawNtn(shipperCompany);
        if (rawFound && !finalRaw.includes(rawFound)) {
          updatedShipper = `${shipperCompany} ${foundNtn}`;
        } else {
          updatedShipper = shipperCompany;
        }
        
        status = 'Filled';
        color = 'emerald';
      } else {
        // Try to extract from address if not found in DB
        const addr1 = (row['Shipper Address line 1'] || row['address1'] || '').toString().trim();
        const addrAddl = (row['Shpr Addl Addr'] || row['address2'] || '').toString().trim();
        const taxId = (row['Shpr Tax ID Number'] || row['tax_id'] || row['NTN'] || '').toString().trim();
        
        [shipperCompany, shipperName, addr1, addrAddl, taxId].forEach(text => {
          if (!foundNtn) {
            const match = text.match(NTN_REGEX);
            if (match) {
              // Remove "NTN " prefix from the cleaned value for this tool
              foundNtn = cleanNtnValue(match[0]).replace(/^NTN\s+/i, '');
              
              const rawFound = getRawNtn(foundNtn);
              const finalRaw = getRawNtn(shipperCompany);
              if (rawFound && !finalRaw.includes(rawFound)) {
                updatedShipper = `${shipperCompany} ${foundNtn}`;
              } else {
                updatedShipper = shipperCompany;
              }
              
              status = 'Filled';
              color = 'emerald';
            }
          }
        });
      }
      
      return {
        id: index.toString(),
        tracking,
        shipper: updatedShipper,
        ntn: foundNtn,
        originalShipper: shipperCompany,
        name: shipperName,
        status,
        color,
        service: row['Service Type'] || row['service'] || 'N/A'
      };
    });

    // Sort: "Not Found" at the top
    const sortedResults = [...results].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'Not Found' ? -1 : 1;
    });

    setNtnAutoUpdateResults(sortedResults);
    setRecentNtnAutoUpdateActivity(sortedResults.slice(0, 5));
    setSuccessMessage(`Processed ${results.length} records for NTN Auto Update!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const processBucketShopFile = (data: any[]) => {
    const cnicPattern = /\b\d{5}-\d{7}-\d\b|\b\d{13}\b/;
    const invalidSuffixes = [/\s*-\s*e\s*form/i, /\s*-\s*eform/i, /\s*-\s*a$/i, /\s*-\s*c$/i];
    const sialkotKeywords = ['SIALKOT', 'SIALKOT/PNS', 'PARISROADSILAKOT', 'SKT', 'SKTA'];
    const invalidRefs = ['9999', '9099'];

    const filteredData = data.filter(row => {
      const desc = (row['CE Commodity Description'] || row['Description'] || '').toString().trim();
      const company = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const name = (row['Shipper Name'] || row['name'] || '').toString().trim();
      const taxId = (row['Shpr Tax ID Number'] || row['tax_id'] || row['NTN'] || '').toString().trim();
      const customsValueRaw = row['Customs Value'] || row['value'] || 0;
      const customsValue = parseFloat(customsValueRaw.toString().replace(/[^0-9.]/g, '')) || 0;
      const city = (row['Shpr City'] || row['city'] || '').toString().trim().toUpperCase();
      const ref = (row['Shipper Ref'] || row['ref'] || '').toString().trim();

      // 1. Description must not be blank
      if (desc === '') return false;

      // 2. Customs Value must be < 500
      if (customsValue >= 500) return false;

      // 3. Name or Tax ID must not contain NTN or CNIC
      const hasNtnOrCnic = (text: string) => {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return lowerText.includes('ntn') || 
               lowerText.includes('cnic') || 
               /\d{7,}/.test(text.replace(/[-\s]/g, '')) || 
               NTN_REGEX.test(text) || 
               cnicPattern.test(text);
      };

      if (hasNtnOrCnic(name) || hasNtnOrCnic(taxId)) return false;

      // Special handling for Company: if it has NTN/CNIC, only skip if it's NOT Sialkot or starts with 99
      const isSialkot = sialkotKeywords.some(k => city.includes(k));
      const startsWith99 = ref.startsWith('99');

      if (hasNtnOrCnic(company)) {
        if (!isSialkot || startsWith99) return false;
      }

      // 4. Company must not end with specific suffixes (or contain e-form)
      const hasInvalidSuffix = invalidSuffixes.some(regex => regex.test(company));
      if (hasInvalidSuffix) return false;

      // 5. Shpr City must be Sialkot related
      if (!isSialkot) return false;

      // 6. Shipper Ref must not start with 99 or be 9099
      if (startsWith99 || ref === '9099') return false;

      return true;
    });

    const results = filteredData.map((row, index) => ({
      id: index.toString(),
      tracking: (row['Tracking Number'] || row['tracking'] || '').toString().trim(),
      shipper: row['Shipper Company'] || row['shipper'] || 'N/A',
      name: row['Shipper Name'] || row['name'] || 'N/A',
      service: row['Service Type'] || row['service'] || 'N/A',
      city: row['Shpr City'] || row['city'] || 'N/A',
      color: 'teal'
    }));

    setBucketShopResults(results);
    setRecentBucketShopActivity(results.slice(0, 5));
    setSuccessMessage(`Processed ${results.length} Bucket Shop records!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const processDifferentLinesFile = (data: any[]) => {
    const filteredData = data.filter(row => {
      const desc = row['CE Commodity Description'] || row['Description'] || '';
      return desc.toString().trim() !== '';
    });

    const results = filteredData.map((row, index) => {
      let company = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const name = (row['Shipper Name'] || row['name'] || '').toString().trim();
      const addr1 = (row['Shipper Address line 1'] || row['address1'] || '').toString().trim();
      const addrAddl = (row['Shpr Addl Addr'] || row['address2'] || '').toString().trim();
      const taxId = (row['Shpr Tax ID Number'] || row['tax_id'] || row['NTN'] || '').toString().trim();

      // Find NTN in any of the fields
      let foundNtn = null;
      [company, name, addr1, addrAddl, taxId].forEach(text => {
        if (!foundNtn) {
          const match = text.match(NTN_REGEX);
          if (match) {
            foundNtn = cleanNtnValue(match[0]);
          }
        }
      });

      // Check if company is just an NTN
      const companyMatch = company.match(NTN_REGEX);
      const isCompanyNtnOnly = !!(companyMatch && companyMatch[0].trim() === company.trim());

      let finalCompany = company;
      if (!finalCompany || isCompanyNtnOnly) {
        finalCompany = name;
      }

      if (foundNtn) {
        const rawFound = getRawNtn(foundNtn);
        const finalRaw = getRawNtn(finalCompany);
        if (rawFound && !finalRaw.includes(rawFound)) {
          finalCompany = finalCompany + " " + foundNtn;
        }
      }

      return {
        id: index.toString(),
        tracking: (row['Tracking Number'] || row['tracking'] || '').toString().trim(),
        company: finalCompany,
        name: name,
        addrAddl: addrAddl,
        addr1: addr1,
        status: foundNtn ? 'Filled' : 'Not Found',
        color: foundNtn ? 'blue' : 'gray'
      };
    });

    // Sort: Not Found at the top
    const sortedResults = [...results].sort((a, b) => {
      if (a.status === 'Not Found' && b.status === 'Filled') return -1;
      if (a.status === 'Filled' && b.status === 'Not Found') return 1;
      return 0;
    });

    setDifferentLinesResults(sortedResults);
    setRecentDifferentLinesActivity(sortedResults.slice(0, 5));
    setSuccessMessage(`Processed ${results.length} Different Lines records!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const exportDifferentLinesResults = () => {
    if (differentLinesResults.length === 0) return;
    
    const exportData = differentLinesResults.map(row => ({
      'Tracking Number': row.tracking.toString(),
      'Shipper Company (Updated)': row.company,
      'Shipper Name': row.name,
      'Address Lines': `${row.addrAddl} ${row.addr1}`,
      'Status': row.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Different Lines Results");
    XLSX.writeFile(wb, "Different_Lines_Processing_Results.xlsx");
  };

  const exportHSCodeResults = () => {
    if (hsCodeResults.length === 0) return;
    
    const exportData = hsCodeResults.map(row => ({
      'Tracking Number': row.tracking.toString(),
      'Shipper Company': row.shipper,
      'Commodity Harmonized Code': row.hs,
      'Digits': row.hsDigits.length,
      'Status': row.isValid ? 'Valid' : 'Invalid',
      'Service Type': row.service,
      'Country': row.country
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HS Code Results");
    XLSX.writeFile(wb, "HS_Code_Verification_Results.xlsx");
  };

  const exportNtnMissingResults = () => {
    if (ntnMissingResults.length === 0) return;
    
    const exportData = ntnMissingResults.map(row => ({
      'Tracking Number': row.tracking.toString(),
      'Shipper Company': row.shipper,
      'Shipper Name': row.name,
      'Service Type': row.service,
      'Customs Value': row.value
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NTN Missing Results");
    XLSX.writeFile(wb, "NTN_Missing_Results.xlsx");
  };

  const exportNtnAutoUpdateResults = () => {
    if (ntnAutoUpdateResults.length === 0) return;
    
    const exportData = ntnAutoUpdateResults.map(row => ({
      'Tracking Number': row.tracking.toString(),
      'Shipper Company': row.shipper,
      'Shipper Name': row.name,
      'Status': row.status,
      'Service Type': row.service
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NTN Auto Update Results");
    XLSX.writeFile(wb, "NTN_Auto_Update_Results.xlsx");
  };

  const exportBucketShopResults = () => {
    if (bucketShopResults.length === 0) return;
    
    const exportData = bucketShopResults.map(row => ({
      'Tracking Number': row.tracking.toString(),
      'Shipper Company': row.shipper,
      'Shipper Name': row.name,
      'Service Type': row.service,
      'Shpr City': row.city
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bucket Shop Results");
    XLSX.writeFile(wb, "Bucket_Shop_Results.xlsx");
  };

  const handleNtnDatabaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    const processData = async (data: any[]) => {
      if (!user) return;
      
      const newRecords = data.map((row) => ({
        ref: (row['REFF'] || row['ref'] || row['Ref'] || '').toString().trim(),
        name: (row['COMPANY NAMES'] || row['name'] || row['Name'] || '').toString().trim(),
        cnic: (row['CNIC'] || row['cnic'] || '').toString().trim(),
        ntn: (row['NTN'] || row['ntn'] || '').toString().trim(),
        status: 'Active',
        color: 'emerald',
        userId: user.uid,
        createdAt: serverTimestamp()
      })).filter(r => r.name !== '');

      try {
        const batch = writeBatch(db);
        newRecords.forEach(record => {
          const docRef = doc(collection(db, 'ntn_records'));
          batch.set(docRef, record);
        });
        await batch.commit();
        setSuccessMessage(`Uploaded ${newRecords.length} NTN records to database!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error uploading NTN records:', err);
        setError('Failed to upload records to database.');
      }
    };

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processData(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleHSCodeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processHSCodeFile(results.data);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processHSCodeFile(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleNtnMissingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processNtnMissingFile(results.data);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processNtnMissingFile(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleNtnAutoUpdateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processNtnAutoUpdateFile(results.data);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processNtnAutoUpdateFile(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleBucketShopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processBucketShopFile(results.data);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processBucketShopFile(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleDifferentLinesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processDifferentLinesFile(results.data);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processDifferentLinesFile(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleSearch = () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 600);
  };

  const handleExport = () => {
    const headers = ['Ref', 'Name', 'NTN', 'CNIC', 'Status'];
    const rows = ntnRecords.map(r => [r.ref, r.name, r.ntn, r.cnic, r.status]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ntn_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditModalOpen) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isEditModalOpen]);

  // --- Table Data (Stateful for editing/expiring) ---
  // Suggestions Logic
  const allSuggestions = [
    ...ntnRecords.map(r => ({ id: r.id, title: r.name, subtitle: `NTN: ${r.ntn} | Ref: ${r.ref}`, type: 'NTN', data: r })),
    ...hsCodeRecords.map(r => ({ id: r.id, title: r.shipper, subtitle: `Tracking: ${r.tracking} | HS: ${r.hs}`, type: 'HS', data: r })),
    ...ntnMissingRecords.map(r => ({ id: r.id, title: r.name, subtitle: `Tracking: ${r.tracking} | Co: ${r.company}`, type: 'Missing', data: r })),
    ...ntnAutoUpdateRecords.map(r => ({ id: r.id, title: r.name, subtitle: `Tracking: ${r.tracking} | NTN: ${r.ntn}`, type: 'Auto', data: r })),
    ...bucketShopRecords.map(r => ({ id: r.id, title: r.name, subtitle: `Tracking: ${r.tracking} | Co: ${r.company}`, type: 'Bucket', data: r })),
    ...differentLinesRecords.map(r => ({ id: r.id, title: r.name, subtitle: `Tracking: ${r.tracking} | Addr: ${r.addr}`, type: 'Lines', data: r })),
  ];

  const suggestions = searchQuery.length > 1 
    ? allSuggestions.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleExpire = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'ntn_records', id);
      await updateDoc(docRef, { status: 'Expired', color: 'red' });
      setSuccessMessage('NTN record expired successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error expiring record:', err);
      setError('Failed to update record status.');
    }
  };

  const handleDeleteRecord = (collectionName: string, id: string) => {
    if (!user) return;
    setRecordToDelete({ collectionName, id });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!user || !recordToDelete) return;
    
    // Optimistic UI update: Close modal and show success immediately
    const { collectionName, id } = recordToDelete;
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
    setSuccessMessage('Record deleted successfully');
    setTimeout(() => setSuccessMessage(''), 3000);

    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record from database.');
    }
  };

  const confirmDeleteSelectedNtnRecords = async () => {
    if (!user || selectedNtnRecords.length === 0 || isDeletingBulk) return;
    
    const count = selectedNtnRecords.length;
    setIsDeletingBulk(true);
    setSuccessMessage(`Deleting ${count} records...`);
    
    try {
      console.log(`Attempting to delete ${count} records:`, selectedNtnRecords);
      const deletePromises = selectedNtnRecords.map(id => {
        const docRef = doc(db, 'ntn_records', id);
        return deleteDoc(docRef);
      });
      
      await Promise.all(deletePromises);
      console.log('Bulk delete successful');
      setSuccessMessage(`${count} records deleted successfully`);
      setSelectedNtnRecords([]);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting records:', err);
      setError('Failed to delete some records from database.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (record: any) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const { id, type, data, ...updateData } = editingRecord;
    const collectionName = type === 'HS' ? 'hs_code_records' : 'ntn_records';
    
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updateData);
      setIsEditModalOpen(false);
      setSuccessMessage('Record updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving edit:', err);
      setError('Failed to update record.');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const collectionName = getCollectionName(activeTab);
    let newEntry: any = {
      userId: user.uid,
      createdAt: serverTimestamp()
    };
    
    if (activeTab === 'HS Code') {
      newEntry = {
        ...newEntry,
        tracking: newRecord.ref,
        shipper: newRecord.name,
        hs: newRecord.ntn,
        ceCode: newRecord.cnic,
        service: 'Air Freight',
        color: 'blue',
      };
    } else if (activeTab === 'NTN Missing') {
      newEntry = {
        ...newEntry,
        tracking: newRecord.ref,
        company: newRecord.name,
        name: 'Pending',
        service: 'Express',
        color: 'orange',
      };
    } else if (activeTab === 'Auto Update') {
      newEntry = {
        ...newEntry,
        tracking: newRecord.ref,
        name: newRecord.name,
        ntn: newRecord.ntn,
        status: 'Pending',
        color: 'blue',
      };
    } else if (activeTab === 'Bucket Shop') {
      newEntry = {
        ...newEntry,
        tracking: newRecord.ref,
        company: newRecord.name,
        name: 'Pending',
        service: 'Express',
        color: 'teal',
      };
    } else if (activeTab === 'Different Lines') {
      newEntry = {
        ...newEntry,
        tracking: newRecord.ref,
        company: newRecord.name,
        name: 'Pending',
        addr: 'Pending',
        service: 'Express',
        color: 'blue',
      };
    } else {
      newEntry = {
        ...newEntry,
        ...newRecord,
      };
    }

    try {
      // Optimistic UI update: Close modal, reset form, and show success immediately
      setIsAddModalOpen(false);
      const addedTab = activeTab;
      setNewRecord({
        ref: '',
        name: '',
        ntn: '',
        cnic: '',
        status: 'Active',
        color: 'emerald'
      });
      setSuccessMessage(`New record added to ${addedTab} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);

      await addDoc(collection(db, collectionName), newEntry);
    } catch (err) {
      console.error('Error adding record:', err);
      setError('Failed to add record to database.');
    }
  };

  // --- Filtered Data ---
  const filteredNtnRecords = ntnRecords.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.ref.toLowerCase().includes(query) || 
      row.name.toLowerCase().includes(query) ||
      row.ntn.toLowerCase().includes(query) ||
      row.cnic.toLowerCase().includes(query)
    );
  });

  const filteredHsCodeRecords = hsCodeRecords.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.tracking.toLowerCase().includes(query) || 
      row.shipper.toLowerCase().includes(query) ||
      row.hs.toLowerCase().includes(query) ||
      row.ceCode.toLowerCase().includes(query)
    );
  });

  const filteredNtnMissingRecords = ntnMissingRecords.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.tracking.toLowerCase().includes(query) || 
      row.company.toLowerCase().includes(query) ||
      row.name.toLowerCase().includes(query) ||
      row.service.toLowerCase().includes(query)
    );
  });

  const filteredNtnAutoUpdateRecords = ntnAutoUpdateRecords.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.tracking.toLowerCase().includes(query) || 
      row.name.toLowerCase().includes(query) ||
      row.ntn.toLowerCase().includes(query)
    );
  });

  const filteredBucketShopRecords = bucketShopRecords.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.tracking.toLowerCase().includes(query) || 
      row.company.toLowerCase().includes(query) ||
      row.name.toLowerCase().includes(query) ||
      row.service.toLowerCase().includes(query)
    );
  });

  const filteredDifferentLinesRecords = differentLinesRecords.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.tracking.toLowerCase().includes(query) || 
      row.company.toLowerCase().includes(query) ||
      row.name.toLowerCase().includes(query) ||
      row.addr.toLowerCase().includes(query) ||
      row.service.toLowerCase().includes(query)
    );
  });



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Login successful!');
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Account created successfully! Waiting for approval.');
        setIsLogin(true);
      }
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to process request.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMessage('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMessage('Login successful!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      console.error('Google Login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized Domain: Please add this domain to your Firebase Console (Authentication > Settings > Authorized domains).');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Reset link sent! 1. Open the link in your email. 2. Copy the "oobCode" from the URL. 3. Paste it here.');
      setIsResetMode(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to send password reset email. Check your internet or Firebase settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!resetCode || !resetNewPassword) {
      setError('Please provide both the code and the new password.');
      return;
    }
    if (resetNewPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, resetCode, resetNewPassword);
      setSuccessMessage('Password reset successful! You can now login with your new password.');
      setTimeout(() => {
        setIsResetMode(false);
        setResetCode('');
        setResetNewPassword('');
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Confirm reset error:', err);
      if (err.code === 'auth/invalid-action-code') {
        setError('Invalid or expired code. Please request a new reset link.');
      } else {
        setError(err.message || 'Failed to reset password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowSplash(true);
      setSuccessMessage('Logged out successfully');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('Failed to log out.');
    }
  };

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || isCheckingApproval) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (!isApproved) {
      return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-6">
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 max-w-lg w-full text-center backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div className="w-24 h-24 bg-blue-600/20 rounded-full mx-auto flex items-center justify-center text-blue-400 mb-8 shadow-lg shadow-blue-600/10 border border-blue-500/20">
              <Shield size={48} className="animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Access Pending Approval</h2>
            <p className="text-blue-200/60 text-lg mb-8 leading-relaxed">
              Your account (<span className="text-blue-400 font-bold">{user.email}</span>) has been registered. 
              Please wait for the administrator to approve your access request.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-8">
              <p className="text-blue-400 text-sm font-medium">
                An email notification has been sent to the administrator. 
                You will be able to access the dashboard once approved.
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl transition-all font-bold flex items-center justify-center space-x-3 border border-white/10 group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Sign Out & Check Later</span>
            </button>
          </div>
        </div>
      );
    }


    return (
      <div className="min-h-screen w-full bg-[#f0f2f5] text-gray-800 font-sans flex relative">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          ADMIN_EMAIL={ADMIN_EMAIL}
          handleLogout={handleLogout}
          profile={profile}
          isScreenLocked={isScreenLocked}
          setIsScreenLocked={setIsScreenLocked}
          lockPin={lockPin}
        />
        <main className="flex-1 flex flex-col" style={{ contain: 'layout' }}>
          <Header 
            profile={profile}
            pendingUsers={pendingUsers}
            allUsers={allUsers}
            user={user}
            ADMIN_EMAIL={ADMIN_EMAIL}
            handleLogout={handleLogout}
            setActiveTab={setActiveTab}
            setSuccessMessage={setSuccessMessage}
          />

          {/* Content Area */}
          <div className="flex-1 p-8">
            <div className="max-w-[1600px] mx-auto w-full">
              {activeTab === 'User Management' && user?.email === ADMIN_EMAIL && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">User Management</h2>
                    <p className="text-gray-500 text-sm font-medium">Review and approve access requests</p>
                  </div>
                  <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-blue-100">
                    {allUsers.length} Total Users
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {allUsers.map((u) => (
                    <div key={u.id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                          <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{u.displayName}</h3>
                          <p className="text-sm text-gray-500 font-medium">{u.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                              u.status === 'approved' ? 'bg-green-100 text-green-600' : 
                              u.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                              'bg-red-100 text-red-600'
                            }`}>
                              {u.status}
                            </span>
                            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                              Joined {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status !== 'approved' && (
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', u.id), { status: 'approved' });
                                setSuccessMessage(`Approved ${u.displayName}`);
                                setTimeout(() => setSuccessMessage(''), 2000);
                              } catch (err) {
                                console.error('Error approving user:', err);
                              }
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                          >
                            <CheckCircle2 size={14} />
                            <span>Approve</span>
                          </button>
                        )}
                        {u.status !== 'rejected' && (
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', u.id), { status: 'rejected' });
                                setSuccessMessage(`Rejected ${u.displayName}`);
                                setTimeout(() => setSuccessMessage(''), 2000);
                              } catch (err) {
                                console.error('Error rejecting user:', err);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteRecord('users', u.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {allUsers.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                      <User size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-medium">No access requests found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Dashboard' && (
              <>
                {/* New Search Bar Section (Moved from header) */}
                <div className="mb-10">
                  <div className="search-container-outer">
                    <div className="search-wrapper-3d">
                      <div className="icon-box-orange-grid">
                        <div className="grid-animated-icon">
                          <div className="grid-dot"></div>
                          <div className="grid-dot"></div>
                          <div className="grid-dot"></div>
                          <div className="grid-dot"></div>
                        </div>
                      </div>

                      <input 
                        type="text" 
                        className="search-input-main"
                        placeholder="Search NTN, CNIC or Company Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />

                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mr-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                          title="Clear search"
                        >
                          <X size={20} />
                        </button>
                      )}

                      <button 
                        onClick={() => searchQuery.length > 0 ? null : setActiveTab('NTN Search')}
                        className="btn-search-3d-purple"
                      >
                        <Search size={18} />
                        SEARCH
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Results (if query exists) */}
                {searchQuery.length > 0 && (
                  <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between px-4 mb-6">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Search Results ({filteredNtnRecords.length})</h3>
                      <div className="h-px flex-1 bg-gray-100 mx-6" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredNtnRecords.length > 0 ? (
                        filteredNtnRecords.map((record, i) => (
                          <motion.div 
                            key={record.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#1e293b] p-6 rounded-[32px] border border-white/5 shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all group/item relative overflow-hidden text-white"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-sm group-hover/item:scale-110 transition-transform">
                                  <Database size={22} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-white tracking-tight truncate max-w-[200px]">{record.name}</h4>
                                  <div className="flex items-center space-x-2 mt-0.5">
                                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">Ref: #{record.ref}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-${record.color}-500 animate-pulse`} />
                                    <span className={`text-[10px] font-black text-${record.color}-400 uppercase tracking-widest`}>{record.status}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecord('ntn_records', record.id)}
                                  className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative group/copy hover:bg-white/10 hover:border-blue-500/30 transition-all">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">NTN Number</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-mono font-bold text-white">{record.ntn}</p>
                                  <button 
                                    onClick={() => handleCopy(record.ntn, `${record.id}-ntn`)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    {copiedId === `${record.id}-ntn` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative group/copy hover:bg-white/10 hover:border-blue-500/30 transition-all">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">CNIC Number</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-mono font-bold text-white">{record.cnic}</p>
                                  <button 
                                    onClick={() => handleCopy(record.cnic, `${record.id}-cnic`)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    {copiedId === `${record.id}-cnic` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-2 py-16 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                          <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-lg font-bold text-gray-400">No records found for "{searchQuery}"</p>
                          <p className="text-xs text-gray-300 uppercase tracking-widest mt-1">Try searching with a different keyword</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="stats-grid-3d mb-10">
                  {[
                    { label: 'NTN TOTAL RECORDS', value: ntnRecords.length.toLocaleString(), icon: FileText, cardClass: 'card-blue-3d', iconBg: 'bg-blue-3d' },
                    { label: 'HS CODE RESULTS', value: hsCodeResults.length.toLocaleString(), icon: BarChart3, cardClass: 'card-purple-3d', iconBg: 'bg-purple-3d' },
                    { label: 'NTN MISSING RESULTS', value: ntnMissingResults.length.toLocaleString(), icon: AlertTriangle, cardClass: 'card-orange-3d', iconBg: 'bg-orange-3d' },
                    { label: 'BUCKET SHOP RESULTS', value: bucketShopResults.length.toLocaleString(), icon: Store, cardClass: 'card-teal-3d', iconBg: 'bg-teal-3d' },
                  ].map((stat, i) => (
                    <div key={i} className={`stat-card-3d ${stat.cardClass} border-none`}>
                      <div className={`icon-wrapper-3d ${stat.iconBg}`}>
                        <stat.icon size={24} />
                      </div>
                      <div className="stat-label-3d">{stat.label}</div>
                      <div className="stat-value-container-3d">
                        <span className="stat-number-3d">{stat.value}</span>
                        <span className="stat-suffix-3d">Results</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent NTN Records Table (Glass) */}
                <div className="animated-border-3d animated-border-3d-glass shadow-2xl">
                  <div className="table-container-3d !border-none !shadow-none w-full">
                    {/* Background Animation Layer */}
                    <div className="bg-animation-layer-3d">
                      <div className="orb-3d orb-purple-3d"></div>
                      <div className="orb-3d orb-orange-3d"></div>
                    </div>

                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="main-title-badge-3d">
                      <div className="title-icon-box-3d">
                        <History size={20} />
                      </div>
                      <div>
                        <h3 className="text-[22px] font-black text-[#0f172a] tracking-tight uppercase leading-tight">Recent NTN Records</h3>
                        <p className="text-[13px] text-[#64748b] font-medium mt-0.5">Live Database Overview</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-3d btn-add-3d"
                      >
                        <Plus size={14} />
                        <span>Add New Record</span>
                      </button>
                      <button className="btn-3d btn-excel-3d">
                        <FileSpreadsheet size={14} />
                        <span>Export Excel</span>
                      </button>
                      <button className="btn-3d btn-view-3d">
                        <Eye size={14} />
                        <span>View All</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="pb-5 px-4 text-left border-b-2 border-[#f1f5f9]">
                            <div className="header-label-badge-3d label-blue-3d">
                              <Hash size={12} />
                              <span>Ref ID</span>
                            </div>
                          </th>
                          <th className="pb-5 px-4 text-left border-b-2 border-[#f1f5f9]">
                            <div className="header-label-badge-3d label-purple-3d">
                              <Building2 size={12} />
                              <span>Company Name</span>
                            </div>
                          </th>
                          <th className="pb-5 px-4 text-left border-b-2 border-[#f1f5f9]">
                            <div className="header-label-badge-3d label-orange-3d">
                              <Barcode size={12} />
                              <span>NTN Number</span>
                            </div>
                          </th>
                          <th className="pb-5 px-4 text-left border-b-2 border-[#f1f5f9]">
                            <div className="header-label-badge-3d label-green-3d">
                              <Contact size={12} />
                              <span>CNIC Number</span>
                            </div>
                          </th>
                          <th className="pb-5 px-4 text-left border-b-2 border-[#f1f5f9]">
                            <div className="header-label-badge-3d label-emerald-3d">
                              <Activity size={12} />
                              <span>Status</span>
                            </div>
                          </th>
                          <th className="pb-5 px-4 text-right border-b-2 border-[#f1f5f9]">
                            <div className="header-label-badge-3d label-slate-3d float-right">
                              <Settings2 size={12} />
                              <span>Actions</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8fafc]">
                        {filteredNtnRecords.length > 0 ? (
                          filteredNtnRecords.slice(0, 5).map((row, i) => (
                            <tr key={i} className="group hover:bg-white/40 transition-all">
                              <td className="py-6 px-4">
                                <span className="ref-tag-3d">#{row.ref}</span>
                              </td>
                              <td className="py-6 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <Building size={14} className="text-[#4D148C] opacity-60" />
                                  <span className="text-sm font-extrabold text-[#1e293b] uppercase">{row.name}</span>
                                </div>
                              </td>
                              <td className="py-6 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <Fingerprint size={13} className="text-[#FF6200] opacity-60" />
                                  <span className="text-sm font-semibold text-[#64748b]">{row.ntn}</span>
                                </div>
                              </td>
                              <td className="py-6 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <Contact size={13} className="text-[#059669] opacity-60" />
                                  <span className="text-sm font-semibold text-[#64748b]">{row.cnic || '—'}</span>
                                </div>
                              </td>
                              <td className="py-6 px-4">
                                <span className="status-badge-3d">
                                  <span className="status-dot-3d"></span>
                                  <span>Active</span>
                                </span>
                              </td>
                              <td className="py-6 px-4">
                                <div className="flex items-center justify-end space-x-4">
                                  <Edit2 
                                    size={18} 
                                    className="action-icon-3d text-[#3b82f6]" 
                                    onClick={() => handleEdit(row)}
                                  />
                                  <Trash2 
                                    size={18} 
                                    className="action-icon-3d text-[#94a3b8]" 
                                    onClick={() => handleDeleteRecord('ntn_records', row.id)}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-400 font-bold">
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

                {/* HS Code Verification Table */}
                <div className="animated-border-3d w-full shadow-2xl mt-10">
                  <div className="bg-white w-full rounded-[2.3rem] p-10">
                    {/* Main Title Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                      <div className="flex items-center gap-5">
                        <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100">
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recent HS Code Verification</h1>
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                              <History size={12} /> RECENT
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Activity size={16} className="text-green-500" />
                            <p className="text-sm text-gray-400 font-medium">Real-time harmonized system code tracking</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('HS Code')}
                        className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all"
                      >
                        View All
                      </button>
                    </div>

                    {/* Table with Pill Headers */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="pb-8 px-2">
                              <div className="pill-header-hs pill-blue-hs">
                                <Hash size={14} />
                                <span>Tracking Number</span>
                              </div>
                            </th>
                            <th className="pb-8 px-2">
                              <div className="pill-header-hs pill-purple-hs">
                                <Building2 size={14} />
                                <span>Shipper Company</span>
                              </div>
                            </th>
                            <th className="pb-8 px-2">
                              <div className="pill-header-hs pill-orange-hs">
                                <Info size={14} />
                                <span>Status</span>
                              </div>
                            </th>
                            <th className="pb-8 px-2">
                              <div className="pill-header-hs pill-green-hs">
                                <Truck size={14} />
                                <span>Service Type</span>
                              </div>
                            </th>
                            <th className="pb-8 px-2 text-right">
                              <div className="pill-header-hs pill-gray-hs float-right">
                                <Settings2 size={14} />
                                <span>Actions</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-semibold">
                          {recentHSCodeActivity.length > 0 ? (
                            recentHSCodeActivity.map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-gray-50">
                                <td className="py-6 px-4">
                                  <div className="flex items-center space-x-2 group/copy">
                                    <span className="text-blue-500 hover:underline cursor-pointer">{row.tracking}</span>
                                    <button 
                                      onClick={() => handleCopy(row.tracking, `hs-tracking-${i}`)}
                                      className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                      title="Copy Tracking Number"
                                    >
                                      {copiedId === `hs-tracking-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-6 px-4 text-slate-700 uppercase tracking-tight">{row.shipper}</td>
                                <td className="py-6 px-4">
                                  <span className={row.isValid ? 'status-valid-hs' : 'status-invalid-hs'}>
                                    {row.isValid ? 'VALID' : 'INVALID'}
                                  </span>
                                </td>
                                <td className="py-6 px-4 text-gray-500 font-medium">{row.service}</td>
                                <td className="py-6 px-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteRecord('hs_code_records', row.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-gray-400 font-bold">
                                No verification results found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

            {/* NTN Missing Table */}
            <div className="animated-border-3d w-full shadow-2xl mt-10">
              <div className="bg-white w-full rounded-[2.3rem] p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-orange-600 p-4 rounded-3xl text-white shadow-xl shadow-orange-100">
                      <AlertTriangle size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recent NTN Missing</h1>
                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          <History size={12} /> MISSING
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity size={16} className="text-orange-500" />
                        <p className="text-sm text-gray-400 font-medium">Tracking records with missing tax identification</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setActiveTab('NTN Missing')}
                      className="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-orange-100 transition-all"
                    >
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-blue-hs">
                            <Hash size={14} />
                            <span>Tracking Number</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-purple-hs">
                            <Building2 size={14} />
                            <span>Shipper Company</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-orange-hs">
                            <Contact size={14} />
                            <span>Shipper Name</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-green-hs">
                            <Truck size={14} />
                            <span>Service Type</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2 text-right">
                          <div className="pill-header-hs pill-gray-hs float-right">
                            <Settings2 size={14} />
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold">
                      {recentNtnMissingActivity.length > 0 ? (
                        recentNtnMissingActivity.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-gray-50">
                            <td className="py-6 px-4">
                              <div className="flex items-center space-x-2 group/copy">
                                <span className="text-blue-500 hover:underline cursor-pointer">{row.tracking}</span>
                                <button 
                                  onClick={() => handleCopy(row.tracking, `missing-tracking-${i}`)}
                                  className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                  title="Copy Tracking Number"
                                >
                                  {copiedId === `missing-tracking-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-slate-700 uppercase tracking-tight">{row.shipper}</td>
                            <td className="py-6 px-4 text-slate-600">{row.name}</td>
                            <td className="py-6 px-4 text-gray-500 font-medium">{row.service}</td>
                            <td className="py-6 px-4 text-right">
                              <button 
                                onClick={() => handleDeleteRecord('missing_records', row.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-400 font-bold">
                            No missing records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* NTN Auto Update Table */}
            <div className="animated-border-3d w-full shadow-2xl mt-10">
              <div className="bg-white w-full rounded-[2.3rem] p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-500 p-4 rounded-3xl text-white shadow-xl shadow-blue-100">
                      <Activity size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recent NTN Auto Update</h1>
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          <History size={12} /> AUTO UPDATE
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity size={16} className="text-blue-500" />
                        <p className="text-sm text-gray-400 font-medium">Automated tax identification updates</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setActiveTab('NTN Auto Update')}
                      className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all"
                    >
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-blue-hs">
                            <Hash size={14} />
                            <span>Tracking Number</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-purple-hs">
                            <Building2 size={14} />
                            <span>Shipper Name</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-orange-hs">
                            <Barcode size={14} />
                            <span>NTN Number</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-green-hs">
                            <Info size={14} />
                            <span>Status</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2 text-right">
                          <div className="pill-header-hs pill-gray-hs float-right">
                            <Settings2 size={14} />
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold">
                      {recentNtnAutoUpdateActivity.length > 0 ? (
                        recentNtnAutoUpdateActivity.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-gray-50">
                            <td className="py-6 px-4">
                              <div className="flex items-center space-x-2 group/copy">
                                <span className="text-blue-500 hover:underline cursor-pointer">{row.tracking}</span>
                                <button 
                                  onClick={() => handleCopy(row.tracking, `auto-update-tracking-${row.id}`)}
                                  className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                  title="Copy Tracking Number"
                                >
                                  {copiedId === `auto-update-tracking-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-slate-700 uppercase tracking-tight">{row.name}</td>
                            <td className="py-6 px-4">
                              <div className="flex items-center space-x-2 group/copy">
                                <span className="text-gray-500 font-mono">{row.ntn}</span>
                                <button 
                                  onClick={() => handleCopy(row.ntn, `auto-update-ntn-${row.id}`)}
                                  className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                >
                                  {copiedId === `auto-update-ntn-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-6 px-4">
                              <div className="flex items-center justify-start space-x-1.5">
                                <div className={`w-2 h-2 rounded-full bg-${row.color}-500 shadow-sm animate-pulse`} />
                                <span className={`text-${row.color}-600 font-bold`}>{row.status}</span>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-right">
                              <button 
                                onClick={() => handleDeleteRecord('auto_update_records', row.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-400 font-bold">
                            No auto update activity found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bucket Shop Entries Table */}
            <div className="animated-border-3d w-full shadow-2xl mt-10">
              <div className="bg-white w-full rounded-[2.3rem] p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-teal-600 p-4 rounded-3xl text-white shadow-xl shadow-teal-100">
                      <Store size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recent Bucket Shop Entries</h1>
                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          <History size={12} /> BUCKET SHOP
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity size={16} className="text-teal-500" />
                        <p className="text-sm text-gray-400 font-medium">Tracking records for bucket shop operations</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setActiveTab('Bucket Shop')}
                      className="bg-teal-50 text-teal-600 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-teal-100 transition-all"
                    >
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-blue-hs">
                            <Hash size={14} />
                            <span>Tracking Number</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-purple-hs">
                            <Building2 size={14} />
                            <span>Shipper Company</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-orange-hs">
                            <Contact size={14} />
                            <span>Shipper Name</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-green-hs">
                            <Truck size={14} />
                            <span>Service Type</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2 text-right">
                          <div className="pill-header-hs pill-gray-hs float-right">
                            <Settings2 size={14} />
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold">
                      {recentBucketShopActivity.length > 0 ? (
                        recentBucketShopActivity.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-gray-50">
                            <td className="py-6 px-4">
                              <div className="flex items-center space-x-2 group/copy">
                                <span className="text-blue-500 hover:underline cursor-pointer">{row.tracking}</span>
                                <button 
                                  onClick={() => handleCopy(row.tracking, `bucket-tracking-${row.id}`)}
                                  className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                  title="Copy Tracking Number"
                                >
                                  {copiedId === `bucket-tracking-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-slate-700 uppercase tracking-tight">{row.shipper}</td>
                            <td className="py-6 px-4 text-slate-600">{row.name}</td>
                            <td className="py-6 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100`}>
                                {row.service}
                              </span>
                            </td>
                            <td className="py-6 px-4 text-right">
                              <button 
                                onClick={() => handleDeleteRecord('bucket_shop_records', row.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-400 font-bold">
                            No bucket shop activity found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Different Lines NTN Table */}
            <div className="animated-border-3d w-full shadow-2xl mt-10">
              <div className="bg-white w-full rounded-[2.3rem] p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-100">
                      <LayoutGrid size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recent Different Lines NTN</h1>
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          <History size={12} /> DIFFERENT LINES
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity size={16} className="text-indigo-500" />
                        <p className="text-sm text-gray-400 font-medium">Tracking records with varied tax identification lines</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setActiveTab('Different Lines')}
                      className="bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition-all"
                    >
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-blue-hs">
                            <Hash size={14} />
                            <span>Tracking Number</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-purple-hs">
                            <Building2 size={14} />
                            <span>Shipper Company</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-orange-hs">
                            <Contact size={14} />
                            <span>Shipper Name</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-green-hs">
                            <Info size={14} />
                            <span>Address Details</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2">
                          <div className="pill-header-hs pill-blue-hs">
                            <Activity size={14} />
                            <span>Status</span>
                          </div>
                        </th>
                        <th className="pb-8 px-2 text-right">
                          <div className="pill-header-hs pill-gray-hs float-right">
                            <Settings2 size={14} />
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold">
                      {recentDifferentLinesActivity.length > 0 ? (
                        recentDifferentLinesActivity.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-gray-50">
                            <td className="py-6 px-4">
                              <div className="flex items-center space-x-2 group/copy">
                                <span className="text-blue-500 hover:underline cursor-pointer">{row.tracking}</span>
                                <button 
                                  onClick={() => handleCopy(row.tracking, `diff-tracking-${row.id}`)}
                                  className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                  title="Copy Tracking Number"
                                >
                                  {copiedId === `diff-tracking-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-slate-700 uppercase tracking-tight">{row.company}</td>
                            <td className="py-6 px-4 text-slate-600">{row.name}</td>
                            <td className="py-6 px-4 text-slate-500 max-w-xs truncate" title={`${row.addrAddl} ${row.addr1}`}>{row.addrAddl} {row.addr1}</td>
                            <td className="py-6 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-6 px-4 text-right">
                              <button 
                                onClick={() => handleDeleteRecord('different_lines_records', row.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-gray-400 font-bold">
                            No different lines activity found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'NTN Search' && (
          <div className="space-y-8">
            {/* Search Header */}
            <div className="mb-12 space-y-6">
              <div className="search-container-outer">
                <div className="search-wrapper-3d">
                  <div className="icon-box-orange-grid">
                    <div className="grid-animated-icon">
                      <div className="grid-dot"></div>
                      <div className="grid-dot"></div>
                      <div className="grid-dot"></div>
                      <div className="grid-dot"></div>
                    </div>
                  </div>

                  <input 
                    type="text" 
                    className="search-input-main"
                    placeholder="Search by NTN, CNIC, or Company Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`mr-4 text-gray-400 hover:text-gray-600 transition-colors z-10`}
                      title="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )}

                  {isSearching && (
                    <div className="mr-4">
                      <RefreshCw size={18} className="animate-spin text-blue-600" />
                    </div>
                  )}

                  <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="btn-search-3d-purple"
                  >
                    <Search size={18} />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button 
                  onClick={() => setIsNtnRecordsModalOpen(true)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2 font-bold text-xs"
                >
                  <List size={16} />
                  <span>Companies List</span>
                </button>
                <div className="relative group">
                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2 font-bold text-xs"
                  >
                    <Upload size={16} />
                    <span>Upload</span>
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-xs font-bold text-gray-800 mb-2">Required File Format</p>
                    <ul className="text-[10px] text-gray-500 space-y-1 list-disc pl-4">
                      <li><span className="font-bold text-blue-600">REFF:</span> Reference ID (e.g. 8601)</li>
                      <li><span className="font-bold text-blue-600">COMPANY NAMES:</span> Full Name of Company</li>
                      <li><span className="font-bold text-blue-600">NTN:</span> Tax Number (e.g. 1234567-9)</li>
                      <li><span className="font-bold text-blue-600">CNIC:</span> ID Number (e.g. 34603-3032743-3)</li>
                    </ul>
                    <p className="text-[9px] text-gray-400 mt-2 italic">Supports .csv, .xlsx, .xls</p>
                  </div>
                </div>
                <input 
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleNtnDatabaseUpload}
                />
                <button 
                  onClick={handleExport}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2 font-bold text-xs"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {searchQuery.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                  <Database size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">NTN Search Engine</h2>
                <p className="text-gray-400 font-medium mt-2 max-w-md">Enter a search term above to scan the database for company NTN details</p>
              </div>
            )}

                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400 font-bold">Scanning NTN Database...</p>
                  </div>
                ) : searchQuery.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Search Results ({filteredNtnRecords.length})</h3>
                      <div className="h-px flex-1 bg-gray-100 mx-6" />
                    </div>

                    {filteredNtnRecords.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredNtnRecords.map((record, i) => (
                          <motion.div 
                            key={record.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#1e293b] p-6 rounded-[32px] border border-white/5 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all group text-white"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                  <Database size={24} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-white tracking-tight">{record.name}</h4>
                                  <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">Ref: #{record.ref}</span>
                                    <span className={`text-[10px] font-black text-${record.color}-400 bg-${record.color}-500/10 px-2 py-0.5 rounded-lg uppercase tracking-wider`}>{record.status}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="p-3 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-blue-400 rounded-2xl transition-all"
                                  title="Edit Record"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleViewDetails(record)}
                                  className="p-3 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-blue-400 rounded-2xl transition-all"
                                  title="View Details"
                                >
                                  <FileText size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecord('ntn_records', record.id)}
                                  className="p-3 bg-white/5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-2xl transition-all"
                                  title="Delete Record"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">NTN Number</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-mono font-bold text-white">{record.ntn}</p>
                                  <button onClick={() => handleCopy(record.ntn, `search-tab-ntn-${record.id}`)} className="text-blue-400 hover:text-blue-300 transition-colors">
                                    {copiedId === `search-tab-ntn-${record.id}` ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">CNIC / Registration</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-mono font-bold text-white">{record.cnic}</p>
                                  <button onClick={() => handleCopy(record.cnic, `search-tab-cnic-${record.id}`)} className="text-blue-400 hover:text-blue-300 transition-colors">
                                    {copiedId === `search-tab-cnic-${record.id}` ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                          <LayoutGrid size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No records found for "{searchQuery}"</p>
                        <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Try searching with a different keyword</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

        {activeTab === 'Profile' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-16 left-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[32px] bg-white p-1 shadow-2xl">
                      <img 
                        src={profile.photoURL} 
                        alt="Profile" 
                        className="w-full h-full rounded-[28px] object-cover"
                      />
                    </div>
                    <button 
                      onClick={() => document.getElementById('profile-upload')?.click()}
                      className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all group-hover:scale-110"
                    >
                      <Upload size={16} />
                    </button>
                    <input 
                      id="profile-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setProfile({ ...profile, photoURL: url });
                          setSuccessMessage('Profile picture updated!');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-20 pb-10 px-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">{profile.name}</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">System Administrator</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (isEditingProfile) {
                        handleSaveProfile();
                      } else {
                        setEditProfileData({ ...profile });
                        setIsEditingProfile(true);
                      }
                    }}
                    className={`px-6 py-3 ${isEditingProfile ? 'bg-emerald-600' : 'bg-blue-600'} text-white rounded-2xl font-bold shadow-lg transition-all flex items-center space-x-2`}
                  >
                    {isEditingProfile ? <Save size={18} /> : <Edit2 size={18} />}
                    <span>{isEditingProfile ? 'Save Changes' : 'Edit Profile'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          <User size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Personal Information</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name</label>
                          {isEditingProfile ? (
                            <input 
                              type="text" 
                              value={editProfileData.name}
                              onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="font-bold text-gray-700">{profile.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Employee ID</label>
                          {isEditingProfile ? (
                            <input 
                              type="text" 
                              value={editProfileData.employeeId}
                              onChange={(e) => setEditProfileData({ ...editProfileData, employeeId: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="font-mono font-bold text-gray-700">{profile.employeeId}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                          <Bell size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Contact Details</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email Address</label>
                          {isEditingProfile ? (
                            <input 
                              type="email" 
                              value={editProfileData.email}
                              onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="font-bold text-gray-700">{profile.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Phone Number</label>
                          {isEditingProfile ? (
                            <input 
                              type="text" 
                              value={editProfileData.phone}
                              onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="font-bold text-gray-700">{profile.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                          <ShieldCheck size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Security Status & Activity</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-700">Two-Factor Auth</p>
                            <p className="text-[10px] text-gray-400 font-medium">Enhanced account security</p>
                          </div>
                          <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-700">Last Login Activity</p>
                            <p className="text-[10px] text-gray-400 font-medium">{lastLogin}</p>
                          </div>
                          <p className="text-[10px] font-bold text-gray-500">IP: 192.168.1.1</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                          <FileText size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Recent Activity Log</h3>
                      </div>
                      <div className="space-y-3">
                        {loginHistory.length > 0 ? (
                          loginHistory.slice(0, 5).map((login: any) => (
                            <div key={login.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100">
                              <div>
                                <p className="text-xs font-bold text-gray-700">Login Successful</p>
                                <p className="text-[10px] text-gray-400 font-medium">{login.time}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500">{login.ip}</p>
                                <p className="text-[9px] text-gray-400">{login.device}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center">
                            <p className="text-xs text-gray-400 font-medium italic">No recent login activity found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div id="security-settings" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                          <Settings size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Security Settings</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Login Credentials</h4>
                          <input 
                            type="text" 
                            placeholder="New Username" 
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <input 
                            id="new-password-input"
                            type="password" 
                            placeholder="New Password" 
                            value={settingsNewPassword}
                            onChange={(e) => setSettingsNewPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <button 
                            onClick={async () => {
                              if (!auth.currentUser) return;
                              
                              setLoading(true);
                              try {
                                // Update Display Name in Firebase Auth
                                if (newUsername) {
                                  await updateProfile(auth.currentUser, {
                                    displayName: newUsername
                                  });
                                  
                                  // Update Display Name in Firestore
                                  await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                                    displayName: newUsername
                                  });
                                  
                                  setProfile(prev => ({ ...prev, name: newUsername }));
                                }
                                
                                // Update Password in Firebase Auth
                                if (settingsNewPassword) {
                                  await updatePassword(auth.currentUser, settingsNewPassword);
                                }
                                
                                setSuccessMessage('Login credentials updated in Firebase!');
                                setNewUsername('');
                                setSettingsNewPassword('');
                                setTimeout(() => setSuccessMessage(''), 3000);
                              } catch (err: any) {
                                console.error('Error updating credentials:', err);
                                if (err.code === 'auth/requires-recent-login') {
                                  setError('Please logout and login again to change your password for security.');
                                } else {
                                  setError('Failed to update credentials: ' + err.message);
                                }
                                setTimeout(() => setError(''), 5000);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className={`w-full py-3 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all`}
                          >
                            {loading ? 'Updating...' : 'Update Login'}
                          </button>
                        </div>

                        <div className="pt-4 border-t border-gray-50 space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auto Logout Time</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 5, 10, 20].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => {
                                  setAutoLogoutMinutes(mins);
                                  setSuccessMessage(`Auto-logout set to ${mins} minutes`);
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                }}
                                className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                                  autoLogoutMinutes === mins
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-blue-200'
                                }`}
                              >
                                {mins} Min
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-gray-400 italic">App will logout automatically after {autoLogoutMinutes} minutes of inactivity.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Screen Lock PIN</h4>
                          <div className="flex space-x-2">
                            <input 
                              type="password" 
                              placeholder="New 4-Digit PIN" 
                              maxLength={4}
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                            />
                            <button 
                              onClick={() => {
                                if (newPin.length === 4) {
                                  setLockPin(newPin);
                                  setSuccessMessage('Security PIN updated!');
                                  setNewPin('');
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                } else {
                                  setError('PIN must be 4 digits');
                                  setTimeout(() => setError(''), 3000);
                                }
                              }}
                              className="px-4 bg-gray-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                            >
                              Save PIN
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          <Mail size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Email Notification Settings</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                          Configure EmailJS to receive email notifications when new users sign up. 
                          You can get these keys from your <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EmailJS Dashboard</a>.
                        </p>
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            placeholder="EmailJS Service ID" 
                            value={emailjsServiceId}
                            onChange={(e) => setEmailjsServiceId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <input 
                            type="text" 
                            placeholder="EmailJS Template ID" 
                            value={emailjsTemplateId}
                            onChange={(e) => setEmailjsTemplateId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <input 
                            type="text" 
                            placeholder="EmailJS Public Key" 
                            value={emailjsPublicKey}
                            onChange={(e) => setEmailjsPublicKey(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <button 
                            onClick={async () => {
                              try {
                                await setDoc(doc(db, 'settings', 'emailjs_service_id'), { id: 'emailjs_service_id', value: emailjsServiceId, updatedAt: new Date().toISOString() });
                                await setDoc(doc(db, 'settings', 'emailjs_template_id'), { id: 'emailjs_template_id', value: emailjsTemplateId, updatedAt: new Date().toISOString() });
                                await setDoc(doc(db, 'settings', 'emailjs_public_key'), { id: 'emailjs_public_key', value: emailjsPublicKey, updatedAt: new Date().toISOString() });
                                setSuccessMessage('Email settings saved to database!');
                                setTimeout(() => setSuccessMessage(''), 3000);
                              } catch (err) {
                                console.error('Error saving email settings:', err);
                                setError('Failed to save email settings');
                                setTimeout(() => setError(''), 3000);
                              }
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                          >
                            Save Email Settings
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden group mt-6">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="relative z-10">
                        <h4 className="text-lg font-black tracking-tight mb-2">Profit Upload</h4>
                        <p className="text-blue-100 text-xs font-medium mb-6 leading-relaxed">Upload your monthly profit reports or performance documents here.</p>
                        <button 
                          onClick={() => document.getElementById('profit-upload')?.click()}
                          className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg"
                        >
                          Upload Document
                        </button>
                        <input id="profit-upload" type="file" className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HS Code' && (
          <div className="space-y-8">
            {/* HS Code Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'TOTAL HS RECORDS', value: hsCodeRecords.length.toLocaleString(), icon: FileCode, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                { label: 'CURRENT RESULTS', value: hsCodeResults.length.toLocaleString(), icon: Search, color: 'purple', bg: 'bg-purple-50/50', iconBg: 'bg-purple-500' },
                { label: 'VALID CODES', value: hsCodeResults.filter(r => r.isValid).length.toLocaleString(), icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-500' },
                { label: 'INVALID CODES', value: hsCodeResults.filter(r => !r.isValid).length.toLocaleString(), icon: XCircle, color: 'red', bg: 'bg-red-50/50', iconBg: 'bg-red-500' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border border-gray-100 p-6 rounded-[32px] flex flex-col items-center text-center transition-all hover:shadow-lg group`}>
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black text-gray-800 tracking-tight`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">HS Code Verification</h2>
                  <p className="text-gray-400 font-medium mt-1">Upload Excel/CSV files to verify harmonized system codes</p>
                </div>
                <div className="flex items-center space-x-3">
                  {hsCodeResults.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setHsCodeResults([])}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Clear</span>
                      </button>
                      <button 
                        onClick={exportHSCodeResults}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                      >
                        <Download size={18} />
                        <span>Export Results</span>
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => document.getElementById('hs-code-upload')?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center space-x-2"
                  >
                    <Upload size={18} />
                    <span>Upload Excel/CSV</span>
                  </button>
                  <input 
                    id="hs-code-upload"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleHSCodeFileUpload}
                  />
                </div>
              </div>

              {hsCodeResults.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Verification Results ({hsCodeResults.length})</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Valid (10+ Digits)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Invalid (&lt; 10 Digits)</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left bg-gray-50/50">
                          <th className="py-4 pl-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Number</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Company</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Harmonized Code</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="py-4 pr-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Service Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {hsCodeResults.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/30 transition-all">
                            <td className="py-4 pl-6">
                              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{row.tracking}</span>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-800">{row.shipper}</p>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className={`text-sm font-mono font-bold ${row.isValid ? 'text-gray-700' : 'text-red-500'}`}>
                                  {row.hs}
                                </span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${row.isValid ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {row.isValid ? 'Valid' : 'Invalid'}
                              </span>
                            </td>
                            <td className="py-4 pr-6 text-right">
                              <span className="text-xs font-bold text-gray-500">{row.service}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hsCodeResults.length === 0 && (
                <div className="mt-10 py-20 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-300 mb-6">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">No Data Uploaded</h3>
                  <p className="text-gray-400 font-medium mt-2 max-w-xs">Upload an Excel or CSV file to start the verification process</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'NTN Missing' && (
          <div className="space-y-8">
            {/* NTN Missing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'TOTAL MISSING DB', value: ntnMissingRecords.length.toLocaleString(), icon: AlertCircle, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                { label: 'CURRENT RESULTS', value: ntnMissingResults.length.toLocaleString(), icon: Search, color: 'orange', bg: 'bg-orange-50/50', iconBg: 'bg-orange-500' },
                { label: 'HIGH VALUE SHIPMENTS', value: ntnMissingResults.filter(r => parseFloat(r.customsValue) > 5000).length.toLocaleString(), icon: Zap, color: 'amber', bg: 'bg-amber-50/50', iconBg: 'bg-amber-500' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border border-gray-100 p-6 rounded-[32px] flex flex-col items-center text-center transition-all hover:shadow-lg group`}>
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black text-gray-800 tracking-tight`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">NTN Missing Verification</h2>
                  <p className="text-gray-400 font-medium mt-1">Filter shipments by company name patterns and customs value</p>
                </div>
                <div className="flex items-center space-x-3">
                  {ntnMissingResults.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setNtnMissingResults([])}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Clear</span>
                      </button>
                      <button 
                        onClick={exportNtnMissingResults}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                      >
                        <Download size={18} />
                        <span>Export Results</span>
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => document.getElementById('ntn-missing-upload')?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center space-x-2"
                  >
                    <Upload size={18} />
                    <span>Upload Excel/CSV</span>
                  </button>
                  <input 
                    id="ntn-missing-upload"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleNtnMissingFileUpload}
                  />
                </div>
              </div>

              {ntnMissingResults.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Verification Results ({ntnMissingResults.length})</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Filtered Records</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left bg-gray-50/50">
                          <th className="py-4 pl-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Number</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Company</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Name</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customs Value</th>
                          <th className="py-4 pr-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Service Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ntnMissingResults.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/30 transition-all">
                            <td className="py-4 pl-6">
                              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{row.tracking}</span>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-800">{row.shipper}</p>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-700">{row.name}</p>
                            </td>
                            <td className="py-4">
                              <span className="text-xs font-bold text-gray-900">${row.value}</span>
                            </td>
                            <td className="py-4 pr-6 text-right">
                              <span className="text-xs font-bold text-gray-500">{row.service}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ntnMissingResults.length === 0 && (
                <div className="mt-10 bg-gray-50 rounded-[32px] p-12 text-center border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
                    <FileWarning size={32} />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 mb-1">No NTN Missing Data</h3>
                  <p className="text-gray-400 text-sm font-medium">Upload a file to start filtering NTN missing shipments.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'NTN Auto Update' && (
          <div className="space-y-8">
            {/* NTN Auto Update Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'TOTAL NTN RECORDS', value: ntnRecords.length.toLocaleString(), icon: FileText, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                { label: 'CURRENT RESULTS', value: ntnAutoUpdateResults.length.toLocaleString(), icon: Search, color: 'purple', bg: 'bg-purple-50/50', iconBg: 'bg-purple-500' },
                { label: 'MATCHED (FILLED)', value: ntnAutoUpdateResults.filter(r => r.status === 'Filled').length.toLocaleString(), icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-500' },
                { label: 'NOT FOUND', value: ntnAutoUpdateResults.filter(r => r.status === 'Not Found').length.toLocaleString(), icon: XCircle, color: 'red', bg: 'bg-red-50/50', iconBg: 'bg-red-500' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border border-gray-100 p-6 rounded-[32px] flex flex-col items-center text-center transition-all hover:shadow-lg group`}>
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black text-gray-800 tracking-tight`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">NTN Auto Update</h2>
                  <p className="text-gray-400 font-medium mt-1">Automatically match and update company NTN/CNIC numbers</p>
                </div>
                <div className="flex items-center space-x-3">
                  {ntnAutoUpdateResults.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setNtnAutoUpdateResults([])}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Clear</span>
                      </button>
                      <button 
                        onClick={exportNtnAutoUpdateResults}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                      >
                        <Download size={18} />
                        <span>Export Results</span>
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => document.getElementById('ntn-auto-upload')?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center space-x-2"
                  >
                    <Upload size={18} />
                    <span>Upload Excel/CSV</span>
                  </button>
                  <input 
                    id="ntn-auto-upload"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleNtnAutoUpdateFileUpload}
                  />
                </div>
              </div>

              {ntnAutoUpdateResults.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Update Results ({ntnAutoUpdateResults.length})</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Filled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Not Found</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left bg-gray-50/50">
                          <th className="py-4 pl-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Number</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Company</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Name</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="py-4 pr-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Service Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ntnAutoUpdateResults.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/30 transition-all">
                            <td className="py-4 pl-6">
                              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{row.tracking}</span>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-800">{row.shipper}</p>
                              {row.status === 'Filled' && (
                                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Matched from Database</p>
                              )}
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-700">{row.name}</p>
                            </td>
                            <td className="py-4">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${row.status === 'Filled' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-4 pr-6 text-right">
                              <span className="text-xs font-bold text-gray-500">{row.service}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ntnAutoUpdateResults.length === 0 && (
                <div className="mt-10 py-20 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-300 mb-6">
                    <RefreshCw size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">No Data Uploaded</h3>
                  <p className="text-gray-400 font-medium mt-2 max-w-xs">Upload an Excel or CSV file to automatically update NTN/CNIC numbers</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Bucket Shop' && (
          <div className="space-y-8">
            {/* Bucket Shop Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'TOTAL BUCKET DB', value: bucketShopRecords.length.toLocaleString(), icon: Store, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                { label: 'CURRENT RESULTS', value: bucketShopResults.length.toLocaleString(), icon: Search, color: 'teal', bg: 'bg-teal-50/50', iconBg: 'bg-teal-500' },
                { label: 'SIALKOT MATCHES', value: bucketShopResults.length.toLocaleString(), icon: Truck, color: 'indigo', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-500' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border border-gray-100 p-6 rounded-[32px] flex flex-col items-center text-center transition-all hover:shadow-lg group`}>
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black text-gray-800 tracking-tight`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">Bucket Shop Tool</h2>
                  <p className="text-gray-400 font-medium mt-1">Filter and process shipments for Sialkot region</p>
                </div>
                <div className="flex items-center space-x-3">
                  {bucketShopResults.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setBucketShopResults([])}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Clear</span>
                      </button>
                      <button 
                        onClick={exportBucketShopResults}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                      >
                        <Download size={18} />
                        <span>Export Results</span>
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => document.getElementById('bucket-shop-upload')?.click()}
                    className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center space-x-2"
                  >
                    <Upload size={18} />
                    <span>Upload Excel/CSV</span>
                  </button>
                  <input 
                    id="bucket-shop-upload"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleBucketShopFileUpload}
                  />
                </div>
              </div>

              {bucketShopResults.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Bucket Shop Results ({bucketShopResults.length})</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-teal-500" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sialkot Region Filtered</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left bg-gray-50/50">
                          <th className="py-4 pl-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Number</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Company</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Name</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Type</th>
                          <th className="py-4 pr-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Shipper City</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bucketShopResults.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/30 transition-all">
                            <td className="py-4 pl-6">
                              <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{row.tracking}</span>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-800">{row.shipper}</p>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-700">{row.name}</p>
                            </td>
                            <td className="py-4">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg text-teal-600 bg-teal-50">
                                {row.service}
                              </span>
                            </td>
                            <td className="py-4 pr-6 text-right">
                              <span className="text-xs font-bold text-gray-500">{row.city}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bucketShopResults.length === 0 && (
                <div className="mt-10 py-20 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-300 mb-6">
                    <ShoppingBag size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">No Data Uploaded</h3>
                  <p className="text-gray-400 font-medium mt-2 max-w-xs">Upload an Excel or CSV file to start filtering Bucket Shop records</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Different Lines' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">Different Lines Tool</h2>
                  <p className="text-gray-400 font-medium mt-1">Extract NTN/CNIC from address lines and update company names</p>
                </div>
                <div className="flex items-center space-x-3">
                  {differentLinesResults.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setDifferentLinesResults([])}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Clear</span>
                      </button>
                      <button 
                        onClick={exportDifferentLinesResults}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                      >
                        <Download size={18} />
                        <span>Export Results</span>
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => document.getElementById('different-lines-upload')?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center space-x-2"
                  >
                    <Upload size={18} />
                    <span>Upload Excel/CSV</span>
                  </button>
                  <input 
                    id="different-lines-upload"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleDifferentLinesFileUpload}
                  />
                </div>
              </div>

              {differentLinesResults.length > 0 && (
                <div className="mt-10">
                  {/* Different Lines Stats - Moved inside results area for better visibility */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                      { label: 'TOTAL RESULTS', value: differentLinesResults.length.toLocaleString(), icon: Search, color: 'purple', bg: 'bg-purple-50/50', iconBg: 'bg-purple-500' },
                      { label: 'EXTRACTED NTN', value: differentLinesResults.filter(r => r.status === 'Filled').length.toLocaleString(), icon: CheckCircle2, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                      { label: 'NO NTN FOUND', value: differentLinesResults.filter(r => r.status === 'Not Found').length.toLocaleString(), icon: XCircle, color: 'gray', bg: 'bg-gray-50/50', iconBg: 'bg-gray-400' },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} border border-gray-100 p-6 rounded-[32px] flex flex-col items-center text-center transition-all hover:shadow-lg group`}>
                        <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-4 group-hover:scale-110 transition-transform`}>
                          <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black text-gray-800 tracking-tight`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Processing Results ({differentLinesResults.length})</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">NTN Extracted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Not Found</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left bg-gray-50/50">
                          <th className="py-4 pl-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking Number</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Company (Updated)</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipper Name</th>
                          <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Address Lines</th>
                          <th className="py-4 pr-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {differentLinesResults.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/30 transition-all">
                            <td className="py-4 pl-6">
                              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{row.tracking}</span>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-800">{row.company}</p>
                            </td>
                            <td className="py-4">
                              <p className="text-sm font-bold text-gray-700">{row.name}</p>
                            </td>
                            <td className="py-4">
                              <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                <p className="text-[10px] text-gray-400 font-medium">{row.addrAddl}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{row.addr1}</p>
                              </div>
                            </td>
                            <td className="py-4 pr-6 text-right">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${row.status === 'Filled' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-50'}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {differentLinesResults.length === 0 && (
                <div className="mt-10 py-20 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-300 mb-6">
                    <Layers size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">No Data Uploaded</h3>
                  <p className="text-gray-400 font-medium mt-2 max-w-xs">Upload an Excel or CSV file to start processing Different Lines records</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {!['Dashboard', 'NTN Search', 'Profile', 'HS Code', 'NTN Missing', 'NTN Auto Update', 'Bucket Shop', 'Different Lines'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-[32px] flex items-center justify-center text-gray-300 mb-6">
                  <Database size={48} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{activeTab}</h2>
                <p className="text-gray-400 font-medium mt-2">This module is currently under development</p>
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Edit Modal */}
          <AnimatePresence>
            {isEditModalOpen && editingRecord && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
                >
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 tracking-tight">Edit Company Details</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ref ID: #{editingRecord.ref || editingRecord.tracking}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-600 shadow-sm"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={saveEdit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Ref Number</label>
                        <input 
                          ref={firstInputRef}
                          type="text" 
                          value={editingRecord.ref || editingRecord.tracking || ''}
                          onChange={(e) => setEditingRecord({ ...editingRecord, ref: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Company Name</label>
                        <input 
                          type="text" 
                          value={editingRecord.name || editingRecord.shipper || editingRecord.company || ''}
                          onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">NTN Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={editingRecord.ntn || ''}
                            onChange={(e) => setEditingRecord({ ...editingRecord, ntn: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm pr-12"
                          />
                          <button 
                            type="button"
                            onClick={() => handleCopy(editingRecord.ntn || '', 'edit-modal-ntn')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-blue-600 transition-all shadow-sm border border-transparent hover:border-gray-100"
                            title="Copy NTN"
                          >
                            {copiedId === 'edit-modal-ntn' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">CNIC / Ref</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={editingRecord.cnic || ''}
                            onChange={(e) => setEditingRecord({ ...editingRecord, cnic: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm pr-12"
                          />
                          <button 
                            type="button"
                            onClick={() => handleCopy(editingRecord.cnic || '', 'edit-modal-cnic')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-blue-600 transition-all shadow-sm border border-transparent hover:border-gray-100"
                            title="Copy CNIC"
                          >
                            {copiedId === 'edit-modal-cnic' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status</label>
                      <select 
                        value={editingRecord.status}
                        onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value, color: e.target.value === 'Active' ? 'emerald' : 'red' })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Filled">Filled</option>
                        <option value="Not Found">Not Found</option>
                      </select>
                    </div>

                    <div className="pt-4 flex items-center space-x-4">
                      <button 
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all border border-gray-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-3.5 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
          {/* Add New Record Modal */}
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
                >
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 tracking-tight">Add New {activeTab === 'HS Code' ? 'HS Code' : 'Record'}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enter details for {activeTab}</p>
                    </div>
                    <button 
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-600 shadow-sm"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAddRecord} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                          {activeTab === 'HS Code' ? 'Tracking Number' : 'Ref Number'}
                        </label>
                        <input 
                          type="text" 
                          placeholder={activeTab === 'HS Code' ? 'e.g. TRK-123' : 'e.g. 8601'}
                          value={newRecord.ref}
                          onChange={(e) => setNewRecord({ ...newRecord, ref: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                          {activeTab === 'HS Code' ? 'Shipper Company' : 'Company Name'}
                        </label>
                        <input 
                          type="text" 
                          placeholder="Enter name"
                          value={newRecord.name}
                          onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                          {activeTab === 'HS Code' ? 'HS Code' : 'NTN Number'}
                        </label>
                        <input 
                          type="text" 
                          placeholder={activeTab === 'HS Code' ? 'e.g. 8471.30' : 'e.g. 42301-1234567-1'}
                          value={newRecord.ntn}
                          onChange={(e) => setNewRecord({ ...newRecord, ntn: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                          {activeTab === 'HS Code' ? 'CE Code' : 'CNIC Number'}
                        </label>
                        <input 
                          type="text" 
                          placeholder={activeTab === 'HS Code' ? 'e.g. CE-123' : 'e.g. 35202-9876543-1'}
                          value={newRecord.cnic}
                          onChange={(e) => setNewRecord({ ...newRecord, cnic: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center space-x-4">
                      <button 
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all border border-gray-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-3.5 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Add Record
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Success Toast */}
          <AnimatePresence>
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-8 right-8 z-[110] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3"
              >
                <CheckCircle2 size={20} />
                <span className="font-bold text-sm">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Details Modal */}
          <AnimatePresence>
            {isViewModalOpen && viewingRecord && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                        <Database size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{viewingRecord.name}</h3>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Company Profile Details</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsViewModalOpen(false)}
                      className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white/80 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="p-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference Number</p>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                              <Hash size={18} />
                            </div>
                            <p className="text-lg font-mono font-bold text-gray-800 tracking-tight">#{viewingRecord.ref}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NTN Number</p>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                              <FileText size={18} />
                            </div>
                            <p className="text-lg font-mono font-bold text-gray-800 tracking-tight">{viewingRecord.ntn}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNIC / Registration</p>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                              <User size={18} />
                            </div>
                            <p className="text-lg font-mono font-bold text-gray-800 tracking-tight">{viewingRecord.cnic}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Status</p>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-${viewingRecord.color}-50 rounded-xl flex items-center justify-center text-${viewingRecord.color}-600`}>
                              <ShieldCheck size={18} />
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black bg-${viewingRecord.color}-50 text-${viewingRecord.color}-600 border border-${viewingRecord.color}-100 uppercase tracking-widest`}>
                              {viewingRecord.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                            <Info size={16} />
                          </div>
                          <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">System Information</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Database ID</p>
                            <p className="text-[10px] font-mono text-gray-500 truncate">{viewingRecord.id}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Verified</p>
                            <p className="text-[10px] font-bold text-gray-500">
                              {viewingRecord.createdAt ? new Date(viewingRecord.createdAt.seconds * 1000).toLocaleString() : 'Recently Added'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex items-center space-x-4">
                      <button 
                        onClick={() => {
                          setIsViewModalOpen(false);
                          handleEdit(viewingRecord);
                        }}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-2"
                      >
                        <Edit2 size={18} />
                        <span>Modify Record</span>
                      </button>
                      <button 
                        onClick={() => setIsViewModalOpen(false)}
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all border border-gray-100"
                      >
                        Close Profile
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {isDeleteModalOpen && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
                >
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                      <Trash2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">Confirm Deletion</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      Are you sure you want to delete this record? This action is permanent and cannot be undone.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 flex items-center space-x-4">
                    <button 
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setRecordToDelete(null);
                      }}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDeleteRecord}
                      className="flex-1 py-3.5 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                    >
                      Delete Now
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* NTN Records List Modal */}
          <AnimatePresence>
            {isNtnRecordsModalOpen && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] w-full max-w-5xl h-[80vh] shadow-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between bg-white sticky top-0 z-10 gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 tracking-tight">Companies List</h3>
                      <p className="text-gray-500 text-sm font-medium">Manage all stored company records ({ntnRecords.length})</p>
                    </div>
                    
                    <div className="flex-1 max-w-md flex items-center space-x-2">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <Search size={18} />
                        </div>
                        <input 
                          type="text"
                          placeholder="Search company by name..."
                          value={ntnRecordsSearchQuery}
                          onChange={(e) => setNtnRecordsSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                        />
                        {ntnRecordsSearchQuery && (
                          <button 
                            onClick={() => setNtnRecordsSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                        className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 border ${
                          showDuplicatesOnly 
                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Show records with duplicate NTN or CNIC"
                      >
                        <Layers size={18} />
                        <span className="hidden sm:inline">Duplicates</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => {
                          if (selectedNtnRecords.length === 0 || isDeletingBulk) {
                            setError('Please select at least one record to delete.');
                            setTimeout(() => setError(''), 3000);
                            return;
                          }
                          if (window.confirm(`Are you sure you want to delete ${selectedNtnRecords.length} records?`)) {
                            confirmDeleteSelectedNtnRecords();
                          }
                        }}
                        disabled={isDeletingBulk}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                          selectedNtnRecords.length > 0 && !isDeletingBulk
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isDeletingBulk ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                        <span>{isDeletingBulk ? 'Deleting...' : `Delete Selected ${selectedNtnRecords.length > 0 ? `(${selectedNtnRecords.length})` : ''}`}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsNtnRecordsModalOpen(false);
                          setSelectedNtnRecords([]);
                          setNtnRecordsSearchQuery('');
                          setShowDuplicatesOnly(false);
                        }}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    {(() => {
                      const filtered = ntnRecords.filter(r => {
                        const matchesSearch = (r.name || '').toLowerCase().includes(ntnRecordsSearchQuery.toLowerCase()) ||
                          (r.ntn || '').toLowerCase().includes(ntnRecordsSearchQuery.toLowerCase()) ||
                          (r.cnic || '').toLowerCase().includes(ntnRecordsSearchQuery.toLowerCase());
                        
                        if (!showDuplicatesOnly) return matchesSearch;

                        const hasDuplicateNtn = r.ntn && ntnRecords.some(other => other.id !== r.id && other.ntn === r.ntn);
                        const hasDuplicateCnic = r.cnic && ntnRecords.some(other => other.id !== r.id && other.cnic === r.cnic);
                        
                        return matchesSearch && (hasDuplicateNtn || hasDuplicateCnic);
                      });

                      // Map with duplicate info for sorting and highlighting
                      const recordsWithDupInfo = filtered.map(r => {
                        const hasDuplicateNtn = r.ntn && ntnRecords.some(other => other.id !== r.id && other.ntn === r.ntn);
                        const hasDuplicateCnic = r.cnic && ntnRecords.some(other => other.id !== r.id && other.cnic === r.cnic);
                        
                        return {
                          ...r,
                          isDuplicate: hasDuplicateNtn || hasDuplicateCnic,
                          duplicateKey: hasDuplicateNtn ? `ntn-${r.ntn}` : (hasDuplicateCnic ? `cnic-${r.cnic}` : null)
                        };
                      });

                      // Sort by duplicate key if showing duplicates
                      if (showDuplicatesOnly) {
                        recordsWithDupInfo.sort((a, b) => {
                          if (a.duplicateKey && b.duplicateKey) {
                            return a.duplicateKey.localeCompare(b.duplicateKey);
                          }
                          return 0;
                        });
                      }

                      return (
                        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/50">
                                <th className="p-4 border-b border-gray-100">
                                  <input 
                                    type="checkbox"
                                    checked={filtered.length > 0 && filtered.every(r => selectedNtnRecords.includes(r.id))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const newSelected = [...new Set([...selectedNtnRecords, ...filtered.map(r => r.id)])];
                                        setSelectedNtnRecords(newSelected);
                                      } else {
                                        const filteredIds = filtered.map(r => r.id);
                                        setSelectedNtnRecords(selectedNtnRecords.filter(id => !filteredIds.includes(id)));
                                      }
                                    }}
                                    className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </th>
                                <th className="p-4 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">Company Name</th>
                                <th className="p-4 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">NTN</th>
                                <th className="p-4 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">CNIC</th>
                                <th className="p-4 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {recordsWithDupInfo.length > 0 ? recordsWithDupInfo.map((record, idx) => {
                                // Determine if this is a new duplicate group for visual separation
                                const isNewGroup = showDuplicatesOnly && idx > 0 && record.duplicateKey !== recordsWithDupInfo[idx - 1].duplicateKey;
                                
                                return (
                                  <tr 
                                    key={record.id} 
                                    className={`hover:bg-gray-50/50 transition-colors group ${
                                      isNewGroup ? 'border-t-2 border-amber-200' : ''
                                    } ${
                                      record.isDuplicate ? 'bg-amber-50/40' : ''
                                    }`}
                                  >
                                    <td className="p-4">
                                      <input 
                                        type="checkbox"
                                        checked={selectedNtnRecords.includes(record.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedNtnRecords([...selectedNtnRecords, record.id]);
                                          } else {
                                            setSelectedNtnRecords(selectedNtnRecords.filter(id => id !== record.id));
                                          }
                                        }}
                                        className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="p-4">
                                      <div className="flex flex-col">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-bold text-gray-800">{record.name}</span>
                                          {record.isDuplicate && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded tracking-tighter">Duplicate</span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold">Ref: #{record.ref}</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`text-sm font-mono font-bold ${
                                        record.duplicateKey?.startsWith('ntn-') ? 'text-amber-600 bg-amber-100/50 px-1 rounded' : 'text-blue-600'
                                      }`}>
                                        {record.ntn || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <span className={`text-sm font-mono font-bold ${
                                        record.duplicateKey?.startsWith('cnic-') ? 'text-amber-600 bg-amber-100/50 px-1 rounded' : 'text-gray-500'
                                      }`}>
                                        {record.cnic || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        record.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                      }`}>
                                        {record.status}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => handleViewDetails(record)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="View"
                                        >
                                          <Eye size={16} />
                                        </button>
                                        <button 
                                          onClick={() => handleEdit(record)}
                                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                          title="Edit"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteRecord(getCollectionName('NTN Search'), record.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }) : (
                                <tr>
                                  <td colSpan={6} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                      <Search size={48} className="mb-4 opacity-20" />
                                      <p className="text-sm font-bold">No companies found matching your criteria</p>
                                      <button 
                                        onClick={() => {
                                          setNtnRecordsSearchQuery('');
                                          setShowDuplicatesOnly(false);
                                        }}
                                        className="mt-2 text-blue-600 hover:underline text-xs font-bold"
                                      >
                                        Clear all filters
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div key="splash" exit={{ opacity: 0 }} className="fixed inset-0 z-[9999]">
            <SplashScreen />
          </motion.div>
        ) : (
          <motion.div 
            key="login" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9998]"
          >
            <LoginPage 
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
              handleGoogleLogin={handleGoogleLogin}
              handleForgotPassword={handleForgotPassword}
              isLogin={isLogin}
              setIsLogin={setIsLogin}
              loading={loading}
              error={error}
              successMessage={successMessage}
              isResetMode={isResetMode}
              setIsResetMode={setIsResetMode}
              resetCode={resetCode}
              setResetCode={setResetCode}
              resetNewPassword={resetNewPassword}
              setResetNewPassword={setResetNewPassword}
              handleConfirmResetPassword={handleConfirmResetPassword}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a192f] p-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl">
        <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white" size={48} />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Pending Approval</h2>
        <p className="text-blue-100/60 mb-8 leading-relaxed">
          Your account has been created successfully. Please wait for the administrator to approve your access.
        </p>
        <button 
          onClick={handleLogout}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition-all border border-white/10"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

