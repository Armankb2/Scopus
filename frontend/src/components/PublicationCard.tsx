import React from 'react';
import { Award, BookOpen, ExternalLink, Calendar } from 'lucide-react';
import type { PublicationRow } from '../types';

interface PublicationCardProps {
  publication: PublicationRow;
  onClick: () => void;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({ publication, onClick }) => {
  const isConf = String(publication.IsConference).toUpperCase() === 'YES';
  const title = publication['Journal Paper Title'] || publication.JournalTitle || publication.JournalName || 'Untitled Publication';
  const journal = publication.JournalName || publication.JournalTitle || 'Unknown Venue';
  const quartile = String(publication.Quartile || 'N/A').toUpperCase();
  const citations = Number(publication.NumberOfCitations || 0);
  const doi = publication.DOI || '';
  const year = publication.Year || 'N/A';
  const publisher = publication.Publisher || 'Unknown Publisher';
  const isVerified = String(publication.ScopusVerified).toUpperCase() === 'YES';

  // Determine Quartile badge coloring matching primary/secondary rose scheme
  let quartileColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  if (quartile.includes('Q1')) {
    quartileColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40';
  } else if (quartile.includes('Q2')) {
    quartileColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40';
  } else if (quartile.includes('Q3')) {
    quartileColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40';
  } else if (quartile.includes('Q4')) {
    quartileColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40';
  }

  return (
    <div 
      onClick={onClick}
      className="academic-card p-6 flex flex-col justify-between hover:border-primary/50 dark:hover:border-primary/40 cursor-pointer group hover:scale-[1.005] active:scale-[0.99] transition-all"
    >
      <div>
        {/* Card Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isConf 
              ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40'
              : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40'
          }`}>
            {isConf ? 'Conference' : 'Journal'}
          </span>
          {quartile !== 'N/A' && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${quartileColor}`}>
              {quartile}
            </span>
          )}
          {citations > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {citations} {citations === 1 ? 'citation' : 'citations'}
            </span>
          )}
          {isVerified && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary dark:text-accent border border-secondary/20">
              Scopus Verified
            </span>
          )}
        </div>

        {/* Paper Title */}
        <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-2.5">
          {title}
        </h4>

        {/* Authors list */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
          {publication.coauthor || publication.author || 'N/A'}
        </p>
      </div>

      {/* Card Footer Details */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate font-medium text-foreground">{journal}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="truncate opacity-75">Publisher: {publisher}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {year}
            </span>
            {doi && (
              <span className="p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:text-primary transition-colors">
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
