import { motion } from 'framer-motion';
import logo from '/images/frombase-text.svg';
import { FarcasterAuth } from './farcaster-auth';

export function LogoHeader() {
  const handleLogoClick = () => {
    window.location.reload();
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <motion.img
            src={logo}
            alt="CBTX Logo"
            className="w-[200px] h-[50px] object-contain cursor-pointer"
            onClick={handleLogoClick}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.5 }
            }}
          />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <FarcasterAuth compact />
          </motion.div>
        </div>
      </div>
    </div>
  );
} 