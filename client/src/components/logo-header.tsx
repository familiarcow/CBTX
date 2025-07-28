import { motion } from 'framer-motion';
import logo from '/images/frombase-text.svg';
import cbtxLogo from '/images/cbtx-logo.png';

export function LogoHeader() {
  const handleLogoClick = () => {
    window.location.reload();
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
          <motion.img
            src={cbtxLogo}
            alt="CBTX Logo"
            className="w-[50px] h-[50px] object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.5 }
            }}
          />
          <motion.img
            src={logo}
            alt="CBTX Text"
            className="w-[200px] h-[50px] object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.5 },
              delay: 0.2
            }}
          />
        </div>
      </div>
    </div>
  );
} 