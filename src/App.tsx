import React, { useState, useEffect, Component, ReactNode, useRef } from 'react';
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
import { 
  User, Lock, Eye, EyeOff, ChevronRight, Package, LogOut, LayoutDashboard, 
  Truck, Settings, AlertCircle, CheckCircle2, Search, FileCode, RefreshCw, 
  Store, Layers, Bell, ChevronDown, FileText, BarChart3, AlertTriangle,
  PieChart, Database, Hash, FileWarning, Zap, ShoppingBag, GitBranch, UserCircle, Sliders,
  Copy, Check, Edit2, Trash2, XCircle, Plus, X, ShieldCheck, Info, Upload, Download,
  Shield, Key, Save, Mail
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

// --- Main App Component ---
function AppContent() {
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [emailjsServiceId, setEmailjsServiceId] = useState('');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState('');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState('');

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
  const [showScreenLock, setShowScreenLock] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
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
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [logoStyle, setLogoStyle] = useState(0);
  const [headerColorStyle, setHeaderColorStyle] = useState(0);

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

  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [lockPin, setLockPin] = useState('1234');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Security settings state
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
      const shipper = row['Shipper Company'] || row['shipper'] || '';
      const hsCodeRaw = row['Commodity Harmonized Code'] || row['hs'] || '';
      
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
    const ntnPattern = /\d{7}-\d/;
    const cnicPattern = /\d{5}-\d{7}-\d/;
    const invalidSuffixes = [/-eform$/i, /-a$/i, /-e form$/i, /-E FORM$/i];

    const filteredData = data.filter(row => {
      const desc = row['CE Commodity Description'] || row['Description'] || '';
      const company = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const customsValueRaw = row['Customs Value'] || row['value'] || 0;
      const customsValue = parseFloat(customsValueRaw.toString().replace(/[^0-9.]/g, '')) || 0;

      // 1. Description must not be blank
      if (desc.toString().trim() === '') return false;

      // 2. Customs Value must be < 500
      if (customsValue >= 500) return false;

      // 3. Company must not contain NTN or CNIC
      if (ntnPattern.test(company) || cnicPattern.test(company)) return false;

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
      
      if (match) {
        const ntnOrCnic = match.ntn || match.cnic || '';
        updatedShipper = `${shipperCompany} ${ntnOrCnic}`;
        status = 'Filled';
        color = 'emerald';
      }
      
      return {
        id: index.toString(),
        tracking,
        shipper: updatedShipper,
        ntn: match ? (match.ntn || match.cnic || '') : '',
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
    // Robust pattern for NTN: NTN:1234567, 1234567-8, 1234567890123, A1234567, etc.
    const ntnPattern = /(NTN\s*[:#.]?\s*[A-Z]?\d+[-\d]*)|(\d{5}-\d{7}-\d)|(\d{6,8}-\d)|(\d{7,13})|([A-Z]\d{6,8})|([A-Z]-\d{6,8})/i;
    const cnicPattern = /\d{5}-\d{7}-\d/;
    const invalidSuffixes = [/-eform$/i, /-eform$/i, /-a$/i, /-c$/i, /-e form$/i, /-E FORM$/i];
    const sialkotKeywords = ['SIALKOT', 'SIALKOT/PNS', 'PARISROADSILAKOT', 'SKT', 'SKTA'];
    const invalidRefs = ['9999', '9099'];

    const filteredData = data.filter(row => {
      const desc = (row['CE Commodity Description'] || row['Description'] || '').toString().trim();
      const company = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const name = (row['Shipper Name'] || row['name'] || '').toString().trim();
      const customsValueRaw = row['Customs Value'] || row['value'] || 0;
      const customsValue = parseFloat(customsValueRaw.toString().replace(/[^0-9.]/g, '')) || 0;
      const city = (row['Shpr City'] || row['city'] || '').toString().trim().toUpperCase();
      const ref = (row['Shipper Ref'] || row['ref'] || '').toString().trim();

      // 1. Description must not be blank
      if (desc === '') return false;

      // 2. Customs Value must be < 500
      if (customsValue >= 500) return false;

      // 3. Company or Name must not contain NTN or CNIC or 7+ digits or alphanumeric NTN
      if (ntnPattern.test(company) || cnicPattern.test(company) || ntnPattern.test(name) || cnicPattern.test(name)) return false;

      // 4. Company must not end with specific suffixes
      const hasInvalidSuffix = invalidSuffixes.some(regex => regex.test(company));
      if (hasInvalidSuffix) return false;

      // 5. Shpr City must be Sialkot related
      const isSialkot = sialkotKeywords.some(k => city.includes(k));
      if (!isSialkot) return false;

      // 6. Shipper Ref must not be 9999 or 9099
      if (invalidRefs.includes(ref)) return false;

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
    // Enhanced NTN pattern to include alphanumeric NTNs like A123457, B123456, D123457 and handle optional hyphens
    const ntnRegex = /(NTN\s*[:#.]?\s*[A-Z]?\d+[-\d]*)|(\d{5}-\d{7}-\d)|(\d{6,8}-\d)|(\d{7,13})|([A-Z]\d{6,8}(-\d)?)|([A-Z]-\d{6,8}(-\d)?)/i;

    const filteredData = data.filter(row => {
      const desc = row['CE Commodity Description'] || row['Description'] || '';
      return desc.toString().trim() !== '';
    });

    const results = filteredData.map((row, index) => {
      let company = (row['Shipper Company'] || row['shipper'] || '').toString().trim();
      const name = (row['Shipper Name'] || row['name'] || '').toString().trim();
      const addr1 = (row['Shipper Address line 1'] || row['address1'] || '').toString().trim();
      const addrAddl = (row['Shpr Addl Addr'] || row['address2'] || '').toString().trim();

      // Find NTN in any of the fields
      let foundNtn = null;
      [company, name, addr1, addrAddl].forEach(text => {
        if (!foundNtn) {
          const match = text.match(ntnRegex);
          if (match) {
            // Clean up extra words like (MID:...)
            foundNtn = match[0].split('(')[0].trim();
          }
        }
      });

      let finalCompany = company;

      // If company is blank, use name
      if (!finalCompany) {
        finalCompany = name;
      }

      // If company name IS the NTN (or very short and contains NTN), use name + company
      const isCompanyNtnOnly = company.match(ntnRegex) && company.length < 25;

      if (isCompanyNtnOnly) {
        // If company is just NTN, put name before it
        if (!finalCompany.toLowerCase().includes(name.toLowerCase())) {
          finalCompany = name + " " + company;
        }
      } else if (foundNtn && !finalCompany.toLowerCase().includes(foundNtn.toLowerCase())) {
        // If we found an NTN elsewhere (like in address) and it's not in the company name, append it
        finalCompany = finalCompany + " " + foundNtn;
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
      setSuccessMessage('Logged out successfully');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('Failed to log out.');
    }
  };

  const handleUnlock = () => {
    // Default PIN is 1234 if not set
    const correctPin = lockPin || '1234';
    if (enteredPin === correctPin) {
      setIsScreenLocked(false);
      setEnteredPin('');
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
      setTimeout(() => setPinError(false), 2000);
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
      <div className="min-h-screen w-full bg-[#f0f2f5] text-gray-800 font-sans flex overflow-hidden relative">
        {/* Screen Lock Overlay */}
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

        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarHovered ? 260 : 80 }}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => {
            setIsSidebarHovered(false);
            setShowScreenLock(false);
            setShowLogoutDropdown(false);
          }}
          className="bg-[#1e293b] text-white flex flex-col shadow-2xl z-20 relative overflow-hidden transition-all duration-300 ease-in-out"
        >
          <div 
            onClick={() => setLogoStyle((prev) => (prev + 1) % 6)}
            className={`p-6 flex items-center ${isSidebarHovered ? 'space-x-3' : 'justify-center'} border-b border-white/5 h-20 cursor-pointer group hover:bg-white/5 transition-colors`}
            title="Click to change logo style"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1 shrink-0 group-hover:scale-110 transition-transform">
              <img 
                src="https://www.vectorlogo.zone/logos/fedex/fedex-ar21.svg" 
                alt="FedEx Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {isSidebarHovered && (
              <motion.div 
                key={logoStyle}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col select-none"
              >
                {logoStyle === 0 && (
                  <>
                    <span className="font-black text-[14px] uppercase tracking-tighter text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">NTN SYSTEM</span>
                    <span className="text-white opacity-40 text-[8px] font-bold uppercase tracking-[0.2em] -mt-1">MANAGEMENT PRO</span>
                  </>
                )}
                {logoStyle === 1 && (
                  <>
                    <span className="font-black text-[14px] uppercase tracking-tight text-white">NTN<span className="text-blue-500">.</span>SYSTEM</span>
                    <div className="h-[1px] w-full bg-blue-500/30 mt-0.5"></div>
                    <span className="text-gray-500 text-[7px] font-black uppercase tracking-widest mt-0.5">FEDEX AUTHORIZED</span>
                  </>
                )}
                {logoStyle === 2 && (
                  <>
                    <span className="font-black text-[14px] uppercase tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">NTN SYSTEM</span>
                    <span className="text-white/30 text-[8px] font-medium italic -mt-0.5">Digital Logistics</span>
                  </>
                )}
                {logoStyle === 3 && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-lg flex flex-col items-center">
                    <span className="font-black text-[11px] uppercase tracking-[0.1em] text-white">NTN SYSTEM</span>
                    <span className="text-[6px] font-bold text-blue-400 uppercase tracking-widest">SECURE PORTAL</span>
                  </div>
                )}
                {logoStyle === 4 && (
                  <>
                    <span className="font-mono text-[12px] font-bold tracking-[0.2em] text-blue-400">NTN_SYS</span>
                    <span className="font-mono text-[8px] text-white/40 tracking-tighter -mt-1">v2.5.0-STABLE</span>
                  </>
                )}
                {logoStyle === 5 && (
                  <div className="border-l-2 border-blue-500 pl-2">
                    <span className="font-black text-[15px] uppercase leading-none text-white block">NTN</span>
                    <span className="font-bold text-[10px] uppercase leading-none text-blue-500 block tracking-widest">SYSTEM</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <nav className="flex-1 py-8 px-3 space-y-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {[
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
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <button 
                  onClick={() => {
                    if (item.label === 'Logout') {
                      if (item.hasArrow) {
                        setShowLogoutDropdown(!showLogoutDropdown);
                      } else {
                        handleLogout();
                      }
                    } else if (item.label === 'Security') {
                      setShowScreenLock(!showScreenLock);
                    } else {
                      setActiveTab(item.label);
                    }
                  }}
                  className={`w-full flex items-center ${isSidebarHovered ? 'px-4' : 'justify-center'} py-3 rounded-2xl transition-all group relative ${
                    activeTab === item.label 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={!isSidebarHovered ? item.label : ''}
                >
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeTab === item.label 
                      ? 'bg-blue-600 shadow-lg shadow-blue-600/40 scale-110' 
                      : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <item.icon size={22} className={activeTab === item.label ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                  </div>
                  
                  {isSidebarHovered && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-4 font-bold text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {isSidebarHovered && item.label === 'NTN Search' && <span className="ml-auto text-[10px] opacity-50">®</span>}
                  
                  {isSidebarHovered && item.hasSubmenu && (
                    <ChevronRight size={14} className={`ml-auto transition-transform ${showScreenLock ? 'rotate-90' : ''}`} />
                  )}
                  
                  {isSidebarHovered && item.hasArrow && (
                    <ChevronDown size={14} className={`ml-auto transition-transform ${showLogoutDropdown ? 'rotate-180' : ''}`} />
                  )}

                  {!isSidebarHovered && activeTab === item.label && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}
                </button>

                {isSidebarHovered && item.label === 'Security' && showScreenLock && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-12 space-y-1 overflow-hidden"
                  >
                    <button 
                      onClick={() => setIsScreenLocked(true)}
                      className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all"
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
                      className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all"
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
                      className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-all font-bold"
                    >
                      <LogOut size={14} />
                      <span>Confirm Logout</span>
                    </button>
                    <button 
                      onClick={() => setShowLogoutDropdown(false)}
                      className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  </motion.div>
                )}
              </div>
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between z-10">
            <div className="flex flex-1 items-center space-x-4">
              <div 
                onClick={() => setHeaderColorStyle((prev) => (prev + 1) % 6)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                  headerColorStyle === 0 ? 'bg-blue-50 text-blue-600' :
                  headerColorStyle === 1 ? 'bg-emerald-50 text-emerald-600' :
                  headerColorStyle === 2 ? 'bg-indigo-50 text-indigo-600' :
                  headerColorStyle === 3 ? 'bg-rose-50 text-rose-600' :
                  headerColorStyle === 4 ? 'bg-amber-50 text-amber-600' :
                  'bg-purple-50 text-purple-600'
                }`}
                title="Click to change header color"
              >
                <LayoutDashboard size={24} />
              </div>
              <h1 
                onClick={() => setHeaderColorStyle((prev) => (prev + 1) % 6)}
                className="text-xl font-black text-gray-800 shrink-0 tracking-tight cursor-pointer select-none"
              >
                NTN <span className={
                  headerColorStyle === 0 ? 'text-blue-600' :
                  headerColorStyle === 1 ? 'text-emerald-600' :
                  headerColorStyle === 2 ? 'text-indigo-600' :
                  headerColorStyle === 3 ? 'text-rose-600' :
                  headerColorStyle === 4 ? 'text-amber-600' :
                  'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
                }>SYSTEM</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-6 ml-8">
              <div className="relative">
                <div 
                  onClick={() => setShowNotifications(!showNotifications)}
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
                          {allUsers.filter(u => u.status === 'pending').length} New Requests
                        </span>
                      </div>

                      <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
                        {user?.email === ADMIN_EMAIL ? (
                          allUsers.filter(u => u.status === 'pending').length > 0 ? (
                            allUsers.filter(u => u.status === 'pending').map((u) => (
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
                                        setSuccessMessage(`Approved ${u.displayName}`);
                                        setTimeout(() => setSuccessMessage(''), 2000);
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
                                        setSuccessMessage(`Rejected ${u.displayName}`);
                                        setTimeout(() => setSuccessMessage(''), 2000);
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
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
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
          </header>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
                  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="flex-1 relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search NTN, CNIC or Company Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 transition-all text-lg font-bold text-gray-800 placeholder:text-gray-300"
                      />
                    </div>
                    <button 
                      onClick={() => searchQuery.length > 0 ? null : setActiveTab('NTN Search')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                      SEARCH
                    </button>
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
                          <Search size={48} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-lg font-bold text-gray-400">No records found for "{searchQuery}"</p>
                          <p className="text-xs text-gray-300 uppercase tracking-widest mt-1">Try searching with a different keyword</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-6 mb-10">
                  {[
                    { label: 'NTN TOTAL RECORDS', value: ntnRecords.length.toLocaleString(), icon: FileText, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                    { label: 'HS CODE RESULTS', value: hsCodeResults.length.toLocaleString(), icon: BarChart3, color: 'purple', bg: 'bg-purple-50/50', iconBg: 'bg-purple-500' },
                    { label: 'NTN MISSING RESULTS', value: ntnMissingResults.length.toLocaleString(), icon: AlertTriangle, color: 'orange', bg: 'bg-orange-50/50', iconBg: 'bg-orange-500' },
                    { label: 'BUCKET SHOP RESULTS', value: bucketShopResults.length.toLocaleString(), icon: Store, color: 'teal', bg: 'bg-teal-50/50', iconBg: 'bg-teal-500' },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} border border-gray-100 p-8 rounded-[32px] flex flex-col items-center text-center transition-all hover:shadow-xl hover:-translate-y-1 group`}>
                      <div className={`w-14 h-14 ${stat.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 mb-6 group-hover:scale-110 transition-transform`}>
                        <stat.icon size={28} />
                      </div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline space-x-1">
                          <h3 className="text-4xl font-black tracking-tight text-gray-800">{stat.value}</h3>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Results</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

            {/* Unified Data Table */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Recent NTN Records</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Real-time updates from management modules</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-all flex items-center space-x-1 shadow-lg shadow-blue-600/20"
                  >
                    <Plus size={12} />
                    <span>Add New Record</span>
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 hover:bg-gray-50 transition-all">
                    Export Excel
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all">
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-4">Ref ID</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Company Name</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">NTN Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">CNIC Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredNtnRecords.length > 0 ? (
                      filteredNtnRecords.slice(0, 5).map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">#{row.ref}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.name}</p>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[11px] text-gray-500 font-mono font-medium">{row.ntn}</span>
                              <button 
                                onClick={() => handleCopy(row.ntn, `recent-ntn-${row.id}`)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedId === `recent-ntn-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[11px] text-gray-500 font-mono font-medium">{row.cnic}</span>
                              <button 
                                onClick={() => handleCopy(row.cnic, `recent-cnic-${row.id}`)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedId === `recent-cnic-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-1.5">
                              <div className={`w-1 h-1 rounded-full bg-${row.color}-500`} />
                              <span className={`text-[10px] font-bold text-${row.color}-600`}>{row.status}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => handleEdit(row)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Record"
                              >
                                <Edit2 size={14} />
                              </button>
                              {row.status !== 'Expired' && (
                                <button 
                                  onClick={() => handleExpire(row.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Expire NTN"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteRecord('ntn_records', row.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p className="text-xs font-medium">No records found matching your search</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HS Code Verification Table */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Recent HS Code Verification</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Real-time harmonized system code tracking (Last 5 Uploads)</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveTab('HS Code')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-4">Tracking Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Company</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Service Type</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentHSCodeActivity.length > 0 ? (
                      recentHSCodeActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking, `hs-tracking-${i}`)}
                                className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                title="Copy Tracking Number"
                              >
                                {copiedId === `hs-tracking-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.shipper}</p>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${row.isValid ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {row.isValid ? 'Valid' : 'Invalid'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-[10px] font-bold text-gray-500">
                              {row.service}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <button 
                              onClick={() => handleDeleteRecord('hs_code_records', row.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p className="text-xs font-medium">No recent HS Code activity. Upload a file in the HS Code tab.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NTN Missing Table */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Recent NTN Missing</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Tracking records with missing tax identification</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveTab('NTN Missing')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-4">Tracking Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Company</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Name</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Service Type</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentNtnMissingActivity.length > 0 ? (
                      recentNtnMissingActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking, `missing-tracking-${i}`)}
                                className="opacity-0 group-hover/copy:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                title="Copy Tracking Number"
                              >
                                {copiedId === `missing-tracking-${i}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.shipper}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-medium text-gray-600">{row.name}</p>
                          </td>
                          <td className="py-3">
                            <span className="text-[10px] font-bold text-gray-500">
                              {row.service}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <button 
                              onClick={() => handleDeleteRecord('missing_records', row.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p className="text-xs font-medium">No recent NTN Missing activity. Upload a file in the NTN Missing tab.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NTN Auto Update Table */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Recent NTN Auto Update</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Automated tax identification updates</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveTab('NTN Auto Update')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-4">Tracking Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Name</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">NTN Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentNtnAutoUpdateActivity.length > 0 ? (
                      recentNtnAutoUpdateActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking, `auto-update-tracking-${row.id}`)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedId === `auto-update-tracking-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.name}</p>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[11px] text-gray-500 font-mono font-medium">{row.ntn}</span>
                              <button 
                                onClick={() => handleCopy(row.ntn, `auto-update-ntn-${row.id}`)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedId === `auto-update-ntn-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-start space-x-1.5">
                              <div className={`w-1 h-1 rounded-full bg-${row.color}-500`} />
                              <span className={`text-[10px] font-bold text-${row.color}-600`}>{row.status}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <button 
                              onClick={() => handleDeleteRecord('auto_update_records', row.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p className="text-xs font-medium">No records found matching your search</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bucket Shop Entries Table */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Recent Bucket Shop Entries</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Tracking records for bucket shop operations</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveTab('Bucket Shop')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-4">Tracking Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Company</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Name</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Service Type</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentBucketShopActivity.length > 0 ? (
                      recentBucketShopActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking, `bucket-tracking-${row.id}`)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedId === `bucket-tracking-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.shipper}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-medium text-gray-600">{row.name}</p>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-50 text-teal-600 border border-teal-100`}>
                              {row.service}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <button 
                              onClick={() => handleDeleteRecord('bucket_shop_records', row.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p className="text-xs font-medium">No recent Bucket Shop activity. Upload a file in the Bucket Shop tab.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Different Lines NTN Table */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Recent Different Lines NTN</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Tracking records with varied tax identification lines</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveTab('Different Lines')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-50">
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-4">Tracking Number</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Company</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shipper Name</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Address Details</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentDifferentLinesActivity.length > 0 ? (
                      recentDifferentLinesActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking, `diff-tracking-${row.id}`)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedId === `diff-tracking-${row.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.company}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-medium text-gray-600">{row.name}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-[10px] text-gray-500 max-w-[150px] truncate" title={`${row.addrAddl} ${row.addr1}`}>{row.addrAddl} {row.addr1}</p>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <button 
                              onClick={() => handleDeleteRecord('different_lines_records', row.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search size={24} className="mb-2 opacity-20" />
                            <p className="text-xs font-medium">No recent Different Lines activity. Upload a file in the Different Lines tab.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'NTN Search' && (
          <div className="space-y-8">
            {/* Search Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex-1 relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by NTN, CNIC, or Company Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-bold text-gray-800"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Search size={18} />
                  <span>Search</span>
                </button>
                <div className="relative group">
                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2 font-bold"
                  >
                    <Upload size={18} />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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
                  className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2 font-bold"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Export</span>
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
                          <Search size={32} />
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
            {/* Different Lines Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'TOTAL NTN RECORDS', value: ntnRecords.length.toLocaleString(), icon: FileText, color: 'blue', bg: 'bg-blue-50/50', iconBg: 'bg-blue-500' },
                { label: 'CURRENT RESULTS', value: differentLinesResults.length.toLocaleString(), icon: Search, color: 'purple', bg: 'bg-purple-50/50', iconBg: 'bg-purple-500' },
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Processing Results ({differentLinesResults.length})</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Filled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Not Found</span>
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-gray-100 font-sans overflow-hidden">
      {/* Left Side - Branding */}
      <div className="w-full md:w-[55%] bg-gradient-to-br from-[#0056b3] to-[#003d80] relative flex flex-col items-center justify-center p-12 text-white overflow-hidden">
        {/* Decorative Curves */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] border-[1px] border-white/10 rounded-full" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] border-[1px] border-white/5 rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center md:text-left max-w-md"
        >
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 mb-8 shadow-2xl rotate-3">
            <img 
              src="https://www.vectorlogo.zone/logos/fedex/fedex-ar21.svg" 
              alt="FedEx Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4">
            ɴᴛɴ ꜱᴇᴀʀᴄʜ &<br />
            ᴍᴀɴᴀɢᴇᴍᴇɴᴛ ᴛᴏᴏʟ
          </h1>
          <p className="text-blue-100/80 text-lg font-medium mb-8 leading-relaxed">
            The most advanced shipment and tax management toolkit for professional logistics.
          </p>
          <button 
            className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg transition-all shadow-lg shadow-black/20"
            onClick={() => window.open('https://www.fedex.com', '_blank')}
          >
            Read More
          </button>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-[45%] bg-white flex flex-col items-center justify-center p-8 md:p-16 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              {isLogin ? 'Hello Again!' : 'Create Account'}
            </h2>
            <p className="text-gray-500 font-medium">
              {isLogin ? 'Welcome Back' : 'Join the NTN Management System'}
            </p>
          </div>

          {!isResetMode ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 text-red-600 text-xs">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center space-x-3 text-emerald-600 text-xs">
                  <CheckCircle2 size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-4 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} /> }
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#007bff] hover:bg-[#0069d9] text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>

              <div className="flex flex-col space-y-4 text-center">
                <button 
                  type="button" 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  {isLogin ? "Don't have an account? Create one" : "Already have an account? Login"}
                </button>
                
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <div className="pt-4 flex items-center space-x-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3.5 rounded-full flex items-center justify-center space-x-3 transition-all shadow-sm"
              >
                <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" className="w-5 h-5" />
                <span className="text-sm">Sign in with Google</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmResetPassword} className="space-y-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs text-blue-600 font-medium leading-relaxed">
                  Enter the <strong>Code</strong> from your email and your <strong>New Password</strong>.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-xs">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <input 
                  type="text"
                  placeholder="Reset Code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full py-4 px-6 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <input 
                  type="password"
                  placeholder="New Password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full py-4 px-6 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-full shadow-lg transition-all"
              >
                Update Password
              </button>

              <button 
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] text-blue-400/80 font-bold uppercase tracking-[0.2em] whitespace-nowrap"
          >
            © 2025 NTN Management System • Created by Imran Ahmed
          </motion.p>
        </div>
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

