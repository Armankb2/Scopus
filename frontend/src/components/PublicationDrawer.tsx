import React, { useState } from 'react';
import { X, Copy, ExternalLink, Check, BookOpen, Layers, Award, Share2, MapPin, Calendar } from 'lucide-react';
import type { PublicationRow } from '../types';

interface PublicationDrawerProps {
  publication: PublicationRow | null;
  onClose: () => void;
}

export const PublicationDrawer: React.FC<PublicationDrawerProps> = ({ publication, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata' | 'conference' | 'citation' | 'identifiers'>('overview');
  const [copied, setCopied] = useState(false);

  if (!publication) return null;

  const title = publication['Journal Paper Title'] || publication.JournalTitle || publication.JournalName || 'Untitled Publication';
  const journal = publication.JournalName || publication.JournalTitle || 'Unknown Outlet';
  const doi = publication.DOI || '';
  const url = publication.URL || '';
  const isConf = String(publication.IsConference).toUpperCase() === 'YES';

  const handleCopyDoi = () => {
    if (doi) {
      navigator.clipboard.writeText(doi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'metadata', label: 'Metadata', icon: Layers },
    { id: 'conference', label: 'Conference', icon: MapPin },
    { id: 'citation', label: 'Citation Impact', icon: Award },
    { id: 'identifiers', label: 'Identifiers', icon: Share2 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isConf 
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}>
                {isConf ? 'Conference Proceeding' : 'Journal Article'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                String(publication.ScopusVerified).toUpperCase() === 'YES'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {String(publication.ScopusVerified).toUpperCase() === 'YES' ? 'Scopus Verified' : 'Unverified'}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug line-clamp-3">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 flex flex-wrap gap-2.5">
          {doi && (
            <>
              <button
                onClick={handleCopyDoi}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-foreground border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                {copied ? 'DOI Copied!' : 'Copy DOI'}
              </button>
              <a
                href={doi.startsWith('http') ? doi : `https://doi.org/${doi}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open DOI
              </a>
            </>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Publication URL
            </a>
          )}
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto px-4 bg-slate-50/30 dark:bg-slate-900/40 shrink-0">
          {tabs.map((tb) => {
            const Icon = tb.icon;
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={`py-3 px-3.5 border-b-2 font-semibold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === tb.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tb.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Full Title</div>
                <div className="font-semibold text-foreground text-sm">{title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-[11px] text-muted-foreground">Publication Year</div>
                  <div className="font-bold text-base text-foreground mt-0.5">{publication.Year || 'N/A'}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-[11px] text-muted-foreground">Citation Impact</div>
                  <div className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">{publication.NumberOfCitations || '0'} Cites</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Authors & Collaborators</div>
                <div className="text-foreground text-xs leading-relaxed">{publication.coauthor || publication.author || 'N/A'}</div>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <span className="text-muted-foreground font-medium">Journal / Outlet:</span>
                <span className="font-bold text-foreground text-right">{journal}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <span className="text-muted-foreground font-medium">Publisher:</span>
                <span className="font-semibold text-foreground text-right">{publication.Publisher || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border text-center">
                  <div className="text-[10px] text-muted-foreground">Volume</div>
                  <div className="font-bold mt-0.5">{publication.Volume || '-'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border text-center">
                  <div className="text-[10px] text-muted-foreground">Issue</div>
                  <div className="font-bold mt-0.5">{publication.Issue || '-'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border text-center">
                  <div className="text-[10px] text-muted-foreground">Pages</div>
                  <div className="font-bold mt-0.5">{publication.Pages || '-'}</div>
                </div>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <span className="text-muted-foreground font-medium">Article Number / PII:</span>
                <span className="font-mono font-semibold text-foreground">{publication.ArticleNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <span className="text-muted-foreground font-medium">Cover Date:</span>
                <span className="font-semibold text-foreground">{publication.DateOfPublication || 'N/A'}</span>
              </div>
            </div>
          )}

          {activeTab === 'conference' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <div className="font-bold text-sm text-purple-900 dark:text-purple-200 mb-1">Venue Type Assessment</div>
                <p className="text-purple-700 dark:text-purple-300">
                  {isConf ? 'Identified as a peer-reviewed Conference Proceeding or Workshop.' : 'Identified as a standard Journal or Book Chapter.'}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Conference Date Range</div>
                  <div className="font-semibold text-foreground mt-0.5">{publication.ConferenceDate || 'Not specified in metadata'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Conference Location / City</div>
                  <div className="font-semibold text-foreground mt-0.5">{publication.ConferenceLocation || 'Not specified in metadata'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'citation' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Total Citation Count</div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{publication.NumberOfCitations || '0'}</div>
                </div>
                <Award className="w-10 h-10 text-emerald-500 opacity-80" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-[10px] text-muted-foreground">SCImago SJR Metric</div>
                  <div className="font-bold text-sm text-foreground mt-0.5">{publication.SJR || 'N/A'}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-[10px] text-muted-foreground">Journal Quartile</div>
                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400 mt-0.5">{publication.Quartile || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identifiers' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                <div className="text-muted-foreground font-medium">Digital Object Identifier (DOI):</div>
                <div className="font-mono font-bold text-primary break-all">{doi || 'No DOI assigned'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                <div className="text-muted-foreground font-medium">Author ORCID:</div>
                <div className="font-mono font-bold text-foreground">{publication.ORCID || 'N/A'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                <div className="text-muted-foreground font-medium">Direct Elsevier Abstract URL:</div>
                <div className="font-mono text-[11px] text-muted-foreground break-all">{url || 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
