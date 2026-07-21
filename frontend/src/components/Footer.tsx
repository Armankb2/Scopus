import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-24 py-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-4xl mx-auto px-6 space-y-8 text-center sm:text-left">

        {/* Aggregator Heading */}
        <div>
          <h4 className="font-extrabold text-sm sm:text-base text-foreground mb-1">
            MSRIT Academic Publication Data Aggregator
          </h4>
          <div className="h-0.5 w-12 bg-primary/60 my-2 mx-auto sm:mx-0"></div>
        </div>

        {/* Dynamic Multi-column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Developed By */}
          <div>
            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Developed By</span>
            <p className="font-extrabold text-foreground text-sm mt-1.5">Arman KB</p>
            <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
              1MS23CS030<br />
              Department of Computer Science & Engineering<br />
              M. S. Ramaiah Institute of Technology
            </p>
          </div>

          {/* Under the Guidance of */}
          <div className="sm:col-span-2 space-y-4">
            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] block">Under the Guidance of</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-extrabold text-foreground">Dr. Shilpa S. Chaudhari</p>
                <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                  Associate Professor<br />
                  Department of Computer Science & Engineering<br />
                  M. S. Ramaiah Institute of Technology
                </p>
              </div>
              <div>
                <p className="font-extrabold text-foreground">Dr. Rajarajeswari S.</p>
                <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                  Associate Professor<br />
                  Department of Computer Science & Engineering<br />
                  M. S. Ramaiah Institute of Technology
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Base Info and Powered By */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            <span className="font-semibold">Powered by:</span> Scopus • Google Scholar • CrossRef • SCImago
          </div>
          <div className="text-center sm:text-right">
            <p>© 2026 Arman KB. All Rights Reserved.</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">This application was developed for academic and research purposes.</p>
          </div>
        </div>

      </div>
    </footer>
  );
};
