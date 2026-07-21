import React, { useMemo } from 'react';
import { Award, BookOpen, CheckCircle2, ChevronRight, Layers, BookmarkCheck, ArrowLeft } from 'lucide-react';
import type { PortfolioMetrics, PublicationRow } from '../types';

interface KpiSectionProps {
  author: { name: string; scopus_id: string; scholar_id: string };
  metrics: PortfolioMetrics;
  publications: PublicationRow[];
  generatedAt: string;
  cached: boolean;
  onRefresh: () => void;
  onBack: () => void;
}

export const KpiSection: React.FC<KpiSectionProps> = ({
  author,
  metrics,
  publications,
  generatedAt,
  cached,
  onRefresh,
  onBack
}) => {
  // Generate Executive Summary variables dynamically from publications rows
  const summary = useMemo(() => {
    if (publications.length === 0) return null;

    let totalCites = 0;
    publications.forEach(p => {
      const c = Number(p.NumberOfCitations || 0);
      if (!isNaN(c)) totalCites += c;
    });

    let journalCount = 0;
    let confCount = 0;
    publications.forEach(p => {
      if (String(p.IsConference).toUpperCase() === 'YES') confCount++;
      else journalCount++;
    });

    let highestQ = 'N/A';
    const quartiles = publications.map(p => String(p.Quartile || '').toUpperCase());
    if (quartiles.some(q => q.includes('Q1'))) highestQ = 'Q1';
    else if (quartiles.some(q => q.includes('Q2'))) highestQ = 'Q2';
    else if (quartiles.some(q => q.includes('Q3'))) highestQ = 'Q3';
    else if (quartiles.some(q => q.includes('Q4'))) highestQ = 'Q4';

    const yearCounts: { [year: string]: number } = {};
    publications.forEach(p => {
      const y = String(p.Year || '').trim();
      if (y && y !== 'N/A' && y !== 'Unknown') {
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      }
    });
    let activeYear = 'N/A';
    let maxYearCount = 0;
    Object.entries(yearCounts).forEach(([y, c]) => {
      if (c > maxYearCount) {
        maxYearCount = c;
        activeYear = y;
      }
    });

    const pubCounts: { [pub: string]: number } = {};
    publications.forEach(p => {
      const pub = String(p.Publisher || '').trim();
      if (pub && pub !== 'N/A' && pub !== 'Unknown') {
        pubCounts[pub] = (pubCounts[pub] || 0) + 1;
      }
    });
    let topPublisher = 'N/A';
    let maxPubCount = 0;
    Object.entries(pubCounts).forEach(([p, c]) => {
      if (c > maxPubCount) {
        maxPubCount = c;
        topPublisher = p;
      }
    });

    const venueCounts: { [venue: string]: number } = {};
    publications.forEach(p => {
      const v = String(p.JournalName || p.JournalTitle || '').trim();
      if (v && v !== 'N/A' && v !== 'Unknown') {
        venueCounts[v] = (venueCounts[v] || 0) + 1;
      }
    });
    let topJournal = 'N/A';
    let maxVenueCount = 0;
    Object.entries(venueCounts).forEach(([v, c]) => {
      if (c > maxVenueCount) {
        maxVenueCount = c;
        topJournal = v;
      }
    });

    return {
      totalCites,
      journalCount,
      confCount,
      highestQ,
      activeYear,
      topPublisher,
      topJournal
    };
  }, [publications]);

  const orcid = useMemo(() => {
    const found = publications.find(p => p.ORCID && p.ORCID !== 'N/A');
    return found ? found.ORCID : null;
  }, [publications]);

  const updateTime = generatedAt 
    ? new Date(generatedAt).toLocaleString() 
    : 'Just now';

  return (
    <div className="w-full space-y-6">
      
      {/* Top Header: Breadcrumbs & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <span>Home</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span>Faculty Search</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-foreground">{author.name}</span>
        </div>
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors py-1 px-3 border border-slate-200 hover:border-primary/45 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Faculty Search
        </button>
      </div>

      {/* Redesigned Profile Card: Professional, Academic, Clean */}
      <div className="academic-card p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
              {author.name}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Department of Computer Science & Engineering • M. S. Ramaiah Institute of Technology
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-450 border-t border-slate-200/60 dark:border-slate-800/80 pt-4 mt-4">
              <div>
                <span className="text-muted-foreground font-semibold">Scopus Author ID:</span>
                <span className="font-mono font-bold text-foreground ml-1.5">{author.scopus_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Google Scholar ID:</span>
                <span className="font-mono font-bold text-foreground ml-1.5">{author.scholar_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">ORCID ID:</span>
                <span className="font-mono font-bold text-foreground ml-1.5">{orcid || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Data Sources:</span>
                <span className="font-bold text-foreground ml-1.5">Scopus • Scholar • CrossRef • SCImago</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Last Updated:</span>
                <span className="font-bold text-foreground ml-1.5">{updateTime}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Verification status:</span>
                <span className="font-bold text-foreground ml-1.5">{cached ? 'Pre-Cached dataset' : 'Live extracted'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 w-full lg:w-auto">
            <button
              onClick={onRefresh}
              className="px-4 py-2.5 rounded-lg bg-primary hover:opacity-90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all glow-btn w-full text-center"
            >
              Force Refresh data
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* h-index */}
        <div className="academic-card p-5 border-l-4 border-l-primary flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">h-index</span>
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.h_index || '0'}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Scopus Index</span>
        </div>

        {/* i10-index */}
        <div className="academic-card p-5 border-l-4 border-l-secondary flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">i10-index</span>
            <Award className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.i10_index || '0'}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Scholar Index</span>
        </div>

        {/* Total Citations */}
        <div className="academic-card p-5 border-l-4 border-l-accent flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Citations</span>
            <BookmarkCheck className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.total_citations || '0'}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Sum citations</span>
        </div>

        {/* Total Publications */}
        <div className="academic-card p-5 border-l-4 border-l-indigo-500 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Publications</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.total_publications}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Total portfolio</span>
        </div>

        {/* Verified Publications */}
        <div className="academic-card p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.verified_publications}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Scopus count</span>
        </div>

        {/* Journal Papers */}
        <div className="academic-card p-5 border-l-4 border-l-amber-500 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Journals</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.journal_papers}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Journals list</span>
        </div>

        {/* Conference Papers */}
        <div className="academic-card p-5 border-l-4 border-l-purple-500 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Conferences</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {metrics.conference_papers}
          </div>
          <span className="text-[9px] text-muted-foreground block truncate">Conferences list</span>
        </div>
      </div>

      {/* Dynamic Summary layout */}
      {summary && (
        <div className="academic-card p-6 border-l-4 border-l-secondary bg-slate-50/50 dark:bg-slate-900/30">
          <h3 className="font-bold text-sm sm:text-base text-foreground mb-3 flex items-center gap-1.5">
            Executive Summary
          </h3>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              This author has compiled a total of <strong className="text-foreground">{publications.length} publications</strong> with <strong className="text-foreground">{summary.totalCites} cumulative citations</strong>. H-index stands at <strong className="text-foreground">{metrics.h_index}</strong> (Scholar i10-index: <strong className="text-foreground">{metrics.i10_index}</strong>).
            </p>
            <p>
              The collection features <strong className="text-foreground">{summary.journalCount} Journal papers</strong> and <strong className="text-foreground">{summary.confCount} Conference proceedings</strong>. The highest quartile rank achieved is <strong className="text-primary font-bold">{summary.highestQ}</strong>. Most active publication output year was <strong className="text-foreground">{summary.activeYear}</strong>, with the top publisher being <strong className="text-foreground">{summary.topPublisher}</strong> (Top Journal venue: <strong className="text-foreground">{summary.topJournal}</strong>).
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
