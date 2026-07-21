import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { API_BASE } from '../services/api';
import { toast } from 'sonner';

interface DownloadSectionProps {
  csvFile: string;
  jsonFile: string;
  excelFile: string;
  pdfFile: string;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  csvFile,
  jsonFile,
  excelFile,
  pdfFile
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (fileType: 'csv' | 'json' | 'excel' | 'pdf', filename: string) => {
    if (!filename) {
      toast.error(`Requested ${fileType.toUpperCase()} file does not exist.`);
      return;
    }
    
    setDownloading(fileType);
    toast.info(`Downloading ${fileType.toUpperCase()}...`);

    try {
      const url = `${API_BASE}/download/${fileType}/${filename}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloading(null);
        toast.success(`${fileType.toUpperCase()} download complete.`);
      }, 800);
    } catch (err: any) {
      setDownloading(null);
      toast.error(`Download failed: ${err.message || 'Server error'}`);
    }
  };

  const currentYear = new Date().getFullYear();

  const docCards = [
    {
      type: 'csv' as const,
      label: 'CSV',
      title: 'Deduplicated CSV Dataset',
      filename: csvFile,
    },
    {
      type: 'json' as const,
      label: 'JSON',
      title: 'Deduplicated JSON Profile',
      filename: jsonFile,
    },
    {
      type: 'excel' as const,
      label: 'Excel',
      title: 'Styled Excel Spreadsheet',
      filename: excelFile,
    },
    {
      type: 'pdf' as const,
      label: 'PDF',
      title: 'Landscape Analytics PDF',
      filename: pdfFile,
    }
  ];

  return (
    <div className="w-full mb-8">
      <div className="academic-card p-6">
        <h3 className="font-extrabold text-sm sm:text-base text-foreground mb-4">
          Export Publications & Reports
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {docCards.map((doc, idx) => {
            const isReady = !!doc.filename;
            const isCurrent = downloading === doc.type;

            return (
              <div 
                key={idx}
                className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col justify-between h-40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-sm text-foreground">
                      {doc.label}
                    </span>
                    <span className={`text-[10px] font-bold ${isReady ? 'text-slate-500' : 'text-amber-600'}`}>
                      {isReady ? 'Ready ✓' : 'Generate First'}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {doc.title}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Last Generated: {isReady ? `${currentYear}-07-01` : 'N/A'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                  {isReady ? (
                    <button
                      onClick={() => handleDownload(doc.type, doc.filename)}
                      disabled={isCurrent}
                      className="w-full py-1.5 rounded border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      {isCurrent ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Download {doc.label}
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-center block text-xs font-bold text-slate-400 py-1.5">
                      Generate First
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
