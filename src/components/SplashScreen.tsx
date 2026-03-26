import { motion } from "motion/react";

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-black to-[#331500] bg-[length:400%_400%]"
        />
        
        {/* Orbs */}
        <motion.div 
          animate={{ x: [0, 100], y: [0, 100] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="absolute -top-[100px] -left-[100px] w-[400px] h-[400px] bg-[#4D148C] rounded-full blur-[80px] opacity-40"
        />
        <motion.div 
          animate={{ x: [0, -100], y: [0, -100] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: -5 }}
          className="absolute -bottom-[100px] -right-[100px] w-[350px] h-[350px] bg-[#FF6600] rounded-full blur-[80px] opacity-40"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-4">
        {/* FedEx Logo Animation */}
        <div className="flex items-baseline font-black text-6xl md:text-8xl tracking-tighter mb-4 filter drop-shadow-2xl">
          <motion.span
            initial={{ opacity: 0, x: -450 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="text-white"
          >
            Fed
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 450 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="text-[#FF6600]"
          >
            Ex
          </motion.span>
        </div>

        <div className="flex flex-col items-center w-full">
          {/* NTN MANAGEMENT */}
          <div className="flex items-center space-x-4 mb-2">
            <motion.span
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white uppercase italic"
            >
              NTN
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white uppercase italic"
            >
              MANAGEMENT
            </motion.span>
          </div>

          {/* Separator Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%", maxWidth: "320px" }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="h-[3px] bg-gradient-to-r from-[#4D148C] to-[#FF6600] shadow-[0_0_10px_rgba(255,102,0,0.5)] rounded-full"
          />

          {/* SHIPMENTS TOOLKIT */}
          <div className="flex items-center space-x-4 mt-4">
            <motion.span
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="text-sm md:text-base font-bold tracking-[0.5em] text-white uppercase"
            >
              SHIPMENTS
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="text-sm md:text-base font-bold tracking-[0.5em] text-[#FF6600] uppercase"
            >
              TOOLKIT
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
