import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '/images/cbtx-logo-1.svg';
import logo2 from '/images/cbtx-logo-2.svg';

export function LogoHeader() {
  const [currentLogo, setCurrentLogo] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogo((prev) => (prev === 1 ? 2 : 1));
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    window.location.reload();
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div 
          className="relative w-[200px] h-[50px] cursor-pointer" 
          onClick={handleLogoClick}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentLogo}
              src={currentLogo === 1 ? logo1 : logo2}
              alt="CBTX Logo"
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ 
                scale: 0.8,
                opacity: 0,
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
              }}
              exit={{ 
                scale: 1.2,
                opacity: 0,
              }}
              transition={{
                duration: 1,
                ease: [0.4, 0, 0.2, 1],
                opacity: { duration: 0.5 }
              }}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 