import React, { useState, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Search, CheckSquare, ChevronLeft, ChevronRight, ArrowUpDown, ExternalLink, Grid, Table as TableIcon } from 'lucide-react';
import type { PublicationRow } from '../types';
import { PublicationCard } from './PublicationCard';

interface PublicationTableProps {
  publications: PublicationRow[];
  authorName: string;
  onSelectRow: (row: PublicationRow) => void;
}

export const PublicationTable: React.FC<PublicationTableProps> = ({
  publications,
  authorName,
  onSelectRow
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Dynamic filter dropdown states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterQuartile, setFilterQuartile] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterPublisher, setFilterPublisher] = useState<string>('all');
  const [filterJournal, setFilterJournal] = useState<string>('all');

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    sl_no: true,
    title: true,
    coauthor: true,
    JournalName: true,
    Year: true,
    Quartile: true,
    NumberOfCitations: true,
    IsConference: true,
    DOI: true,
    Publisher: false,
    Volume: false,
    Issue: false,
    Pages: false,
    SJR: false,
    ScopusVerified: true
  });

  // Calculate unique filters dynamically
  const uniqueFilters = useMemo(() => {
    const years = new Set<string>();
    const publishers = new Set<string>();
    const journals = new Set<string>();

    publications.forEach(p => {
      const y = String(p.Year || '').trim();
      if (y && y !== 'N/A') years.add(y);

      const pub = String(p.Publisher || '').trim();
      if (pub && pub !== 'N/A') publishers.add(pub);

      const j = String(p.JournalName || p.JournalTitle || '').trim();
      if (j && j !== 'N/A') journals.add(j);
    });

    return {
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      publishers: Array.from(publishers).sort(),
      journals: Array.from(journals).sort()
    };
  }, [publications]);

  // Apply filters & search term manually
  const filteredData = useMemo(() => {
    return publications.filter(p => {
      // 1. Type Filter (Journal vs Conf)
      if (filterType !== 'all') {
        const isConf = String(p.IsConference).toUpperCase() === 'YES';
        if (filterType === 'journal' && isConf) return false;
        if (filterType === 'conference' && !isConf) return false;
      }
      // 2. Quartile Filter
      if (filterQuartile !== 'all') {
        const q = String(p.Quartile || '').toUpperCase();
        if (!q.includes(filterQuartile.toUpperCase())) return false;
      }
      // 3. Year Filter
      if (filterYear !== 'all') {
        if (String(p.Year) !== filterYear) return false;
      }
      // 4. Publisher Filter
      if (filterPublisher !== 'all') {
        if (String(p.Publisher || '').trim() !== filterPublisher) return false;
      }
      // 5. Journal/Venue Filter
      if (filterJournal !== 'all') {
        const venue = String(p.JournalName || p.JournalTitle || '').trim();
        if (venue !== filterJournal) return false;
      }
      // 6. Global Multi-field Search
      if (globalFilter.trim()) {
        const q = globalFilter.toLowerCase();
        const title = (p['Journal Paper Title'] || p.JournalTitle || p.JournalName || '').toLowerCase();
        const authors = (p.coauthor || p.author || '').toLowerCase();
        const journalVal = (p.JournalName || p.JournalTitle || '').toLowerCase();
        const pubVal = (p.Publisher || '').toLowerCase();
        const doiVal = (p.DOI || '').toLowerCase();
        const yearVal = String(p.Year || '').toLowerCase();

        const match = title.includes(q) || authors.includes(q) || journalVal.includes(q) || pubVal.includes(q) || doiVal.includes(q) || yearVal.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [publications, filterType, filterQuartile, filterYear, filterPublisher, filterJournal, globalFilter]);

  const columns = useMemo<ColumnDef<PublicationRow>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-slate-350 dark:border-slate-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-slate-350 dark:border-slate-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
        />
      ),
      size: 40
    },
    {
      accessorKey: 'sl_no',
      header: 'Sl No',
      cell: info => <span className="font-mono text-xs font-semibold">{String(info.getValue() || '')}</span>,
      size: 65
    },
    {
      id: 'title',
      accessorFn: row => row['Journal Paper Title'] || row.JournalTitle || row.JournalName || '',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 font-bold">
          Publication Title <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </button>
      ),
      cell: info => (
        <span className="font-bold text-foreground hover:text-primary transition-colors text-xs leading-normal">
          {String(info.getValue())}
        </span>
      ),
      size: 320
    },
    {
      accessorKey: 'coauthor',
      header: 'Authors',
      cell: info => <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{String(info.getValue() || '')}</span>,
      size: 200
    },
    {
      accessorKey: 'JournalName',
      header: 'Journal / Venue',
      cell: info => <span className="text-xs font-medium text-foreground line-clamp-1">{String(info.getValue() || '')}</span>,
      size: 220
    },
    {
      accessorKey: 'Year',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 font-bold">
          Year <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </button>
      ),
      cell: info => <span className="font-mono font-bold text-xs">{String(info.getValue() || '')}</span>,
      size: 80
    },
    {
      accessorKey: 'Quartile',
      header: 'Quartile',
      cell: info => {
        const q = String(info.getValue() || 'N/A').toUpperCase();
        let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-600';
        if (q.includes('Q1')) bg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-350 border border-emerald-200/50';
        else if (q.includes('Q2')) bg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-350 border border-blue-200/50';
        else if (q.includes('Q3')) bg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-305 border border-amber-200/50';
        else if (q.includes('Q4')) bg = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50';
        return <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${bg}`}>{q}</span>;
      },
      size: 90
    },
    {
      accessorKey: 'NumberOfCitations',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 font-bold">
          Cites <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </button>
      ),
      cell: info => <span className="font-mono font-bold text-xs text-foreground">{String(info.getValue() || '0')}</span>,
      size: 80
    },
    {
      accessorKey: 'IsConference',
      header: 'Type',
      cell: info => {
        const isConf = String(info.getValue() || '').toUpperCase() === 'YES';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isConf ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/30' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/30'
          }`}>
            {isConf ? 'Conf' : 'Journal'}
          </span>
        );
      },
      size: 85
    },
    {
      accessorKey: 'DOI',
      header: 'DOI',
      cell: info => {
        const d = String(info.getValue() || '');
        if (!d) return <span className="text-slate-400 font-medium">-</span>;
        return (
          <a
            href={d.startsWith('http') ? d : `https://doi.org/${d}`}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[130px]"
          >
            {d} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        );
      },
      size: 140
    },
    {
      accessorKey: 'Publisher',
      header: 'Publisher',
      cell: info => <span className="text-xs text-slate-500 line-clamp-1">{String(info.getValue() || '-')}</span>,
      size: 150
    },
    {
      accessorKey: 'ScopusVerified',
      header: 'Verified',
      cell: info => {
        const ver = String(info.getValue() || '').toUpperCase() === 'YES';
        return ver ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">YES</span>
        ) : (
          <span className="text-slate-400 font-medium text-[10px]">NO</span>
        );
      },
      size: 80
    }
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const exportSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows.map(r => r.original);
    if (selectedRows.length === 0) return;
    const headers = Object.keys(selectedRows[0]);
    const csvContent = [
      headers.join(','),
      ...selectedRows.map(row => headers.map(h => `"${String((row as any)[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${authorName.replace(/\s+/g, '_')}_selected_${selectedRows.length}.csv`;
    a.click();
  };

  return (
    <div className="w-full mb-12">
      <div className="academic-card p-6">
        
        {/* Toggle Option View state */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-foreground">
              Publications Inventory
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore deduplicated portfolios using our cards layout or detailed directory table.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'card' 
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-foreground'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Card View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-foreground'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table View
            </button>
          </div>
        </div>

        {/* Dynamic Filters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          
          {/* Global filter input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search title, DOI, publisher, year..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-xs text-foreground placeholder:text-slate-450 focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-2 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="journal">Journals</option>
            <option value="conference">Conferences</option>
          </select>

          <select
            value={filterQuartile}
            onChange={e => setFilterQuartile(e.target.value)}
            className="px-2 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">All Quartiles</option>
            <option value="Q1">Q1 Quartile</option>
            <option value="Q2">Q2 Quartile</option>
            <option value="Q3">Q3 Quartile</option>
            <option value="Q4">Q4 Quartile</option>
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-2 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">All Years</option>
            {uniqueFilters.years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filterPublisher}
            onChange={e => setFilterPublisher(e.target.value)}
            className="px-2 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-xs font-bold text-foreground focus:outline-none sm:col-span-2 md:col-span-2"
          >
            <option value="all">All Publishers</option>
            {uniqueFilters.publishers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterJournal}
            onChange={e => setFilterJournal(e.target.value)}
            className="px-2 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-xs font-bold text-foreground focus:outline-none sm:col-span-2 md:col-span-3"
          >
            <option value="all">All Outlets</option>
            {uniqueFilters.journals.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

        </div>

        {/* Selected Rows action */}
        {Object.keys(rowSelection).length > 0 && viewMode === 'table' && (
          <div className="mb-4">
            <button
              onClick={exportSelected}
              className="px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 border border-primary/20 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              Export Selected Rows ({Object.keys(rowSelection).length})
            </button>
          </div>
        )}

        {/* View Mode switcher */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.length > 0 ? (
              filteredData.map((pub, idx) => (
                <PublicationCard
                  key={idx}
                  publication={pub}
                  onClick={() => onSelectRow(pub)}
                />
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400">
                No publications matches your search filters.
              </div>
            )}
          </div>
        ) : (
          /* Alternating row colors and sticky header table */
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(hdr => (
                      <th key={hdr.id} className="p-3.5 whitespace-nowrap select-none">
                        {flexRender(hdr.column.columnDef.header, hdr.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => onSelectRow(row.original)}
                      className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-950/20 cursor-pointer transition-colors group font-semibold"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-3.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-12 text-center text-muted-foreground">
                      No publications matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground font-semibold">
          <div>
            Page <span className="font-extrabold text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="font-extrabold text-foreground">{table.getPageCount() || 1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
