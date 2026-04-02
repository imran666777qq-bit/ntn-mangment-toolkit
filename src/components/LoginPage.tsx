import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ShieldCheck, Lock, LockOpen, Search, LogIn, UserPlus, Mail, Key, Chrome } from "lucide-react";

interface LoginPageProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  handleForgotPassword: () => void;
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  loading: boolean;
  error: string;
  successMessage: string;
  isResetMode: boolean;
  setIsResetMode: (isResetMode: boolean) => void;
  resetCode: string;
  setResetCode: (code: string) => void;
  resetNewPassword: string;
  setResetNewPassword: (password: string) => void;
  handleConfirmResetPassword: (e: React.FormEvent) => void;
}

const ThreeBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    console.log("ThreeBackground mounting, container size:", container.clientWidth, container.clientHeight);
    
    // Ensure container has dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x0a0212, 1); // Match brand-section color
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const orangeLight = new THREE.PointLight(0xFF6600, 100, 300);
    orangeLight.position.set(50, 50, 50);
    scene.add(orangeLight);

    const purpleLight = new THREE.PointLight(0x4D148C, 100, 300);
    purpleLight.position.set(-50, -50, 50);
    scene.add(purpleLight);

    const ribbons: THREE.Mesh[] = [];
    const geom = new THREE.PlaneGeometry(50, 4, 32);
    for (let i = 0; i < 25; i++) {
      const color = i % 2 === 0 ? 0x4D148C : 0xFF6600;
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 60);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      ribbons.push(mesh);
      scene.add(mesh);
    }

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      ribbons.forEach(r => {
        r.rotation.x += 0.003;
        r.rotation.y += 0.003;
      });
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log("ThreeBackground unmounting");
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geom.dispose();
      ribbons.forEach(r => {
        (r.material as THREE.Material).dispose();
      });
    };
  }, []);

  return <div id="three-canvas-container" ref={containerRef} style={{ pointerEvents: 'none' }} />;
};

export default function LoginPage({
  email, setEmail, password, setPassword, handleLogin, handleGoogleLogin,
  handleForgotPassword, isLogin, setIsLogin, loading, error, successMessage,
  isResetMode, setIsResetMode, resetCode, setResetCode, resetNewPassword,
  setResetNewPassword, handleConfirmResetPassword
}: LoginPageProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (successMessage) {
      setIsSuccess(true);
      const timer = setTimeout(() => setIsSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="h-screen w-full flex flex-col lg:flex-row bg-[#0a0212] overflow-hidden font-['Inter',sans-serif]"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --fedex-purple: #4D148C;
          --fedex-orange: #FF6600;
        }

        .brand-section {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        #three-canvas-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .logo-card {
            position: relative;
            z-index: 10;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(30px);
            padding: clamp(2rem, 5vh, 4.5rem);
            border-radius: 50px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            box-shadow: 0 50px 100px rgba(0,0,0,0.8);
            transform: scale(clamp(0.6, 0.9vw, 1));
        }

        .fedex-logo-animated {
            font-size: clamp(3.5rem, 8vh, 5.5rem);
            font-weight: 900;
            display: flex;
            justify-content: center;
            line-height: 1;
            margin-bottom: 0.5rem;
        }

        .letter {
            display: inline-block;
            opacity: 0;
            animation: fallRotateBounce 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .progress-bar-wrap {
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.05);
            margin: 2rem 0;
            position: relative;
            overflow: hidden;
            opacity: 0;
            animation: fadeIn 0.5s forwards 2.4s;
            border-radius: 10px;
        }
        
        .progress-bar-fill {
            position: absolute;
            left: 50%;
            top: 0;
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--fedex-purple), var(--fedex-orange));
            box-shadow: 0 0 20px var(--fedex-orange);
            transform: translateX(-50%);
            animation: expandFromCenter 1.5s cubic-bezier(0.7, 0, 0.3, 1) 2.6s forwards;
        }

        .toolkit-tagline {
            color: #FF9933;
            font-size: clamp(10px, 1.2vh, 13px);
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            opacity: 0;
            animation: fadeIn 1s forwards 3.5s;
            margin-top: 12px;
            display: block;
        }

        .ntn-text-side {
            display: flex;
            justify-content: center;
            gap: 12px;
            font-style: italic;
            font-weight: 900;
            font-size: clamp(1.5rem, 3vh, 2.4rem);
            margin-top: 1.5rem;
            opacity: 0;
            animation: fadeIn 0.8s forwards 1.8s;
        }

        @keyframes fallRotateBounce {
            0% { opacity: 0; transform: translateY(-400px) rotate(var(--rot)) scale(0.5); }
            100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
        }

        @keyframes expandFromCenter { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes pulse-gold {
            0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
            70% { transform: scale(1.3); opacity: 0.5; box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawN { to { stroke-dashoffset: 0; } }

        .n-path-main {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
            animation: drawN 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            stroke: white;
            stroke-width: 16;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .dot-indicator {
            width: 8px;
            height: 8px;
            background: #FFD700;
            border-radius: 50%;
            animation: pulse-gold 2s infinite;
        }

        .secure-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            transition: 0.6s;
            z-index: -1;
        }

        .secure-btn:hover::after {
            left: 100%;
            transition: 0.6s ease-in-out;
        }
      ` }} />

      {/* Left Visual Section */}
      <div className="flex-[1.4] brand-section min-h-[40vh] lg:min-h-screen">
        <ThreeBackground />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="logo-card"
        >
          <div className="fedex-logo-animated">
            <span className="letter text-white l-f" style={{ '--rot': '-45deg', animationDelay: '0.2s' } as any}>F</span>
            <span className="letter text-white l-e1" style={{ '--rot': '30deg', animationDelay: '0.4s' } as any}>e</span>
            <span className="letter text-white l-d" style={{ '--rot': '-20deg', animationDelay: '0.3s' } as any}>d</span>
            <span className="letter text-[#FF6600] l-e2" style={{ '--rot': '60deg', animationDelay: '0.6s' } as any}>E</span>
            <span className="letter text-[#FF6600] l-x" style={{ '--rot': '-50deg', animationDelay: '0.5s' } as any}>x</span>
          </div>
          
          <div className="ntn-text-side">
            <span className="text-[#FF6600]">NTN</span>
            <span className="text-white">MANAGEMENT</span>
          </div>
          
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill"></div>
          </div>
          
          <span className="toolkit-tagline">
            Premium Shipments Toolkit
          </span>
        </motion.div>
      </div>

      {/* Right Login Section */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-8 bg-white z-[5] min-h-[60vh] lg:min-h-screen"
      >
        <div className="w-full max-w-[380px] transform scale-[clamp(0.8,1vh,1)]">
          {/* Header Top */}
          <div className="flex flex-col items-center justify-center mb-[clamp(1rem,3vh,2rem)] gap-4">
            <div className="fedex-logo-badge scale-90">
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
            <span className="font-[800] text-[12px] text-[#FF6600] uppercase tracking-[4px] mt-0.5 inline-block">ADVANCE PORTAL</span>
          </div>

          {/* Login Heading */}
          <div className="flex items-center mb-[clamp(1rem,2vh,2rem)] relative">
            <div className="flex items-center gap-[10px]">
              <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center shadow-[0_4px_12px_rgba(255,102,0,0.25)] transition-all duration-400 ${isSuccess ? 'bg-[#22c55e] scale-110' : 'bg-[#FF6600]'}`}>
                {isSuccess ? <LockOpen size={20} className="text-white" /> : <Lock size={20} className="text-white" />}
              </div>
              <h1 className="text-[clamp(24px,4vh,32px)] font-[900] text-[#0a1629] tracking-[-1.5px] uppercase">
                <span className="text-[#FF6600]">{isResetMode ? 'R' : (isLogin ? 'L' : 'S')}</span>
                {isResetMode ? 'ESET' : (isLogin ? 'OGIN' : 'IGN UP')}
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-xl animate-shake">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm font-medium rounded-r-xl">
              {successMessage}
            </div>
          )}

          {!isResetMode ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="text-[11px] font-[800] color-[#4A5568] uppercase tracking-[1px] mb-1.5 block">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-[clamp(0.8rem,1.2vh,1.1rem)] bg-[#f8fafc] border-2 border-[#edf2f7] rounded-[16px] outline-none transition-all focus:border-[#4D148C] focus:bg-white" 
                    placeholder="admin@gmail.com" 
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-[800] color-[#4A5568] uppercase tracking-[1px] block">Password</label>
                  {isLogin && (
                    <span 
                      onClick={handleForgotPassword}
                      className="text-[11px] font-[800] text-[#4D148C] cursor-pointer hover:text-[#FF6600] transition-colors uppercase tracking-[1px]"
                    >
                      Forgot?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Key size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-[clamp(0.8rem,1.2vh,1.1rem)] bg-[#f8fafc] border-2 border-[#edf2f7] rounded-[16px] outline-none transition-all focus:border-[#4D148C] focus:bg-white" 
                    placeholder="••••••••" 
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="secure-btn w-full bg-[#4D148C] text-white p-[1.1rem] rounded-[15px] font-[800] uppercase tracking-[1.5px] mt-4 cursor-pointer shadow-[0_8px_15px_rgba(77,20,140,0.2)] transition-all duration-400 hover:bg-[#3e0e72] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(77,20,140,0.4)] relative overflow-hidden flex items-center justify-center gap-[10px] z-[1] disabled:opacity-70"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? <ShieldCheck size={20} /> : <UserPlus size={20} />)}
                {loading ? 'Processing...' : (isLogin ? 'Secure Access' : 'Create Account')}
              </button>

              <div className="flex items-center my-6">
                <div className="flex-1 h-[1px] bg-[#FF6600]/20"></div>
                <span className="mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth</span>
                <div className="flex-1 h-[1px] bg-[#4D148C]/20"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-[#edf2f7] p-[0.8rem] rounded-[18px] flex items-center justify-center gap-3 font-[900] text-[12px] text-[#1a202c] uppercase cursor-pointer transition-all duration-300 hover:bg-[#fdfdfd] hover:border-[#cbd5e1] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(0,0,0,0.05)] active:scale-95"
              >
                <Chrome size={18} className="text-[#4285F4]" />
                Google Account
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleConfirmResetPassword}>
              <div>
                <label className="text-[11px] font-[800] color-[#4A5568] uppercase tracking-[1px] mb-1.5 block">Reset Code</label>
                <input 
                  type="text" 
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-4 py-[clamp(0.8rem,1.2vh,1.1rem)] bg-[#f8fafc] border-2 border-[#edf2f7] rounded-[16px] outline-none transition-all focus:border-[#4D148C] focus:bg-white" 
                  placeholder="Enter code from email" 
                  required
                />
              </div>
              
              <div>
                <label className="text-[11px] font-[800] color-[#4A5568] uppercase tracking-[1px] mb-1.5 block">New Password</label>
                <input 
                  type="password" 
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-4 py-[clamp(0.8rem,1.2vh,1.1rem)] bg-[#f8fafc] border-2 border-[#edf2f7] rounded-[16px] outline-none transition-all focus:border-[#4D148C] focus:bg-white" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="secure-btn w-full bg-[#22c55e] text-white p-[1.1rem] rounded-[15px] font-[800] uppercase tracking-[1.5px] mt-4 cursor-pointer shadow-[0_8px_15px_rgba(34,197,94,0.2)] transition-all duration-400 hover:bg-[#16a34a] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(34,197,94,0.4)] relative overflow-hidden flex items-center justify-center gap-[10px] z-[1] disabled:opacity-70"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={20} />}
                {loading ? 'Processing...' : 'Update Password'}
              </button>

              <button 
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full mt-4 text-[11px] text-slate-500 hover:text-slate-800 font-[800] uppercase tracking-[1px] transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {!isResetMode && (
            <div className="text-center mt-[clamp(1.5rem,4vh,3.5rem)] text-sm text-[#64748b]">
              {isLogin ? "Don't have an account?" : "Already have an account?"} <span 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#4D148C] font-[800] cursor-pointer hover:text-[#FF6600] transition-colors"
              >
                {isLogin ? "Create one" : "Login"}
              </span>
            </div>
          )}

          {/* Footer Credit */}
          <div className="mt-[clamp(1.5rem,4vh,3.5rem)] text-center">
            <span className="text-[14px] font-[900] text-[#4D148C] mb-0.5 block">© 2026</span>
            <p className="text-[12px] font-[900] text-[#4D148C] uppercase">NTN Management System</p>
            <p className="text-[9px] font-[700] text-[#718096] uppercase">Created by <span className="text-[#FF6600] font-[900]">IMRAN AHMED</span></p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
