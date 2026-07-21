import React from 'react';
import { Layers, CheckCircle2, Globe, Database, Award } from 'lucide-react';
import type { PortfolioMetrics } from '../types';

interface MetricsComparisonProps {
  metrics: PortfolioMetrics;
  scopusId: string;
  scholarId: string;
}

export const MetricsComparison: React.FC<MetricsComparisonProps> = ({ metrics, scopusId, scholarId }) => {
  return (
    <div className="w-full mb-10">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Source-Level Metrics Comparison
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contrasting indices extracted from Elsevier Scopus versus Google Scholar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-sm text-blue-950 dark:text-blue-100">Elsevier Scopus</span>
              </div>
              <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full text-blue-700 dark:text-blue-300">
                Primary API
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-blue-200/40 dark:border-blue-800/40">
                <span className="text-muted-foreground">Scopus Author ID:</span>
                <span className="font-mono font-bold text-foreground">{scopusId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-blue-200/40 dark:border-blue-800/40">
                <span className="text-muted-foreground">Verified Documents:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{metrics.verified_publications}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-blue-200/40 dark:border-blue-800/40">
                <span className="text-muted-foreground">h-index Source:</span>
                <span className="font-medium text-foreground">Scopus Coredata</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">SCImago SJR Verification:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Enabled
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">Google Scholar</span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full text-emerald-700 dark:text-emerald-300">
                Scholarly API
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-emerald-200/40 dark:border-emerald-800/40">
                <span className="text-muted-foreground">Scholar Profile ID:</span>
                <span className="font-mono font-bold text-foreground">{scholarId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-200/40 dark:border-emerald-800/40">
                <span className="text-muted-foreground">i10-index:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{metrics.i10_index || '0'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-200/40 dark:border-emerald-800/40">
                <span className="text-muted-foreground">Total Citations:</span>
                <span className="font-bold text-foreground">{metrics.total_citations || '0'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">CrossRef DOI Enrich:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-2 border-primary/40 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm text-foreground">Combined Unified Engine</span>
              </div>
              <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                Unified Portfolio
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-muted-foreground">Total Deduplicated Pubs:</span>
                <span className="font-extrabold text-primary text-sm">{metrics.total_publications}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-muted-foreground">Effective h-index:</span>
                <span className="font-extrabold text-foreground text-sm">{metrics.h_index || '0'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-muted-foreground">Effective Citations:</span>
                <span className="font-extrabold text-foreground text-sm">{metrics.total_citations || '0'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Verification Ratio:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.total_publications > 0 ? `${Math.round((metrics.verified_publications / metrics.total_publications) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
