import { motion } from "motion/react";

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

export default function LoginPage({
  email, setEmail, password, setPassword, handleLogin, handleGoogleLogin,
  handleForgotPassword, isLogin, setIsLogin, loading, error, successMessage,
  isResetMode, setIsResetMode, resetCode, setResetCode, resetNewPassword,
  setResetNewPassword, handleConfirmResetPassword
}: LoginPageProps) {
  return (
    <div className="h-screen w-full flex bg-white overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif]">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        :root {
          --fedex-purple: #4D148C;
          --fedex-orange: #FF6600;
        }

        @keyframes gridMove {
          from { transform: rotateX(60deg) translateY(0); }
          to { transform: rotateX(60deg) translateY(60px); }
        }

        @keyframes moveBlob {
          0% { transform: translate(-15%, -15%) scale(1); }
          100% { transform: translate(15%, 15%) scale(1.2); }
        }

        @keyframes dropChar {
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes zoomInEffect {
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes expandLine { to { width: 100%; } }

        @keyframes slideUpEffect {
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes logoPop {
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes nPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px #fff); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 8px rgba(255,255,255,0.4)); }
        }

        @keyframes accentSlide {
          to { transform: translate(0, 0); }
        }

        @keyframes typePortal {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .grid-3d {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background-image: 
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: rotateX(60deg) translateZ(-100px);
          animation: gridMove 12s linear infinite;
          z-index: 2;
        }

        .blob {
          position: absolute;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(77, 20, 140, 0.7) 0%, rgba(0, 0, 0, 0) 70%);
          filter: blur(100px);
          z-index: 1;
          animation: moveBlob 20s infinite alternate;
        }

        .char {
          display: inline-block;
          transform: translateY(-150px);
          opacity: 0;
          animation: dropChar 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .char-1 { animation-delay: 0.1s; }
        .char-2 { animation-delay: 0.2s; }
        .char-3 { animation-delay: 0.3s; }
        .char-4 { animation-delay: 0.4s; }
        .char-5 { animation-delay: 0.5s; }

        .login-card {
          clip-path: polygon(8% 0, 100% 0, 100% 88%, 92% 100%, 0 100%, 0 12%);
        }
      ` }} />

      {/* Left Visual Section */}
      <div className="flex-[1.1] flex flex-col justify-center items-center relative bg-[#2e0b55] overflow-hidden perspective-[1000px]">
        <div className="blob"></div>
        <div className="grid-3d"></div>
        
        <div className="relative z-20 text-center text-white p-16 bg-white/5 backdrop-blur-[30px] rounded-[48px] border border-white/10 shadow-[0_50px_120px_rgba(0,0,0,0.5)] max-w-[80%] w-[580px]">
          <div className="flex justify-center text-[100px] -tracking-[8px] font-['Arial_Black',sans-serif] leading-[0.85]">
            <span className="char char-1 text-white">F</span>
            <span className="char char-2 text-white">e</span>
            <span className="char char-3 text-white">d</span>
            <span className="char char-4 text-[#FF6600]">E</span>
            <span className="char char-5 text-[#FF6600]">x</span>
          </div>
          <div 
            className="italic text-[42px] font-black mt-5 -tracking-[1px] text-white opacity-0 scale-[1.5]"
            style={{ animation: 'zoomInEffect 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.8s' }}
          >
            <span className="text-orange-500">NTN</span> MANAGEMENT
          </div>
          
          <div 
            className="h-[6px] w-0 my-6 rounded-full overflow-hidden flex"
            style={{ animation: 'expandLine 1.2s ease forwards 1s' }}
          >
            <div className="flex-1 bg-white/80"></div>
            <div className="flex-1 bg-[#FF6600]"></div>
          </div>
          
          <div 
            className="text-[18px] font-semibold text-[#FF6600] tracking-[5px] uppercase opacity-0 translate-y-[30px]"
            style={{ animation: 'slideUpEffect 0.8s ease-out forwards 1.2s' }}
          >
            & SHIPMENTS TOOLKIT
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="flex-[0.9] flex justify-center items-center bg-white relative p-10 overflow-y-auto">
        <div 
          className="login-card relative z-10 w-full max-w-[440px] bg-white p-12 pt-14 pb-10 text-[#1e293b] border border-[#f1f5f9] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.08)] opacity-0 translate-y-[30px]"
          style={{ animation: 'cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}
        >
          {/* Animated Logo Header */}
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="w-14 h-14 bg-gradient-to-br from-[#4D148C] to-[#6b21a8] rounded-[14px] flex items-center justify-center text-white shadow-[0_10px_20px_rgba(77,20,140,0.15)] relative overflow-hidden opacity-0 scale-50"
              style={{ animation: 'logoPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
            >
              <span 
                className="font-['Arial_Black',sans-serif] text-[32px] font-black leading-none text-white relative z-[2]"
                style={{ animation: 'nPulse 2.5s ease-in-out infinite' }}
              >
                N
              </span>
              <div 
                className="absolute bottom-0 right-0 w-[18px] h-[18px] bg-[#FF6600] rounded-tl-full translate-x-5 translate-y-5"
                style={{ animation: 'accentSlide 0.8s ease-out forwards 0.5s' }}
              ></div>
            </div>
            <div className="flex flex-col">
              <div 
                className="font-extrabold text-2xl leading-none text-[#0f172a] -tracking-[0.8px] opacity-0 translate-y-2"
                style={{ animation: 'slideUpEffect 0.5s ease-out forwards 0.4s' }}
              >
                NTN SYSTEM
              </div>
              <div 
                className="text-[12px] font-semibold text-[#FF6600] tracking-[2.5px] uppercase mt-1 whitespace-nowrap overflow-hidden w-0 border-r-2 border-transparent"
                style={{ animation: 'typePortal 1.2s steps(20) forwards 0.8s' }}
              >
                Digital Portal
              </div>
            </div>
          </div>
          
          <h1 
            className="text-[34px] font-extrabold text-[#0f172a] mb-8 uppercase -tracking-[1.2px] border-l-[6px] border-[#FF6600] pl-[18px] opacity-0 -translate-x-[15px]"
            style={{ animation: 'slideInLeft 0.5s ease-out forwards 0.6s' }}
          >
            {isResetMode ? 'RESET' : (isLogin ? 'LOGIN' : 'SIGN UP')}
          </h1>

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
              <div className="mb-5">
                <label className="text-[12px] font-bold uppercase text-slate-500 ml-1 mb-2 block tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-[18px_22px] rounded-[18px] text-[#0f172a] text-[15px] outline-none transition-all focus:border-[#4D148C] focus:bg-white focus:shadow-[0_0_0_5px_rgba(77,20,140,0.04)]" 
                  placeholder="name@example.com" 
                  required
                />
              </div>
              
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[12px] font-bold uppercase text-slate-500 block tracking-wider">Password</label>
                  {isLogin && (
                    <span 
                      onClick={handleForgotPassword}
                      className="text-[12px] font-bold text-purple-700 cursor-pointer hover:text-[#FF6600] transition-colors"
                    >
                      Forgot?
                    </span>
                  )}
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-[18px_22px] rounded-[18px] text-[#0f172a] text-[15px] outline-none transition-all focus:border-[#4D148C] focus:bg-white focus:shadow-[0_0_0_5px_rgba(77,20,140,0.04)]" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full p-5 bg-[#4D148C] text-white rounded-[18px] font-bold text-[16px] uppercase tracking-[1.8px] mt-6 shadow-[0_15px_30px_rgba(77,20,140,0.2)] transition-all hover:-translate-y-1 hover:bg-[#3c0f6e] hover:shadow-[0_20px_40px_rgba(77,20,140,0.25)] border-none cursor-pointer relative overflow-hidden disabled:opacity-70"
              >
                {loading ? 'Processing...' : (isLogin ? 'Secure Access' : 'Create Account')}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-500 font-bold tracking-widest">Or continue with</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full p-4 bg-white border-2 border-slate-100 text-slate-700 rounded-[18px] font-bold text-[14px] uppercase tracking-[1px] flex items-center justify-center gap-3 transition-all hover:bg-slate-50 hover:border-slate-200"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Account
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleConfirmResetPassword}>
              <div className="mb-5">
                <label className="text-[12px] font-bold uppercase text-slate-500 ml-1 mb-2 block tracking-wider">Reset Code</label>
                <input 
                  type="text" 
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-[18px_22px] rounded-[18px] text-[#0f172a] text-[15px] outline-none transition-all focus:border-[#4D148C] focus:bg-white focus:shadow-[0_0_0_5px_rgba(77,20,140,0.04)]" 
                  placeholder="Enter code from email" 
                  required
                />
              </div>
              
              <div className="mb-5">
                <label className="text-[12px] font-bold uppercase text-slate-500 ml-1 mb-2 block tracking-wider">New Password</label>
                <input 
                  type="password" 
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-[18px_22px] rounded-[18px] text-[#0f172a] text-[15px] outline-none transition-all focus:border-[#4D148C] focus:bg-white focus:shadow-[0_0_0_5px_rgba(77,20,140,0.04)]" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full p-5 bg-emerald-600 text-white rounded-[18px] font-bold text-[16px] uppercase tracking-[1.8px] mt-6 shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)] border-none cursor-pointer relative overflow-hidden disabled:opacity-70"
              >
                {loading ? 'Processing...' : 'Update Password'}
              </button>

              <button 
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {!isResetMode && (
            <div className="text-center mt-9 text-sm text-[#64748b]">
              {isLogin ? "Don't have an account?" : "Already have an account?"} <span 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#4D148C] font-bold cursor-pointer hover:text-[#FF6600] transition-colors"
              >
                {isLogin ? "Create one" : "Login"}
              </span>
            </div>
          )}

          {/* Footer Credit */}
          <div 
            className="mt-10 text-center border-t border-[#f1f5f9] pt-7 opacity-0"
            style={{ animation: 'fadeIn 0.8s ease forwards 1.2s' }}
          >
            <div className="text-[12px] color-[#94a3b8] font-semibold mb-1">© 2026</div>
            <div className="text-[15px] font-extrabold text-[#4D148C] tracking-[1.2px] uppercase">NTN MANAGEMENT SYSTEM</div>
            <div className="mt-2 text-[11px] text-[#64748b] font-medium">
              Created by <span className="text-[#FF6600] font-extrabold uppercase tracking-[0.8px]">IMRAN AHMED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

