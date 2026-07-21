import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, ArrowRight, ShieldCheck, User, BookOpen, Network, Database, CheckCircle2, Loader2, Cpu, Wifi, Globe, Clock, Quote } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { name: string; role: string }) => void;
}

const QUOTES = [
  "Research is creating new knowledge.",
  "Connecting publications, people and impact.",
  "Knowledge grows when shared.",
  "Empowering research through intelligent analytics."
];

const BADGES = [
  "IEEE Xplore", "Springer Nature", "Elsevier Core", "Scopus Index", 
  "Google Scholar", "CrossRef DOI", "SCImago Q1/Q2", "ACM Digital Library"
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'authenticating' | 'loading' | 'success'>('idle');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeBadgeIndex, setActiveBadgeIndex] = useState(0);

  // Simulated live metric counters
  const [researchersOnline, setResearchersOnline] = useState(248);
  const [todaysQueries, setTodaysQueries] = useState(12481);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    const badgeInterval = setInterval(() => {
      setActiveBadgeIndex(prev => (prev + 1) % BADGES.length);
    }, 4000);
    const metricInterval = setInterval(() => {
      setResearchersOnline(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setTodaysQueries(prev => prev + Math.floor(Math.random() * 3));
    }, 3500);
    return () => {
      clearInterval(badgeInterval);
      clearInterval(metricInterval);
    };
  }, []);

  // Dynamic Time of Day Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Good Morning", icon: "☀" };
    if (hour >= 12 && hour < 17) return { text: "Good Afternoon", icon: "🌤" };
    if (hour >= 17 && hour < 22) return { text: "Good Evening", icon: "🌙" };
    return { text: "Welcome Back", icon: "🌌" };
  };
  const greeting = getGreeting();

  // Interactive Knowledge Constellation Canvas Animation with Data Pulses & Camera Drift
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = Math.min(Math.floor((width * height) / 13000), 80);
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      label?: string;
      category: 'scopus' | 'scholar' | 'crossref' | 'scimago' | 'node';
      pulse: number;
    }> = [];

    const labels = [
      'Scopus API', 'Google Scholar', 'SCImago Q1/Q2', 'CrossRef DOI', 'h-index Engine',
      'i10-index', 'Citation Graph', 'Deduplication Pipeline', 'IEEE Xplore', 'Elsevier Core',
      'Springer Nature', 'Author Matrix', 'Neural Clustering', 'Impact Factor', 'Quartile Analytics'
    ];

    for (let i = 0; i < nodeCount; i++) {
      const isLabeled = i < labels.length;
      const categories: Array<'scopus' | 'scholar' | 'crossref' | 'scimago' | 'node'> = [
        'scopus', 'scholar', 'crossref', 'scimago', 'node'
      ];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: isLabeled ? Math.random() * 2.5 + 3.5 : Math.random() * 1.8 + 1.2,
        label: isLabeled ? labels[i] : undefined,
        category: categories[i % categories.length],
        pulse: Math.random() * Math.PI * 2
      });
    }

    // Data pulses traveling along connection edges
    const pulses: Array<{ fromIdx: number; toIdx: number; progress: number; speed: number; color: string }> = [];

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    const draw = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Subtle slow camera drift offset
      const driftX = Math.sin(time * 0.4) * 8;
      const driftY = Math.cos(time * 0.3) * 8;

      ctx.save();
      ctx.translate(driftX, driftY);

      // Randomly spawn data stream pulses between adjacent nodes
      if (Math.random() < 0.12 && nodes.length > 2) {
        const i = Math.floor(Math.random() * nodes.length);
        const j = Math.floor(Math.random() * nodes.length);
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (i !== j && Math.sqrt(dx * dx + dy * dy) < 160) {
          pulses.push({
            fromIdx: i,
            toIdx: j,
            progress: 0,
            speed: 0.025 + Math.random() * 0.02,
            color: loginStep !== 'idle' ? '#10b981' : (Math.random() > 0.5 ? '#38bdf8' : '#10b981')
          });
        }
      }

      // Draw connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = loginStep !== 'idle' ? 175 : 145;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (loginStep !== 'idle' ? 0.5 : 0.25);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = loginStep !== 'idle' ? `rgba(16, 185, 129, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = loginStep !== 'idle' ? 1.2 : 0.8;
            ctx.stroke();
          }
        }

        // Connect to cursor
        const mdx = nodes[i].x - mouseX;
        const mdy = nodes[i].y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 190) {
          const mAlpha = (1 - mdist / 190) * 0.55;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(16, 185, 129, ${mAlpha})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // Draw active data stream pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed * (loginStep !== 'idle' ? 2.2 : 1.0);
        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }
        const n1 = nodes[pulse.fromIdx];
        const n2 = nodes[pulse.toIdx];
        if (!n1 || !n2) continue;

        const px = n1.x + (n2.x - n1.x) * pulse.progress;
        const py = n1.y + (n2.y - n1.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * (loginStep !== 'idle' ? 2.5 : 1.0);
        n.y += n.vy * (loginStep !== 'idle' ? 2.5 : 1.0);
        n.pulse += 0.04;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        let color = '#38bdf8';
        if (n.category === 'scholar') color = '#10b981';
        if (n.category === 'crossref') color = '#a855f7';
        if (n.category === 'scimago') color = '#f59e0b';

        if (loginStep !== 'idle') color = '#10b981';

        const currentRadius = n.radius + Math.sin(n.pulse) * 0.7;

        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = color + '25';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (n.label) {
          ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
          ctx.fillText(n.label, n.x + 10, n.y + 4);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loginStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError(true);
      return;
    }
    const userData = { name: fullName.trim(), role };

    // Sequential premium login sequence
    setLoginStep('authenticating');
    setTimeout(() => {
      setLoginStep('loading');
      setTimeout(() => {
        setLoginStep('success');
        setTimeout(() => {
          localStorage.setItem('research-user', JSON.stringify(userData));
          onLogin(userData);
        }, 600);
      }, 750);
    }, 700);
  };

  const handleGuestLogin = () => {
    const userData = { name: 'Guest Researcher', role: 'Guest' };
    setLoginStep('authenticating');
    setTimeout(() => {
      setLoginStep('loading');
      setTimeout(() => {
        localStorage.setItem('research-user', JSON.stringify(userData));
        onLogin(userData);
      }, 650);
    }, 550);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col lg:flex-row select-none overflow-x-hidden font-sans relative">
      
      {/* Subtle Animated Aurora Layer Behind Everything */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-emerald-500/10 blur-[140px] animate-pulse duration-[12000ms]"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-600/10 blur-[140px] animate-pulse duration-[10000ms]"></div>
      </div>

      {/* ========================================================
          LEFT PANEL (40% Desktop): Premium Glass Onboarding
          ======================================================== */}
      <div className="w-full lg:w-[42%] xl:w-[38%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-20 border-b lg:border-b-0 lg:border-r border-slate-800/80">
        
        {/* Top Header Navigation Bar */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-primary/25 border border-primary/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-none">
                MSRIT Research
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mt-1 block">
                Enterprise Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Gateway Active</span>
          </div>
        </div>

        {/* Main Floating Glass Card with Animated Gradient Border */}
        <div className="my-auto py-8 sm:py-10 relative z-10 max-w-md mx-auto w-full">
          
          {/* Outer traveling animated border wrapper */}
          <div className="relative p-[1.5px] rounded-[32px] overflow-hidden group shadow-[0_0_60px_rgba(12,239,163,0.08),0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-300">
            
            {/* Travelling gradient ring */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,#10b981_330deg,#38bdf8_360deg)] animate-[spin_9s_linear_infinite] opacity-75"></div>
            
            {/* Inner Translucent Dark Glass */}
            <div className="relative rounded-[31px] backdrop-blur-[22px] bg-slate-900/85 border border-white/10 p-7 sm:p-9 overflow-hidden">
              
              {/* Top soft inner gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-500 opacity-90"></div>

              {/* Dynamic Time of Day Greeting Header */}
              <div className="mb-7">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-emerald-400 mb-3 shadow-inner">
                  <span>{greeting.icon}</span>
                  <span>{greeting.text}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  Welcome to <br />
                  <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    MSRIT Research Portal
                  </span>
                </h1>
              </div>

              {/* Onboarding Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Academic Name Field */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Academic Name
                  </label>
                  <div className="relative group/input">
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${
                      fullName.trim() ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-400 group-focus-within/input:text-primary'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      disabled={loginStep !== 'idle'}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (error) setError(false);
                      }}
                      placeholder=""
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/90 border transition-all duration-200 focus:-translate-y-0.5 focus:shadow-[0_8px_25px_-5px_rgba(56,189,248,0.25)] ${
                        error 
                          ? 'border-red-500/80 focus:ring-red-500/30' 
                          : 'border-slate-800 focus:border-primary focus:ring-primary/20'
                      } text-sm text-slate-100 focus:outline-none focus:ring-4`}
                    />
                  </div>
                  {error && (
                    <p className="text-[11px] text-red-400 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                      Please enter your name to unlock the research workspace.
                    </p>
                  )}
                </div>

                {/* Role Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Institutional Role
                  </label>
                  <div className="relative group/select">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/select:text-primary transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <select
                      disabled={loginStep !== 'idle'}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-sm text-slate-200 focus:border-primary focus:-translate-y-0.5 focus:shadow-[0_8px_25px_-5px_rgba(56,189,248,0.25)] focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Student" className="bg-slate-900 text-slate-200">Student</option>
                      <option value="Faculty" className="bg-slate-900 text-slate-200">Faculty</option>
                      <option value="Research Scholar" className="bg-slate-900 text-slate-200">Research Scholar</option>
                      <option value="Guest" className="bg-slate-900 text-slate-200">Guest</option>
                    </select>
                  </div>
                </div>

                {/* Primary Submit Button with Sequential Progression */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginStep !== 'idle'}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden shadow-lg ${
                      loginStep === 'idle'
                        ? 'bg-gradient-to-r from-primary via-blue-600 to-emerald-600 hover:opacity-95 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] active:scale-[0.99] cursor-pointer'
                        : 'bg-emerald-600/90 shadow-[0_0_35px_rgba(16,185,129,0.6)] cursor-wait'
                    }`}
                  >
                    {loginStep === 'idle' && (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                    {loginStep === 'authenticating' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Authenticating...</span>
                      </>
                    )}
                    {loginStep === 'loading' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Loading Research Workspace...</span>
                      </>
                    )}
                    {loginStep === 'success' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Authentication Verified</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Secondary Guest Login */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  disabled={loginStep !== 'idle'}
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  Continue as Guest Researcher →
                </button>
              </div>

              {/* Rotating Inspirational Quote Box */}
              <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-start gap-2.5 text-slate-400">
                <Quote className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 opacity-80" />
                <p className="text-[11px] italic leading-relaxed font-normal text-slate-300">
                  "{QUOTES[quoteIndex]}"
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Verified Institutional Gateway</span>
          </div>
          <span>© {new Date().getFullYear()} Dept. of CSE</span>
        </div>

      </div>

      {/* ========================================================
          RIGHT PANEL (60% Desktop): Live Constellation & Metrics
          ======================================================== */}
      <div className="flex-1 w-full lg:w-[58%] xl:w-[62%] min-h-[440px] lg:min-h-screen relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        
        {/* Live HTML5 Interactive Knowledge Graph Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair z-10"
        />

        {/* Top Floating Live Metric Cards */}
        <div className="relative z-20 grid grid-cols-2 sm:grid-cols-4 gap-3 pointer-events-none">
          <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 shadow-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Researchers Online</div>
              <div className="text-sm font-black text-white">{researchersOnline}</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 shadow-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Queries</div>
              <div className="text-sm font-black text-white">{todaysQueries.toLocaleString()}</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 shadow-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indexed Pubs</div>
              <div className="text-sm font-black text-white">41,238</div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 shadow-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Latency</div>
              <div className="text-sm font-black text-emerald-400">38 ms</div>
            </div>
          </div>
        </div>

        {/* Center Floating Academic Publisher Badges */}
        <div className="relative z-20 my-auto flex flex-col items-center justify-center pointer-events-none py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-slate-900/80 border border-slate-700/80 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <Globe className="w-4 h-4 text-primary animate-spin duration-[8000ms]" />
            <span className="text-xs font-bold text-slate-300">Live Indexing Stream:</span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              {BADGES[activeBadgeIndex]}
            </span>
          </div>
        </div>

        {/* Bottom Gateway Status & Database Sync Pill */}
        <div className="relative z-20 backdrop-blur-xl bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
              <Wifi className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Gateway: Online</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-bold text-emerald-400">Database: Synced</span>
              </div>
              <p className="text-[11px] text-slate-400">Real-time data stream pulsing across 15 institutional nodes.</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-slate-800/90 text-[10px] font-bold text-slate-300 shrink-0 border border-slate-700 shadow-inner">
            60 FPS Engine • Active
          </div>
        </div>

      </div>

    </div>
  );
};
