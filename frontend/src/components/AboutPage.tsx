import React from 'react';
import { Database, ShieldAlert, Cpu, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-200">
      <div className="academic-card p-8 sm:p-10 mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
          Academic Publication Data Aggregator
        </h2>
        <div className="w-16 h-1 bg-primary mb-6"></div>

        <section className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-3">Project Purpose</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The Academic Publication Data Aggregator is a unified research analytics portal designed for the Department of Computer Science & Engineering at Ramaiah Institute of Technology. The platform aggregates, deduplicates, and validates publication portfolios of faculty members, fetching live metadata directly from major scholarly databases and presenting them in a structured dashboard.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Technologies Used */}
          <section>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
              <Cpu className="w-4.5 h-4.5 text-primary" />
              Technologies Used
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
              <li><strong>Python</strong>: Core extraction and processing script engine.</li>
              <li><strong>FastAPI</strong>: High-performance ASGI REST and Server-Sent Events (SSE) background runner.</li>
              <li><strong>React & TypeScript</strong>: Handcrafted single-page presentation layout.</li>
              <li><strong>Tailwind CSS</strong>: Academic color palette configurations.</li>
            </ul>
          </section>

          {/* Integrated Data Sources */}
          <section>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
              <Database className="w-4.5 h-4.5 text-secondary" />
              Integrated Data Sources
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
              <li><strong>Elsevier Scopus</strong>: Validated institutional records and citation counters.</li>
              <li><strong>Google Scholar</strong>: Core indexes and citation profile references.</li>
              <li><strong>CrossRef</strong>: DOI mappings and metadata verification.</li>
              <li><strong>SCImago</strong>: SCImago Journal Rank (SJR) index and quartile indicators.</li>
            </ul>
          </section>
        </div>

        {/* Core System Features */}
        <section className="mb-8">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
            <Award className="w-4.5 h-4.5 text-primary" />
            Core System Features
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-foreground block">Faculty Search</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-foreground block">Research Analytics</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-foreground block">Deduplication</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-bold text-foreground block">Multi-format Export</span>
            </div>
          </div>
        </section>

        {/* Official Disclaimer */}
        <div className="p-5 bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-l-amber-500 text-amber-800 dark:text-amber-300 text-xs sm:text-sm rounded-r-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-foreground">Official Disclaimer</div>
            <p className="leading-relaxed opacity-90">
              This application is intended for academic and research purposes only. Although data is retrieved from trusted scholarly databases, users should verify all information before using it in official documents.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
