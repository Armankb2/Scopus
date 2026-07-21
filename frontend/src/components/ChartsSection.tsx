import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import type { PublicationRow, CoauthorStat } from '../types';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Users } from 'lucide-react';

interface ChartsSectionProps {
  publications: PublicationRow[];
  topCoauthors?: CoauthorStat[];
  darkMode: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ publications, topCoauthors = [], darkMode: _darkMode }) => {
  const yearCounts: { [year: string]: { year: string; count: number; citations: number } } = {};
  const pubCounts: { [publisher: string]: number } = {};
  let confCount = 0;
  let journalCount = 0;
  const qCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, NA: 0 };

  publications.forEach(p => {
    const y = String(p.Year || 'Unknown').trim();
    if (y && y !== 'Unknown' && /^\d{4}$/.test(y)) {
      if (!yearCounts[y]) yearCounts[y] = { year: y, count: 0, citations: 0 };
      yearCounts[y].count += 1;
      const cites = Number(p.NumberOfCitations || 0);
      if (!isNaN(cites)) yearCounts[y].citations += cites;
    }

    const pub = String(p.Publisher || 'Other').trim() || 'Other';
    const shortPub = pub.length > 25 ? pub.substring(0, 25) + '...' : pub;
    pubCounts[shortPub] = (pubCounts[shortPub] || 0) + 1;

    const isConf = str(p.IsConference) === 'YES';
    if (isConf) confCount += 1;
    else journalCount += 1;

    const q = str(p.Quartile);
    if (q.includes('Q1')) qCounts.Q1 += 1;
    else if (q.includes('Q2')) qCounts.Q2 += 1;
    else if (q.includes('Q3')) qCounts.Q3 += 1;
    else if (q.includes('Q4')) qCounts.Q4 += 1;
    else qCounts.NA += 1;
  });

  function str(val: any): string {
    return String(val || '').toUpperCase().trim();
  }

  const yearData = Object.values(yearCounts).sort((a, b) => Number(a.year) - Number(b.year));
  
  const typeData = [
    { name: 'Journal Papers', value: journalCount },
    { name: 'Conference Papers', value: confCount }
  ];

  // Dynamic colors toggling based on light and dark theme specifications
  const primaryBarColor = '#00C48C';
  const lineChartColor = '#7DD3FC';
  const publisherBarColor = '#A78BFA';
  
  const pieColors = ['#00C48C', '#7DD3FC', '#FFD54A', '#A78BFA', '#FB7185', '#34D399'];

  const qData = [
    { name: 'Q1', value: qCounts.Q1, color: '#00C48C' },
    { name: 'Q2', value: qCounts.Q2, color: '#7DD3FC' },
    { name: 'Q3', value: qCounts.Q3, color: '#FFD54A' },
    { name: 'Q4', value: qCounts.Q4, color: '#A78BFA' },
  ];

  const pubData = Object.entries(pubCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="w-full space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Publications Per Year */}
        <div className="academic-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" />
              Publications by Year
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Annual Output</span>
          </div>
          <div className="h-56 w-full">
            {yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" stroke="#888888" fontSize={10} />
                  <YAxis stroke="#888888" fontSize={10} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Publications" fill={primaryBarColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No year data available</div>
            )}
          </div>
        </div>

        {/* Citation Trend */}
        <div className="academic-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
              <LineIcon className="w-4 h-4 text-primary" />
              Citation Trend
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Impact</span>
          </div>
          <div className="h-56 w-full">
            {yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" stroke="#888888" fontSize={10} />
                  <YAxis stroke="#888888" fontSize={10} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="citations" name="Citations" stroke={lineChartColor} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No citation data available</div>
            )}
          </div>
        </div>

        {/* Journal vs Conference */}
        <div className="academic-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
              <PieIcon className="w-4 h-4 text-primary" />
              Journal vs Conference
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Venues</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  label={(entry: any) => `${(entry?.name || '').split(' ')[0]}`}
                >
                  {typeData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quartile Distribution */}
        <div className="academic-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" />
              Quartile Distribution
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Quality</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                <YAxis stroke="#888888" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Journals">
                  {qData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Publishers */}
        <div className="academic-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" />
              Top Publishers
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Outlets</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pubData} layout="vertical" margin={{ left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" stroke="#888888" fontSize={10} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} width={90} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Publications" fill={publisherBarColor} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Collaborators */}
        <div className="academic-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-primary" />
              Top Collaborators
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Network</span>
          </div>
          <div className="h-56 overflow-y-auto pr-1 space-y-2 text-xs font-semibold">
            {topCoauthors.length > 0 ? (
              topCoauthors.slice(0, 5).map((ca, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-foreground truncate pr-2">{ca.name}</span>
                  <span className="shrink-0 bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 rounded text-[10px]">
                    {ca.count} papers
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No collaborators parsed</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
