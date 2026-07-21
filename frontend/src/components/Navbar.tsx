import React, { useEffect, useState } from 'react';
import { Moon, Sun, LogOut, ChevronDown, Award, Menu, X } from 'lucide-react';
import { fetchHealthStatus } from '../services/api';

interface NavbarProps {
  currentView: 'selector' | 'loading' | 'dashboard' | 'about';
  setCurrentView: (view: 'selector' | 'loading' | 'dashboard' | 'about') => void;
  hasData: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onReset: () => void;
  user?: { name: string; role: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  hasData,
  darkMode,
  setDarkMode,
  onReset,
  user,
  onLogout
}) => {
  const [health, setHealth] = useState<{ status: string; scopus_availability: string; scholar_availability: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetchHealthStatus()
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'offline', scopus_availability: 'Unknown', scholar_availability: 'Unknown' }));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full academic-nav px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left Side: Clean Academic Text Header */}
        <div 
          onClick={onReset}
          className="flex flex-col cursor-pointer group shrink-0"
        >
          <span className="font-extrabold tracking-tight text-base sm:text-lg text-foreground hover:text-primary transition-colors">
            MSRIT Academic Publication Data Aggregator
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Department of Computer Science & Engineering • M. S. Ramaiah Institute of Technology
          </span>
        </div>        {/* Center/Right: Nav items & Settings */}
        <div className="flex items-center justify-end gap-3 sm:gap-5">
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setCurrentView('selector')}
              className={`pb-1 border-b-2 transition-all ${
                currentView === 'selector' || currentView === 'loading'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Faculty Search
            </button>
            <button
              disabled={!hasData}
              onClick={() => setCurrentView('dashboard')}
              className={`pb-1 border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                currentView === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Research Dashboard
            </button>
            <button
              onClick={() => setCurrentView('about')}
              className={`pb-1 border-b-2 transition-all ${
                currentView === 'about'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              About
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Status Indicators */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-[10px] font-semibold text-muted-foreground shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${health?.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span>Scopus: {health?.scopus_availability || 'Checking...'}</span>
            </div>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 min-h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-left group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block leading-none">
                    <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Welcome, {user.name}
                    </div>
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 sm:hidden">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{user.role}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        alert(`Institutional Profile\n\nName: ${user.name}\nRole: ${user.role}\nStatus: Active Research Portal Access`);
                      }}
                      className="w-full min-h-[44px] px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-primary" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full min-h-[44px] px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 transition-all border border-slate-200 dark:border-slate-700"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground transition-all border border-slate-200 dark:border-slate-700"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileNavOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                setCurrentView('selector');
                setMobileNavOpen(false);
              }}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between ${
                currentView === 'selector' || currentView === 'loading'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
              }`}
            >
              <span>Faculty Search</span>
            </button>
            <button
              disabled={!hasData}
              onClick={() => {
                setCurrentView('dashboard');
                setMobileNavOpen(false);
              }}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed ${
                currentView === 'dashboard'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
              }`}
            >
              <span>Research Dashboard</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('about');
                setMobileNavOpen(false);
              }}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between ${
                currentView === 'about'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
              }`}
            >
              <span>About Portal</span>
            </button>
          </nav>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>System Gateway Status:</span>
            <span className={`font-bold ${health?.status === 'online' ? 'text-emerald-500' : 'text-amber-500'}`}>
              Scopus {health?.scopus_availability || 'Active'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
