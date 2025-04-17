import { Github, Info } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full py-6 px-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-center">
        <div className="flex items-center gap-4">
          
          <Link href="/info">
            <a className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Info className="h-4 w-4" />
            </a>
          </Link>
          <a
            href="https://github.com/familiarcow/CBTX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/cbbtcexchange"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-xl font-bold">𝕏</span>
          </a>
         
        </div>
      </div>
    </motion.footer>
  );
} 