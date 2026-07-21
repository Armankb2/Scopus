import { Info } from 'lucide-react';

export function Disclaimer() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-start sm:items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex-shrink-0 mt-0.5 sm:mt-0">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="text-sm flex-1 leading-relaxed">
        <strong>Disclaimer:</strong> This platform is currently under active development and serves as a research prototype for aggregating academic publication data from multiple external sources. While every effort has been made to ensure the accuracy of the information presented, the data may occasionally contain inaccuracies, omissions, or inconsistencies due to source limitations, synchronization delays, or automated extraction processes. Users are strongly advised to verify all publication details, citation metrics, journal rankings, and related information with the respective official sources before using the data for academic, legal, administrative, or any other official purposes.
      </div>
    </div>
  );
}
