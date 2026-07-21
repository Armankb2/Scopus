import React, { useState, useEffect, useRef } from 'react';
import { Search, User, History, ArrowRight, BookOpen } from 'lucide-react';
import type { FacultyItem } from '../types';
import { fetchFacultyList } from '../services/api';

interface FacultySelectorProps {
  onSelectFaculty: (name: string, forceRefresh?: boolean) => void;
}

export const FacultySelector: React.FC<FacultySelectorProps> = ({ onSelectFaculty }) => {
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFacultyList().then(setFacultyList).catch(console.error);
    const stored = localStorage.getItem('msrit_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Close dropdown if user clicks outside of the history drawer
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (name: string) => {
    const updated = [name, ...recentSearches.filter(n => n.toLowerCase() !== name.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('msrit_recent_searches', JSON.stringify(updated));
  };

  const filteredFaculty = facultyList.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.scopus_id.includes(query) ||
    f.scholar_id.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name: string) => {
    setQuery(name);
    setIsFocused(false);
    setShowHistory(false);
    saveRecentSearch(name);
    onSelectFaculty(name, false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      setShowHistory(false);
      saveRecentSearch(query.trim());
      onSelectFaculty(query.trim(), false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-center">
      
      {/* Centered clean academic logo panel */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          MSRIT Academic Publication Data Aggregator
        </h2>
        <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
          Department of Computer Science & Engineering • M. S. Ramaiah Institute of Technology
        </p>
      </div>

      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 text-center max-w-2xl mb-8 leading-relaxed">
        Locate, merge, and evaluate deduplicated publication portfolios across Scopus and Google Scholar databases for faculty authors.
      </p>

      {/* Clean Academic Search Form */}
      <div className="w-full max-w-2xl relative mb-12" ref={historyRef}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1 flex items-center bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl focus-within:border-primary transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsFocused(true);
                setShowHistory(false);
              }}
              onFocus={() => {
                setIsFocused(true);
                setShowHistory(false);
              }}
              placeholder="Search faculty name (e.g. Soumya C S)..."
              className="w-full py-3.5 px-3 bg-transparent text-foreground placeholder:text-slate-400 focus:outline-none text-sm sm:text-base font-semibold"
            />
            {recentSearches.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowHistory(!showHistory);
                  setIsFocused(false);
                }}
                className="mr-3 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-all"
                title="Search History"
              >
                <History className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-btn"
          >
            Search
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Autocomplete Droplist */}
        {isFocused && query.trim().length > 0 && (
          <div className="absolute z-40 w-full mt-1.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 shadow-lg max-h-64 overflow-y-auto rounded-xl animate-in fade-in duration-100">
            {filteredFaculty.length > 0 ? (
              filteredFaculty.map((f, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => handleSelect(f.name)}
                  className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b last:border-none border-slate-100 dark:border-slate-850"
                >
                  <div>
                    <div className="font-bold text-foreground text-sm">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {f.scopus_id ? `Scopus ID: ${f.scopus_id}` : 'Google Scholar'}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))
            ) : (
              <div 
                onMouseDown={() => handleSelect(query.trim())}
                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-center text-xs font-bold text-foreground"
              >
                Execute extraction for custom faculty name "{query}"
              </div>
            )}
          </div>
        )}

        {/* History Dropdown overlay */}
        {showHistory && recentSearches.length > 0 && (
          <div className="absolute z-40 w-full mt-1.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 shadow-lg max-h-60 overflow-y-auto rounded-xl animate-in fade-in duration-100">
            <div className="px-4 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
              Recent Searches
            </div>
            {recentSearches.map((name, i) => (
              <div
                key={i}
                onMouseDown={() => handleSelect(name)}
                className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs font-bold text-foreground border-b last:border-none border-slate-100 dark:border-slate-850"
              >
                <span>{name}</span>
                <History className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Faculty Grid list */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="academic-card p-6 md:col-span-3">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-foreground">
              <User className="w-4.5 h-4.5 text-primary" />
              Featured CSE Department Faculty
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">{facultyList.length} Listed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {facultyList.map((f, i) => (
              <button
                key={i}
                onClick={() => handleSelect(f.name)}
                className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-primary transition-all group flex justify-between items-center"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {f.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                    {f.scopus_id ? `ID: ${f.scopus_id}` : 'Google Scholar'}
                  </div>
                </div>
                <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
