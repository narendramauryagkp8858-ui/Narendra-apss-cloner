import React from 'react';
import { Layers, Plus, Mail } from 'lucide-react';

interface HeaderProps {
  onOpenCloneModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCloneModal }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-purple-500/20 flex items-center justify-center text-white">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap block">
              Narendra App Cloner
            </span>
            <p className="text-[11px] text-slate-400 -mt-0.5">
              By Narendra Maurya
            </p>
          </div>
        </div>

        {/* Right Side: Developer Email & Primary Clone CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="mailto:narendramauryagkp@gmail.com"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/60 rounded-lg transition-colors whitespace-nowrap"
            title="Developer Email: narendramauryagkp@gmail.com"
          >
            <Mail className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span>narendramauryagkp@gmail.com</span>
          </a>

          <button
            onClick={onOpenCloneModal}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 shadow-md shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Clone App</span>
          </button>
        </div>

      </div>
    </header>
  );
};
