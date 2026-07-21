import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FacultySelector } from './components/FacultySelector';
import { LoadingScreen } from './components/LoadingScreen';
import { KpiSection } from './components/KpiSection';
import { ChartsSection } from './components/ChartsSection';
import { MetricsComparison } from './components/MetricsComparison';
import { PublicationTable } from './components/PublicationTable';
import { PublicationDrawer } from './components/PublicationDrawer';
import { DownloadSection } from './components/DownloadSection';
import { AboutPage } from './components/AboutPage';
import { LoginPage } from './components/LoginPage';
import { Disclaimer } from './components/Disclaimer';
import type { FetchResponse, PublicationRow } from './types';
import { startFetchJob, fetchPortfolioData } from './services/api';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem('research-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState<'selector' | 'loading' | 'dashboard' | 'about'>('selector');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<FetchResponse | null>(null);
  const [selectedRow, setSelectedRow] = useState<PublicationRow | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSelectFaculty = async (name: string, forceRefresh: boolean = false) => {
    setSelectedFaculty(name);
    try {
      const res = await startFetchJob(name, forceRefresh);
      if (res.cached && !forceRefresh) {
        toast.info("Loading cached research records...");
        const data = await fetchPortfolioData(name, false);
        setPortfolioData(data);
        setView('dashboard');
        toast.success("Research dashboard loaded successfully!");
      } else {
        setJobId(res.job_id);
        setView('loading');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize portfolio extraction.');
    }
  };

  const handleLoadingCompleted = async () => {
    try {
      const data = await fetchPortfolioData(selectedFaculty, false);
      setPortfolioData(data);
      setView('dashboard');
      toast.success("Research dashboard loaded successfully!");
    } catch (err: any) {
      toast.error(err.message || 'Error loading completed dataset.');
      setView('selector');
    }
  };

  const handleReset = () => {
    setView('selector');
    setSelectedFaculty('');
    setJobId(null);
    setPortfolioData(null);
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <LoginPage onLogin={(u) => setUser(u)} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground transition-colors duration-200 relative overflow-x-hidden">
      <Toaster position="top-right" richColors closeButton />
      
      <Navbar 
        currentView={view} 
        setCurrentView={setView} 
        hasData={!!portfolioData} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onReset={handleReset} 
        user={user}
        onLogout={() => {
          localStorage.removeItem('research-user');
          setUser(null);
          toast.success("Logged out successfully.");
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-16">
        <Disclaimer />
        
        {view === 'selector' && (
          <FacultySelector onSelectFaculty={handleSelectFaculty} />
        )}

        {view === 'about' && (
          <AboutPage />
        )}

        {view === 'loading' && jobId && (
          <LoadingScreen
            jobId={jobId}
            facultyName={selectedFaculty}
            onCompleted={handleLoadingCompleted}
          />
        )}

        {view === 'dashboard' && portfolioData && (
          <div className="animate-in fade-in duration-200 space-y-6">
            
            {/* KPI Cards, Profile, Summary, and Reset navigation */}
            <KpiSection
              author={portfolioData.author}
              metrics={portfolioData.metrics}
              publications={portfolioData.publications}
              generatedAt={portfolioData.generated_at}
              cached={portfolioData.cached}
              onRefresh={() => handleSelectFaculty(selectedFaculty, true)}
              onBack={handleReset}
            />

            {/* Visual Redesigned Charts */}
            <ChartsSection
              publications={portfolioData.publications}
              topCoauthors={portfolioData.top_coauthors}
              darkMode={darkMode}
            />

            {/* Document style Downloads suite */}
            <DownloadSection
              csvFile={portfolioData.csv_file}
              jsonFile={portfolioData.json_file}
              excelFile={portfolioData.excel_file || `${portfolioData.csv_file.replace('.csv', '.xlsx')}`}
              pdfFile={portfolioData.pdf_file || `${portfolioData.csv_file.replace('.csv', '.pdf')}`}
            />

            {/* Scopus vs Scholar Metric Comparer */}
            <MetricsComparison
              metrics={portfolioData.metrics}
              scopusId={portfolioData.author.scopus_id}
              scholarId={portfolioData.author.scholar_id}
            />

            {/* Refined filterable Card view / List table */}
            <PublicationTable
              publications={portfolioData.publications}
              authorName={portfolioData.author.name}
              onSelectRow={setSelectedRow}
            />
          </div>
        )}
      </main>

      <PublicationDrawer
        publication={selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      <Footer />
    </div>
  );
}
