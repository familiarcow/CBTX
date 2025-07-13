import { X } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Info() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 relative max-w-2xl mx-auto w-full px-4 py-12">
        {/* X button to return to swap app */}
        <div className="absolute top-4 right-4">
          <Link href="/">
            <a className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="h-6 w-6" />
            </a>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <h1 className="text-3xl font-bold mb-6">About fromBase</h1>
          
          <div className="space-y-4 text-gray-700">
            <p>Created by  <a 
                href="https://x.com/familiarcow" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >FamiliarCow</a>
              &nbsp; &copy; 2025
              </p>
            
            <p>All swaps are 100% onchain, powered by decentralized protocols. This app is 100% &nbsp;
              <a 
                href="https://github.com/familiarcow/CBTX" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >open source</a>.</p>

            <p>
              fromBase uses <a 
                href="https://thorchain.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >THORChain</a> as a swap provider. All swaps are provided by THORChain, 
              this app is simply an interface to interact with the network. fromBase is not affiliated with THORChain or responsible for any issues that may occur.

            </p>
            
            <p>
              <a 
                href="https://docs.thorchain.org/how-it-works" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >How it works</a>
            </p>

          </div>
        </motion.div>
      </div>
    </div>
  );
} 