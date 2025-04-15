
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full py-6 px-4 mt-12 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-sm text-gray-500">
        <a
          href="https://github.com/familiarcow/CBTX"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-gray-900 transition-colors duration-200"
        >
          <Github className="h-4 w-4" />
          <span>Source Code</span>
        </a>
      </div>
    </footer>
  );
}
