import React, { useState, useEffect, Component, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  User, Lock, Eye, EyeOff, ChevronRight, Package, LogOut, LayoutDashboard, 
  Truck, Settings, AlertCircle, CheckCircle2, Search, FileCode, RefreshCw, 
  Store, Layers, Bell, ChevronDown, FileText, BarChart3, AlertTriangle,
  PieChart, Database, Hash, FileWarning, Zap, ShoppingBag, GitBranch, UserCircle, Sliders,
  Copy, Check, Edit2, Trash2, XCircle, Plus, X, ShieldCheck, Info, Upload, Download,
  Shield, Key, Save
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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(mockUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showScreenLock, setShowScreenLock] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('fedex_ntn_login_history', JSON.stringify(loginHistory));
  }, [loginHistory]);

  useEffect(() => {
    localStorage.setItem('lastLogin', lastLogin);
  }, [lastLogin]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
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

  const handleSaveProfile = () => {
    setProfile({ ...editProfileData });
    setIsEditingProfile(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  const [ntnRecords, setNtnRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem('ntnRecords');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', ref: '8601', name: 'ABC Pvt Ltd', ntn: '42301-1234567-1', cnic: '35202-9876543-1', status: 'Active', color: 'emerald' },
      { id: '2', ref: '8495', name: 'XYZ Traders', ntn: '42301-7654321-2', cnic: '35202-1234567-2', status: 'Active', color: 'emerald' },
      { id: '3', ref: '8205', name: 'PQR Industries', ntn: '42301-1122334-3', cnic: '35202-4455667-3', status: 'Expired', color: 'red' },
      { id: '4', ref: '9001', name: 'Well Products', ntn: '1234567-9', cnic: '34603-212060-6', status: 'Active', color: 'emerald' },
      { id: '5', ref: '9002', name: 'MH International', ntn: '1234567-8', cnic: '34603-3032743-3', status: 'Active', color: 'emerald' },
      { id: '6', ref: '9003', name: 'Imran NTN', ntn: '1234567-9', cnic: '34603-3032743-3', status: 'Active', color: 'emerald' },
    ];
  });
  const [hsCodeRecords, setHsCodeRecords] = useState<any[]>([]);
  const [ntnMissingRecords, setNtnMissingRecords] = useState<any[]>([]);
  const [ntnAutoUpdateRecords, setNtnAutoUpdateRecords] = useState<any[]>([]);
  const [bucketShopRecords, setBucketShopRecords] = useState<any[]>([]);
  const [differentLinesRecords, setDifferentLinesRecords] = useState<any[]>([]);

  const [hsCodeResults, setHsCodeResults] = useState<any[]>([]);
  const [recentHSCodeActivity, setRecentHSCodeActivity] = useState<any[]>([]);
  const [ntnMissingResults, setNtnMissingResults] = useState<any[]>([]);
  const [recentNtnMissingActivity, setRecentNtnMissingActivity] = useState<any[]>([]);
  const [ntnAutoUpdateResults, setNtnAutoUpdateResults] = useState<any[]>([]);
  const [recentNtnAutoUpdateActivity, setRecentNtnAutoUpdateActivity] = useState<any[]>([]);
  const [bucketShopResults, setBucketShopResults] = useState<any[]>([]);
  const [recentBucketShopActivity, setRecentBucketShopActivity] = useState<any[]>([]);
  const [differentLinesResults, setDifferentLinesResults] = useState<any[]>([]);
  const [recentDifferentLinesActivity, setRecentDifferentLinesActivity] = useState<any[]>([]);

  // Persist records to localStorage
  useEffect(() => {
    localStorage.setItem('ntnRecords', JSON.stringify(ntnRecords));
  }, [ntnRecords]);

  useEffect(() => {
    localStorage.setItem('hsCodeRecords', JSON.stringify(hsCodeRecords));
  }, [hsCodeRecords]);

  useEffect(() => {
    localStorage.setItem('ntnMissingRecords', JSON.stringify(ntnMissingRecords));
  }, [ntnMissingRecords]);

  useEffect(() => {
    localStorage.setItem('ntnAutoUpdateRecords', JSON.stringify(ntnAutoUpdateRecords));
  }, [ntnAutoUpdateRecords]);

  useEffect(() => {
    localStorage.setItem('bucketShopRecords', JSON.stringify(bucketShopRecords));
  }, [bucketShopRecords]);

  useEffect(() => {
    localStorage.setItem('differentLinesRecords', JSON.stringify(differentLinesRecords));
  }, [differentLinesRecords]);

  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [lockPin, setLockPin] = useState('1234');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Security settings state
  const [loginUsername, setLoginUsername] = useState('admin@example.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

    const processData = (data: any[]) => {
      const newRecords = data.map((row, index) => ({
        id: (ntnRecords.length + index + 1).toString(),
        ref: (row['REFF'] || row['ref'] || row['Ref'] || '').toString().trim(),
        name: (row['COMPANY NAMES'] || row['name'] || row['Name'] || '').toString().trim(),
        cnic: (row['CNIC'] || row['cnic'] || '').toString().trim(),
        ntn: (row['NTN'] || row['ntn'] || '').toString().trim(),
        status: 'Active',
        color: 'emerald'
      })).filter(r => r.name !== '');

      setNtnRecords(prev => [...newRecords, ...prev]);
      setSuccessMessage(`Uploaded ${newRecords.length} NTN records to database!`);
      setTimeout(() => setSuccessMessage(''), 3000);
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

  const handleExpire = (id: string) => {
    setNtnRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'Expired', color: 'red' } : r));
    setSuccessMessage('NTN record expired successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (record: any) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, data, ...updateData } = editingRecord;
    
    if (editingRecord.type === 'HS') {
      setHsCodeRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...updateData } : r));
    } else {
      setNtnRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...updateData } : r));
    }
    
    setIsEditModalOpen(false);
    setSuccessMessage('Record updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    
    const id = Math.random().toString(36).substr(2, 9);
    
    if (activeTab === 'HS Code') {
      const newEntry = {
        id,
        tracking: newRecord.ref,
        shipper: newRecord.name,
        hs: newRecord.ntn,
        ceCode: newRecord.cnic,
        service: 'Air Freight',
        color: 'blue',
      };
      setHsCodeRecords(prev => [newEntry, ...prev]);
    } else if (activeTab === 'NTN Missing') {
      const newEntry = {
        id,
        tracking: newRecord.ref,
        company: newRecord.name,
        name: 'Pending',
        service: 'Express',
        color: 'orange',
      };
      setNtnMissingRecords(prev => [newEntry, ...prev]);
    } else if (activeTab === 'Auto Update') {
      const newEntry = {
        id,
        tracking: newRecord.ref,
        name: newRecord.name,
        ntn: newRecord.ntn,
        status: 'Pending',
        color: 'blue',
      };
      setNtnAutoUpdateRecords(prev => [newEntry, ...prev]);
    } else if (activeTab === 'Bucket Shop') {
      const newEntry = {
        id,
        tracking: newRecord.ref,
        company: newRecord.name,
        name: 'Pending',
        service: 'Express',
        color: 'teal',
      };
      setBucketShopRecords(prev => [newEntry, ...prev]);
    } else if (activeTab === 'Different Lines') {
      const newEntry = {
        id,
        tracking: newRecord.ref,
        company: newRecord.name,
        name: 'Pending',
        addr: 'Pending',
        service: 'Express',
        color: 'blue',
      };
      setDifferentLinesRecords(prev => [newEntry, ...prev]);
    } else {
      const newEntry = {
        id,
        ...newRecord,
      };
      setNtnRecords(prev => [newEntry, ...prev]);
    }

    setIsAddModalOpen(false);
    setNewRecord({
      ref: '',
      name: '',
      ntn: '',
      cnic: '',
      status: 'Active',
      color: 'emerald'
    });
    setSuccessMessage(`New record added to ${activeTab} successfully`);
    setTimeout(() => setSuccessMessage(''), 3000);
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Use state-based credentials
    if (email === loginUsername && password === loginPassword) {
      const now = new Date();
      const loginTime = now.toLocaleString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      setLastLogin(loginTime);
      setLoginHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        time: loginTime,
        ip: '192.168.1.1',
        device: 'Chrome / Windows 11'
      }, ...prev].slice(0, 10)); // Keep last 10 logins

      setUser(mockUser);
      setSuccessMessage('Login successful!');
    } else {
      setError(`Invalid credentials. Default: ${loginUsername} / ${loginPassword}`);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setSuccessMessage('Password reset email sent! Please check your inbox.');
  };

  const handleLogout = () => {
    setUser(null);
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

  if (user) {
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
        <aside className="w-64 bg-[#1e293b] text-white flex flex-col shadow-xl z-20">
          <div className="p-6 flex items-center space-x-3 border-b border-white/5">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1">
              <img 
                src="https://www.vectorlogo.zone/logos/fedex/fedex-ar21.svg" 
                alt="FedEx Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-lg tracking-tight">NTN Management</span>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {[
              { icon: LayoutDashboard, label: 'Dashboard' },
              { icon: Search, label: 'NTN Search' },
              { icon: FileText, label: 'HS Code' },
              { icon: AlertCircle, label: 'NTN Missing' },
              { icon: RefreshCw, label: 'NTN Auto Update' },
              { icon: ShoppingBag, label: 'Bucket Shop' },
              { icon: Layers, label: 'Different Lines' },
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                    activeTab === item.label 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className={activeTab === item.label ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.label === 'NTN Search' && <span className="ml-auto text-[10px] opacity-50">®</span>}
                  {item.hasSubmenu && (
                    <ChevronRight size={14} className={`ml-auto transition-transform ${showScreenLock ? 'rotate-90' : ''}`} />
                  )}
                  {item.hasArrow && (
                    <ChevronDown size={14} className={`ml-auto transition-transform ${showLogoutDropdown ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {item.label === 'Security' && showScreenLock && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-10 space-y-1 overflow-hidden"
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
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <Key size={14} />
                      <span>Change Password</span>
                    </button>
                  </motion.div>
                )}

                {item.label === 'Logout' && showLogoutDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-10 space-y-1 overflow-hidden"
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
            <div className="flex items-center space-x-3 px-4 py-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <UserCircle size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-white">{profile.name}</p>
                <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest font-black">Administrator</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between z-10">
            <h1 className="text-xl font-bold text-gray-800">NTN Management System</h1>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Bell size={18} />
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 pl-6 border-l border-gray-200 hover:bg-gray-50/50 p-2 rounded-2xl transition-all group"
                >
                  <div className="text-right">
                    <p className="text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic tracking-tight">
                      {profile.name}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Administrator</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <img 
                      src={profile.photoURL} 
                      alt="User" 
                      className="w-full h-full rounded-full bg-white border border-white/50"
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
            {activeTab === 'Dashboard' && (
              <>
                {/* Search Bar */}
                <div className="mb-8 flex items-center space-x-4 relative">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by Ref, Tracking, Company or Name"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveSuggestionIndex(prev => 
                        prev < suggestions.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveSuggestionIndex(prev => 
                        prev > 0 ? prev - 1 : -1
                      );
                    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
                      e.preventDefault();
                      const s = suggestions[activeSuggestionIndex];
                      setSearchQuery(s.title);
                      setShowSuggestions(false);
                      if (s.type === 'NTN') handleEdit(s.data);
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                    >
                      {suggestions.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setSearchQuery(s.title);
                            setShowSuggestions(false);
                            if (s.type === 'NTN') handleEdit(s.data);
                          }}
                          onMouseEnter={() => setActiveSuggestionIndex(i)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                            activeSuggestionIndex === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              s.type === 'NTN' ? 'bg-blue-50 text-blue-500' : 
                              s.type === 'HS' ? 'bg-purple-50 text-purple-500' : 'bg-gray-50 text-gray-500'
                            }`}>
                              {s.type === 'NTN' ? <Database size={16} /> : <Hash size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{s.title}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{s.subtitle}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                <span>Search</span>
                <Search size={18} />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[
                { label: 'NTN Total Records', value: ntnRecords.length.toLocaleString(), icon: FileText, color: 'blue', bg: 'bg-blue-50/50', border: 'border-blue-200/50', iconBg: 'bg-blue-500', shadow: 'shadow-blue-900/5' },
                { label: 'HS Code Verification', value: hsCodeRecords.length.toLocaleString(), icon: BarChart3, color: 'purple', bg: 'bg-purple-50/50', border: 'border-purple-200/50', iconBg: 'bg-purple-500', shadow: 'shadow-purple-900/5' },
                { label: 'NTN Missing', value: ntnMissingRecords.length.toLocaleString(), icon: AlertTriangle, color: 'orange', bg: 'bg-orange-50/50', border: 'border-orange-200/50', iconBg: 'bg-orange-500', shadow: 'shadow-orange-900/5' },
                { label: 'Bucket Shops', value: bucketShopRecords.length.toLocaleString(), icon: Store, color: 'teal', bg: 'bg-teal-50/50', border: 'border-teal-200/50', iconBg: 'bg-teal-500', shadow: 'shadow-teal-900/5' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} backdrop-blur-xl border ${stat.border} p-6 rounded-[24px] text-gray-800 ${stat.shadow} relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-2xl`}>
                  <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.iconBg} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                  <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <h3 className="text-3xl font-bold tracking-tight text-gray-800">{stat.value}</h3>
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
                      filteredNtnRecords.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">#{row.ref}</span>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.name}</p>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[11px] text-gray-500 font-mono font-medium">{row.ntn}</span>
                              <button 
                                onClick={() => handleCopy(row.ntn)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedText === row.ntn ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[11px] text-gray-500 font-mono font-medium">{row.cnic}</span>
                              <button 
                                onClick={() => handleCopy(row.cnic)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedText === row.cnic ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
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
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Service Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentHSCodeActivity.length > 0 ? (
                      recentHSCodeActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
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
                          <td className="py-3 text-right pr-4">
                            <span className="text-[10px] font-bold text-gray-500">
                              {row.service}
                            </span>
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
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Service Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentNtnMissingActivity.length > 0 ? (
                      recentNtnMissingActivity.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.shipper}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-medium text-gray-600">{row.name}</p>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <span className="text-[10px] font-bold text-gray-500">
                              {row.service}
                            </span>
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
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredNtnAutoUpdateRecords.length > 0 ? (
                      filteredNtnAutoUpdateRecords.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedText === row.tracking ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
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
                                onClick={() => handleCopy(row.ntn)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedText === row.ntn ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end space-x-1.5">
                              <div className={`w-1 h-1 rounded-full bg-${row.color}-500`} />
                              <span className={`text-[10px] font-bold text-${row.color}-600`}>{row.status}</span>
                            </div>
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
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Service Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBucketShopRecords.length > 0 ? (
                      filteredBucketShopRecords.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedText === row.tracking ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-bold text-gray-800">{row.company}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-xs font-medium text-gray-600">{row.name}</p>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold bg-${row.color}-50 text-${row.color}-600 border border-${row.color}-100`}>
                              {row.service}
                            </span>
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
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Shpr Addl Addr</th>
                      <th className="pb-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Shipper Address Line 1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredDifferentLinesRecords.length > 0 ? (
                      filteredDifferentLinesRecords.map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                          <td className="py-3 pl-4">
                            <div className="flex items-center space-x-2 group/copy">
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg">{row.tracking}</span>
                              <button 
                                onClick={() => handleCopy(row.tracking)}
                                className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/copy:opacity-100"
                              >
                                {copiedText === row.tracking ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
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
                            <p className="text-[10px] text-gray-500 max-w-[150px] truncate" title={row.addr}>{row.addr}</p>
                          </td>
                          <td className="py-3 text-right pr-4">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold bg-${row.color}-50 text-${row.color}-600 border border-${row.color}-100`}>
                              {row.service}
                            </span>
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
                            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                  <Database size={24} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-gray-800 tracking-tight">{record.name}</h4>
                                  <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">Ref: #{record.ref}</span>
                                    <span className={`text-[10px] font-black text-${record.color}-600 bg-${record.color}-50 px-2 py-0.5 rounded-lg uppercase tracking-wider`}>{record.status}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="p-3 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"
                                  title="Edit Record"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleViewDetails(record)}
                                  className="p-3 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"
                                  title="View Details"
                                >
                                  <FileText size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">NTN Number</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-mono font-bold text-gray-800">{record.ntn}</p>
                                  <button onClick={() => handleCopy(record.ntn)} className="text-blue-400 hover:text-blue-600 transition-colors">
                                    {copiedText === record.ntn ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">CNIC / Registration</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-mono font-bold text-gray-800">{record.cnic}</p>
                                  <button onClick={() => handleCopy(record.cnic)} className="text-blue-400 hover:text-blue-600 transition-colors">
                                    {copiedText === record.cnic ? <Check size={14} /> : <Copy size={14} />}
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
                          loginHistory.map((login: any) => (
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

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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
                            type="password" 
                            placeholder="New Password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <button 
                            onClick={() => {
                              if (newUsername) setLoginUsername(newUsername);
                              if (newPassword) setLoginPassword(newPassword);
                              setSuccessMessage('Login credentials updated!');
                              setNewUsername('');
                              setNewPassword('');
                              setTimeout(() => setSuccessMessage(''), 3000);
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                          >
                            Update Login
                          </button>
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

                    <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden group">
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
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">HS Code Verification</h2>
                  <p className="text-gray-400 font-medium mt-1">Upload Excel/CSV files to verify harmonized system codes</p>
                </div>
                <div className="flex items-center space-x-3">
                  {hsCodeResults.length > 0 && (
                    <button 
                      onClick={exportHSCodeResults}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Download size={18} />
                      <span>Export Results</span>
                    </button>
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
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">NTN Missing Verification</h2>
                  <p className="text-gray-400 font-medium mt-1">Filter shipments by company name patterns and customs value</p>
                </div>
                <div className="flex items-center space-x-3">
                  {ntnMissingResults.length > 0 && (
                    <button 
                      onClick={exportNtnMissingResults}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Download size={18} />
                      <span>Export Results</span>
                    </button>
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
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">NTN Auto Update</h2>
                  <p className="text-gray-400 font-medium mt-1">Automatically match and update company NTN/CNIC numbers</p>
                </div>
                <div className="flex items-center space-x-3">
                  {ntnAutoUpdateResults.length > 0 && (
                    <button 
                      onClick={exportNtnAutoUpdateResults}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Download size={18} />
                      <span>Export Results</span>
                    </button>
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
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">Bucket Shop Tool</h2>
                  <p className="text-gray-400 font-medium mt-1">Filter and process shipments for Sialkot region</p>
                </div>
                <div className="flex items-center space-x-3">
                  {bucketShopResults.length > 0 && (
                    <button 
                      onClick={exportBucketShopResults}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Download size={18} />
                      <span>Export Results</span>
                    </button>
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
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">Different Lines Tool</h2>
                  <p className="text-gray-400 font-medium mt-1">Extract NTN/CNIC from address lines and update company names</p>
                </div>
                <div className="flex items-center space-x-3">
                  {differentLinesResults.length > 0 && (
                    <button 
                      onClick={exportDifferentLinesResults}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Download size={18} />
                      <span>Export Results</span>
                    </button>
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    <div className="lg:col-span-2">
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

                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Zap size={20} />
                          </div>
                          <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Live Results</h3>
                        </div>
                        <div className="space-y-4">
                          {recentDifferentLinesActivity.map((item, i) => (
                            <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                              <div className={`w-2 h-2 rounded-full ${item.status === 'Filled' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-800 truncate uppercase tracking-widest">{item.company}</p>
                                <p className="text-[9px] text-gray-400 font-bold truncate">{item.tracking}</p>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${item.status === 'Filled' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-50'}`}>
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
                            onClick={() => handleCopy(editingRecord.ntn || '')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-blue-600 transition-all shadow-sm border border-transparent hover:border-gray-100"
                            title="Copy NTN"
                          >
                            {copiedText === editingRecord.ntn ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
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
                            onClick={() => handleCopy(editingRecord.cnic || '')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-blue-600 transition-all shadow-sm border border-transparent hover:border-gray-100"
                            title="Copy CNIC"
                          >
                            {copiedText === editingRecord.cnic ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
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
                          required
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
                          required
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
                          required
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
                          required
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a192f] relative overflow-hidden font-sans">
      {/* Atmospheric Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[460px] px-6"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl shadow-black/50">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-32 h-14 bg-white rounded-xl flex items-center justify-center mb-4 overflow-hidden border border-white/20 shadow-xl shadow-black/40 p-3 relative">
              <img 
                src="https://www.vectorlogo.zone/logos/fedex/fedex-ar21.svg" 
                alt="FedEx Logo" 
                className="w-full h-full object-contain relative z-10"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 hidden items-center justify-center bg-white z-0">
                <span className="text-xl font-black italic tracking-tighter">
                  <span className="text-[#4D148C]">Fed</span>
                  <span className="text-[#FF6600]">Ex</span>
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NTN Management</h1>
            <p className="text-blue-400/80 text-xs font-medium uppercase tracking-[0.2em] mt-1">Shipment Toolkit</p>
          </div>

          {/* Login Form */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Authentication Mode</p>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">New Account</p>
              <p className="text-xs text-white font-medium italic">Create an account to access the dashboard</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center space-x-3 text-red-400 text-xs">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center space-x-3 text-emerald-400 text-xs">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} /> }
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 border border-white/20 rounded bg-white/5 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
                  <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Forgot?
              </button>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2 group transition-all active:scale-[0.98]"
            >
              <span>{isLogin ? 'Login to Dashboard' : 'Create Account'}</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center space-y-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              © 2025 NTN Management System
            </p>
            <p className="text-[9px] text-blue-400/50 font-medium uppercase tracking-wider">
              Created by imran Ahmed
            </p>
          </div>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-10 flex items-center space-x-3 text-white/20">
        <Package size={20} />
        <span className="text-[10px] font-mono tracking-tighter uppercase">Shipment Toolkit v1.0</span>
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

