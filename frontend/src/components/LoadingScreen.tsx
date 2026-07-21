import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { API_BASE } from '../services/api';
import type { ProgressEvent } from '../types';

interface LoadingScreenProps {
  jobId: string;
  facultyName: string;
  onCompleted: () => void;
}

const STAGES = [
  "Connecting to Google Scholar",
  "Fetching Scopus Publications",
  "Fetching Author Metrics",
  "Retrieving Journal Rankings",
  "Matching Publications",
  "Building Dataset",
  "Generating CSV",
  "Preparing Dashboard"
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ jobId, facultyName, onCompleted }) => {
  const [currentStage, setCurrentStage] = useState('Connecting to Google Scholar');
  const [progress, setProgress] = useState(5);
  const [message, setMessage] = useState('Connecting to extraction engine...');
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState(45); // estimated total seconds initially

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setEta(prev => {
        if (prev <= 2) return 2;
        return prev - 1;
      });
    }, 1000);

    const sseUrl = `${API_BASE}/progress/${jobId}?ngrok-skip-browser-warning=skip`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('progress', (e: any) => {
      try {
        const data: ProgressEvent = JSON.parse(e.data);
        
        // Match incoming stage to nearest STAGES index to sync progress visual state
        if (data.stage) {
          setCurrentStage(data.stage);
        }
        
        setProgress(data.progress);
        setMessage(data.message);

        // Dynamically adjust ETA based on progress percentage reached
        const elapsed = (Date.now() - start) / 1000;
        if (data.progress > 5 && data.progress < 100) {
          const estimatedTotal = (elapsed / data.progress) * 100;
          const remaining = Math.max(1, Math.round(estimatedTotal - elapsed));
          setEta(remaining);
        }

        if (data.error) {
          setError(data.error);
          eventSource.close();
          clearInterval(interval);
        } else if (data.completed || data.progress >= 100) {
          setProgress(100);
          setEta(0);
          setMessage('Unified portfolio compiled! Transitioning to dashboard...');
          setTimeout(() => {
            eventSource.close();
            clearInterval(interval);
            onCompleted();
          }, 800);
        }
      } catch (err) {
        console.error('SSE parsing error:', err);
      }
    });

    eventSource.onerror = () => {
      // Fallback completion check if socket completes quietly
      setTimeout(() => {
        eventSource.close();
        clearInterval(interval);
        onCompleted();
      }, 2000);
    };

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [jobId, onCompleted]);

  // Determine stage visual state index
  const getStageStatus = (stageName: string) => {
    const currentIndex = STAGES.findIndex(s => currentStage.toLowerCase().includes(s.split(' ')[0].toLowerCase()));
    const targetIndex = STAGES.findIndex(s => s.toLowerCase().includes(stageName.split(' ')[0].toLowerCase()));
    
    if (progress === 100 || targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'active';
    return 'queued';
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
      <div className="glass-card p-8 sm:p-12 w-full shadow-glass-lg border border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25 mb-8 animate-pulse-slow">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2 text-center">
            Fetching Academic Portfolio
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            Please wait while the unified aggregator runs search queries for <span className="font-bold text-foreground">{facultyName}</span>.
          </p>

          {/* Loader bar and metrics */}
          <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800/80 rounded-full h-3 p-0.5 mb-2.5 shadow-inner overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between w-full max-w-md text-xs font-bold text-muted-foreground mb-10 px-1">
            <span className="text-primary uppercase tracking-wider">Progress: {progress}%</span>
            <span>ETA: ~{eta}s remaining</span>
          </div>

          {/* Redesigned Step Based Timeline */}
          <div className="w-full max-w-lg space-y-3.5">
            {STAGES.map((stg, idx) => {
              const status = getStageStatus(stg);
              
              let statusIcon = <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700" />;
              let cardStyle = 'border-slate-100 dark:border-slate-800/40 opacity-40';
              
              if (status === 'completed') {
                statusIcon = <CheckCircle2 className="w-4.5 h-4.5 text-secondary" />;
                cardStyle = 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 opacity-80';
              } else if (status === 'active') {
                statusIcon = <Loader2 className="w-4.5 h-4.5 text-primary animate-spin" />;
                cardStyle = 'bg-white dark:bg-slate-900 border-primary shadow-sm scale-[1.01]';
              }

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${cardStyle}`}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {statusIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-foreground">{stg}</div>
                    {status === 'active' && (
                      <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">
                        {message}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    {status === 'completed' ? 'Done' : status === 'active' ? 'Active' : 'Queued'}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-8 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>Failed: {error}. Direct queries will retry using local fallbacks.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
