import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Menu, X,
  Check, Play,
  MessageCircle, BarChart3, FileText, 
  Calculator, Search,
  TrendingUp, Clock, Database, Mail,
  Calendar, Sparkles, Mic,
  Upload, RefreshCw, CheckCircle2,
  Layers, Send, Bot
} from 'lucide-react';

const suggestions = [
  'Analyze my sales data',
  'Summarize weekly reports', 
  'Automate email follow-ups',
  'Calculate quarterly forecasts',
];

// Agent types with animated demos showing full flow
const agentTypes = [
  {
    id: 'analytics',
    category: 'Data Analysis',
    icon: BarChart3,
    title: 'Turn data into insights',
    description: 'Upload spreadsheets or connect your database. The agent analyzes trends, creates visualizations, and delivers actionable reports on schedule.',
    capabilities: ['SQL queries', 'Trend detection', 'Scheduled reports', 'Visual dashboards'],
    metric: '4hrs',
    metricLabel: 'saved daily',
    demo: 'data-analysis'
  },
  {
    id: 'documents',
    category: 'Document Intelligence',
    icon: FileText,
    title: 'Process documents automatically',
    description: 'Upload contracts, reports, or any document. The agent extracts key information, summarizes content, and organizes everything in your knowledge base.',
    capabilities: ['Data extraction', 'Smart summarization', 'Key insights', 'Knowledge base'],
    metric: '92%',
    metricLabel: 'accuracy rate',
    demo: 'documents'
  },
  {
    id: 'workflow',
    category: 'Workflow Automation',
    icon: Database,
    title: 'Connect your tools',
    description: 'Build multi-step automations that trigger across platforms. Qualify leads, update CRMs, send notifications — all without writing code.',
    capabilities: ['Multi-step flows', 'Conditional logic', 'Error handling', 'Real-time sync'],
    metric: '50+',
    metricLabel: 'hours saved/week',
    demo: 'workflow'
  },
  {
    id: 'finance',
    category: 'Calculations & Forecasting',
    icon: Calculator,
    title: 'Run complex calculations',
    description: 'Build financial models, forecast trends, track budgets, and monitor variances. Get alerts when numbers need attention.',
    capabilities: ['Financial modeling', 'Forecasting', 'Budget tracking', 'Smart alerts'],
    metric: '$2.4M',
    metricLabel: 'tracked monthly',
    demo: 'finance'
  },
  {
    id: 'research',
    category: 'Research & Monitoring',
    icon: Search,
    title: 'Stay informed automatically',
    description: 'Monitor news, competitors, and industry trends. Get curated briefings delivered to your inbox every morning.',
    capabilities: ['Source monitoring', 'Competitor tracking', 'Daily briefings', 'Alert triggers'],
    metric: '200+',
    metricLabel: 'sources tracked',
    demo: 'research'
  },
  {
    id: 'support',
    category: 'Customer Experience',
    icon: MessageCircle,
    title: 'Handle support at scale',
    description: 'Resolve customer inquiries instantly. Access order history, process returns, and escalate complex issues to your team.',
    capabilities: ['Multi-channel', 'Order tracking', 'Returns processing', 'Smart escalation'],
    metric: '89%',
    metricLabel: 'auto-resolved',
    demo: 'support'
  },
];

const testimonials = [
  { 
    name: 'Sarah Chen', 
    role: 'CEO', 
    company: 'Notion', 
    quote: 'Relay transformed our customer support. Response time went from hours to seconds.',
    metric: '89%',
    metricLabel: 'faster responses',
    avatar: 'SC' 
  },
  { 
    name: 'Marcus Johnson', 
    role: 'Head of Sales', 
    company: 'Stripe', 
    quote: 'Our sales team focuses on closing deals while Relay qualifies leads automatically.',
    metric: '3x',
    metricLabel: 'more qualified leads',
    avatar: 'MJ' 
  },
  { 
    name: 'Emily Rodriguez', 
    role: 'Founder', 
    company: 'Lumen', 
    quote: 'As a solo founder, Relay is like having a team of assistants working 24/7.',
    metric: '40hrs',
    metricLabel: 'saved weekly',
    avatar: 'ER' 
  },
];

// Stock line chart component
const StockChart = ({ animated }: { animated: boolean }) => {
  const points = [30, 35, 32, 45, 42, 55, 52, 68, 65, 78, 75, 88, 85, 95];
  const width = 280;
  const height = 80;
  const padding = 10;
  
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  
  const getX = (i: number) => padding + (i / (points.length - 1)) * (width - padding * 2);
  const getY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`).join(' ');
  const areaD = `${pathD} L ${getX(points.length - 1)} ${height} L ${getX(0)} ${height} Z`;
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <path d={areaD} fill="url(#chartGradient)" />
      
      <path 
        d={pathD} 
        fill="none" 
        stroke="var(--accent)" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 500,
          strokeDashoffset: animated ? 0 : 500,
          transition: 'stroke-dashoffset 0.8s ease-out'
        }}
      />
      
      <circle cx={getX(points.length - 1)} cy={getY(points[points.length - 1])} r="5" fill="var(--accent)" />
      
      <g transform={`translate(${getX(points.length - 1) + 8}, ${getY(points[points.length - 1]) - 8})`}>
        <path d="M0 8 L8 0 L16 8" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 0 L8 16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// Hero demo - plays ONCE then stays at results
const HeroDemo = () => {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  
  useEffect(() => {
    if (finished) return;
    
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= 4) {
          setFinished(true);
          clearInterval(interval);
          return 4;
        }
        return s + 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [finished]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="bg-[var(--bg-subtle)] px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-medium text-[var(--text)]">Sales Analytics Agent</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <span className="text-[13px] text-[var(--text-tertiary)]">Live</span>
        </div>
      </div>
      
      <div className="flex-1 p-5 space-y-4 overflow-hidden">
        {/* Query input - always visible */}
        <div className="animate-in slide-in-from-top-2">
          <div className="bg-[var(--bg-subtle)] rounded-xl p-3 flex items-center gap-2">
            <span className="text-[var(--accent)]">$</span>
            <span className="text-[13px] text-[var(--text)]">Analyze last week&apos;s sales</span>
          </div>
        </div>

        {/* Processing */}
        {step >= 1 && step < 3 && (
          <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="h-8 w-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-[var(--accent)] animate-spin" />
            </div>
            <span className="text-[13px] text-[var(--text-secondary)]">Analyzing...</span>
          </div>
        )}

        {/* Results with stock chart */}
        {step >= 3 && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-secondary)]">Weekly Revenue</span>
              <span className="text-[12px] text-[var(--accent)] flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" /> +23%
              </span>
            </div>
            
            <div className="bg-white rounded-xl p-3 border border-[var(--border)]">
              <StockChart animated={step >= 3} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5 text-center">
                <p className="text-[13px] font-medium text-[var(--text)]">$84.2K</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Revenue</p>
              </div>
              <div className="bg-[var(--accent-light)] rounded-lg p-2.5 text-center">
                <p className="text-[13px] font-medium text-[var(--accent)]">+23%</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Growth</p>
              </div>
              <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5 text-center">
                <p className="text-[13px] font-medium text-[var(--text)]">1,247</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Orders</p>
              </div>
            </div>

            <div className="bg-[var(--accent-light)] rounded-xl p-3 border border-[var(--accent)]/20">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Weekend sales up 34%. Peak at 2-4pm. Recommend increasing weekend ad spend.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with schedule */}
      <div className="px-5 py-3 border-t border-[var(--border)] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[12px] text-[var(--text-secondary)]">Auto-report every Monday 9am</span>
          </div>
          <div className="h-5 w-5 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-[var(--accent)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Animated demo components for agent types
const DataAnalysisDemo = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className={`bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3 transition-all duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center transition-all duration-500 ${step === 0 ? 'animate-pulse' : ''}`}>
              <Upload className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">sales_data_q4.csv</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">2.4 MB</p>
            </div>
            {step >= 1 && (
              <div className="h-6 w-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              </div>
            )}
          </div>
          {step === 0 && (
            <div className="mt-3 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full animate-[loading_2s_ease-out_forwards]" />
            </div>
          )}
        </div>

        {step >= 1 && step < 3 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                <RefreshCw className={`h-5 w-5 text-[var(--accent)] ${step === 1 ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">Analyzing data...</p>
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[12px] font-medium">Analysis complete</span>
            </div>
            <div className="flex items-end gap-1 h-16 mb-3">
              {[65, 82, 78, 95, 88].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-[var(--accent)] rounded-t transition-all duration-500"
                    style={{ height: `${v}%`, transitionDelay: `${i * 100}ms` }}
                  />
                </div>
              ))}
            </div>
            <div className="bg-[var(--bg-subtle)] rounded-lg p-3">
              <p className="text-[11px] text-[var(--text-secondary)]">Revenue up <span className="text-[var(--accent)] font-medium">+23%</span> this week.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentDemo = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className={`bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3 transition-all duration-500`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">Q4_Contract.pdf</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">12 pages</p>
            </div>
            {step >= 1 && (
              <div className="h-6 w-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              </div>
            )}
          </div>
        </div>

        {step >= 1 && step < 3 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                <Sparkles className={`h-5 w-5 text-[var(--accent)] ${step === 1 ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">Extracting insights...</p>
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[12px] font-medium">Processing complete</span>
            </div>
            <div className="space-y-2">
              <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5 flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-[var(--text)] text-white flex items-center justify-center text-[10px] flex-shrink-0">!</span>
                <p className="text-[11px] text-[var(--text-secondary)]">3 clauses require legal review</p>
              </div>
              <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5 flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-[var(--text)] text-white flex items-center justify-center text-[10px] flex-shrink-0">$</span>
                <p className="text-[11px] text-[var(--text-secondary)]">Payment terms: Net 30, $50K limit</p>
              </div>
              <div className="bg-[var(--accent-light)] rounded-lg p-2.5 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                <p className="text-[11px] text-[var(--text-secondary)]">Auto-renewal clause detected</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WorkflowDemo = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 6);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { name: 'New lead', icon: Mail, status: 'complete' },
    { name: 'Enrich data', icon: Database, status: 'complete' },
    { name: 'Qualify', icon: Sparkles, status: step >= 2 ? (step >= 3 ? 'complete' : 'running') : 'pending' },
    { name: 'Assign rep', icon: Calendar, status: step >= 4 ? 'complete' : 'pending' },
  ];

  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        {step >= 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center">
                <Mail className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">New lead: john@acme.com</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Source: Website form</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4">
          <p className="text-[12px] font-medium mb-4">Lead qualification workflow</p>
          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                  s.status === 'complete' ? 'bg-[var(--accent-light)] text-[var(--accent)]' :
                  s.status === 'running' ? 'bg-[var(--accent-light)] text-[var(--accent)] animate-pulse' :
                  'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'
                }`}>
                  {s.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-[12px] transition-all duration-500 ${
                  s.status === 'complete' ? 'text-[var(--text)]' :
                  s.status === 'running' ? 'text-[var(--accent)]' :
                  'text-[var(--text-tertiary)]'
                }`}>{s.name}</span>
                {s.status === 'running' && (
                  <div className="ml-auto flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-[var(--accent)] animate-bounce" />
                    <span className="h-1 w-1 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1 w-1 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {step >= 5 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mt-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[12px] font-medium">Qualified & assigned</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Lead score: 87/100 → Assigned to Sarah</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FinanceDemo = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <span className="text-[var(--accent)]">$</span>
            <span className="font-mono">Forecast Q2 revenue</span>
          </div>
        </div>

        {step >= 1 && step < 3 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                <Calculator className={`h-5 w-5 text-[var(--accent)] ${step === 1 ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">Running calculations...</p>
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[12px] font-medium">Forecast complete</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-subtle)] rounded-lg">
                <span className="text-[11px] text-[var(--text-secondary)]">Q2 Revenue (proj)</span>
                <span className="text-[13px] font-medium text-[var(--accent)]">$1.4M <span className="text-[10px]">+17%</span></span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-subtle)] rounded-lg">
                <span className="text-[11px] text-[var(--text-secondary)]">Confidence</span>
                <span className="text-[13px] font-medium">87%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-subtle)] rounded-lg">
                <span className="text-[11px] text-[var(--text-secondary)]">Risk factors</span>
                <span className="text-[11px] text-[var(--text)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--border)]">2 identified</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResearchDemo = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  const sources = ['TechCrunch', 'Reuters', 'Industry Blogs', 'Competitor Sites'];

  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[12px] font-medium">Monitoring {sources.length} sources</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sources.map((source, i) => (
              <span key={source} className={`text-[10px] px-2 py-1 rounded-full transition-all duration-500 ${
                step >= i ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'
              }`}>
                {source}
              </span>
            ))}
          </div>
        </div>

        {step >= 2 && step < 4 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 mb-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                <RefreshCw className={`h-5 w-5 text-[var(--accent)] ${step === 2 ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">Scanning for updates...</p>
              </div>
            </div>
          </div>
        )}

        {step >= 4 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[12px] font-medium mb-1">Competitor update detected</p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Competitor X launched new AI feature. Market reaction positive. Stock up 5%.
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-2">Just now • Reuters</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SupportDemo = () => {
  const [messages, setMessages] = useState<{type: string; text: string; action?: string}[]>([]);
  const [typing, setTyping] = useState(false);
  
  const fullConversation = [
    { type: 'user', text: 'My order #12345 hasn\'t arrived yet' },
    { type: 'agent', text: 'Let me check that for you. I see it was delayed in Memphis hub.', action: 'Tracking pulled' },
    { type: 'agent', text: 'I\'ve expedited a replacement with overnight shipping. New tracking: FX-9921.', action: 'Replacement created' },
  ];

  useEffect(() => {
    let msgIndex = 0;
    const runConversation = () => {
      if (msgIndex < fullConversation.length) {
        if (fullConversation[msgIndex].type === 'agent') {
          setTyping(true);
          setTimeout(() => {
            setTyping(false);
            setMessages(prev => [...prev, fullConversation[msgIndex]]);
            msgIndex++;
          }, 800);
        } else {
          setMessages(prev => [...prev, fullConversation[msgIndex]]);
          msgIndex++;
          setTimeout(() => runConversation(), 400);
        }
      } else {
        setTimeout(() => {
          setMessages([]);
          msgIndex = 0;
          runConversation();
        }, 2000);
      }
    };
    
    runConversation();
    return () => {};
  }, []);

  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden">
        <div className="bg-[var(--bg-subtle)] px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-medium">Support Agent</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] text-[var(--text-tertiary)]">Online</span>
          </div>
        </div>

        <div className="p-4 space-y-3 min-h-[160px] max-h-[200px] overflow-hidden">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              {msg.type === 'agent' && (
                <div className="h-7 w-7 rounded-full bg-[var(--text)] flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.type === 'user' ? 'bg-[var(--text)] text-white rounded-2xl rounded-br-md' : 'bg-white border border-[var(--border)] text-[var(--text)] rounded-2xl rounded-bl-md'} px-3 py-2 text-[12px]`}>
                <p>{msg.text}</p>
                {msg.action && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--accent)]">
                    <CheckCircle2 className="h-3 w-3" />
                    {msg.action}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="h-7 w-7 rounded-full bg-[var(--text)] flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-white border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-2.5 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AgentDemo = ({ type }: { type: string }) => {
  switch (type) {
    case 'data-analysis': return <DataAnalysisDemo />;
    case 'documents': return <DocumentDemo />;
    case 'workflow': return <WorkflowDemo />;
    case 'finance': return <FinanceDemo />;
    case 'research': return <ResearchDemo />;
    case 'support': return <SupportDemo />;
    default: return null;
  }
};

// Scroll reveal component
const ScrollReveal = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15, rootMargin: '-30px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function HomePage() {
  const [input, setInput] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);

  return (
    <div className="min-h-screen">
      {/* Navigation - Minimal, no logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between">
            {/* Just Relay text */}
            <Link to="/" className="text-[18px] font-medium">
              Relay
            </Link>

            {/* Right side - nav + actions */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#agents" className="px-4 py-2 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Agents</a>
              <a href="#how-it-works" className="px-4 py-2 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">How it works</a>
              <a href="#pricing" className="px-4 py-2 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Pricing</a>
              <div className="w-px h-5 bg-[var(--border)] mx-2" />
              <Link to="/login" className="px-4 py-2 text-[15px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">Log in</Link>
              <Link to="/signup" className="px-4 py-2 text-[15px] font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors">Get started</Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden pt-16">
          <div className="flex flex-col p-6 gap-2">
            <a href="#agents" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-lg rounded-xl hover:bg-[var(--bg-subtle)]">Agents</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-lg rounded-xl hover:bg-[var(--bg-subtle)]">How it works</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-lg rounded-xl hover:bg-[var(--bg-subtle)]">Pricing</a>
            <div className="pt-4 mt-2 border-t flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-subtle)]">Log in</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-center font-medium bg-[var(--text)] text-white rounded-full">Get started</Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="min-h-screen pt-16 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent)]/[0.03] rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
        
        <div className="container-site relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-4rem)] py-12 lg:py-20">
            {/* Left: Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/20 px-1 py-1 pr-4 mb-6">
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] text-white font-medium">
                  <Mic className="h-3 w-3" />
                  New
                </span>
                <span className="text-[13px] text-[var(--accent)]">Build agents with voice commands</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-medium leading-[1.05] text-[var(--text)] mb-6 tracking-tight">
                Build AI agents that work for you
              </h1>

              <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed max-w-md">
                Create intelligent agents for data analysis, document processing, workflow automation, and more. Just describe what you need.
              </p>

              {/* Input with mic button */}
              <div className="mb-6 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What do you want your agent to do?"
                  className="w-full min-h-[120px] rounded-3xl border border-[var(--border)] bg-white p-5 pr-28 text-[15px] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none resize-none transition-all shadow-sm"
                  rows={3}
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button className="p-2.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-full transition-all" title="Voice input">
                    <Mic className="h-5 w-5" />
                  </button>
                  <button className="p-2.5 bg-[var(--text)] text-white hover:bg-[var(--text-secondary)] rounded-full transition-colors">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mb-8">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="inline-flex items-center rounded-full px-4 py-2 text-[14px] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 text-[13px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[var(--accent)]" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[var(--accent)]" />
                  Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[var(--accent)]" />
                  Setup in 5 min
                </span>
              </div>
            </div>

            {/* Right: Animated Demo */}
            <div className="relative">
              <div className="bg-white rounded-[32px] shadow-2xl shadow-black/5 border border-[var(--border)] overflow-hidden h-[480px]">
                <HeroDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Types - Interactive */}
      <section id="agents" className="py-24 lg:py-32 bg-[var(--bg-subtle)]">
        <div className="container-wide">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--text-secondary)] mb-4">
              Agent types
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[var(--text)] mb-4 tracking-tight">
              One platform, endless possibilities
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Build specialized agents for any use case. See them in action below.
            </p>
          </ScrollReveal>

          {/* Agent selector tabs */}
          <ScrollReveal delay={100} className="mb-12">
            <div className="flex flex-wrap justify-center gap-2">
              {agentTypes.map((agent, i) => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgent(i)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-[14px] font-medium transition-all ${
                    i === activeAgent 
                      ? 'bg-[var(--text)] text-white shadow-lg' 
                      : 'bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text)]/30 hover:text-[var(--text)]'
                  }`}
                >
                  <agent.icon className="h-4 w-4" />
                  {agent.category}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Active agent showcase */}
          <ScrollReveal delay={200}>
            <div className="max-w-5xl mx-auto">
              <div className="rounded-[32px] bg-white border border-[var(--border)] overflow-hidden shadow-xl shadow-black/5">
                <div className="grid lg:grid-cols-2">
                  {/* Left: Info */}
                  <div className="p-8 lg:p-12">
                    <h3 className="text-2xl lg:text-3xl font-medium text-[var(--text)] mb-4 tracking-tight">
                      {agentTypes[activeAgent].title}
                    </h3>
                    <p className="text-[16px] text-[var(--text-secondary)] mb-8 leading-relaxed">
                      {agentTypes[activeAgent].description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-10">
                      {agentTypes[activeAgent].capabilities.map((cap) => (
                        <span key={cap} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[13px] text-[var(--text-secondary)]">
                          <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                          {cap}
                        </span>
                      ))}
                    </div>
                    
                    <div className="inline-flex items-center gap-6 p-5 bg-[var(--bg-subtle)] rounded-2xl">
                      <div>
                        <p className="text-4xl font-semibold text-[var(--text)]">{agentTypes[activeAgent].metric}</p>
                        <p className="text-[14px] text-[var(--text-tertiary)] mt-1">{agentTypes[activeAgent].metricLabel}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Live demo */}
                  <div className="bg-[var(--bg-subtle)] p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-[var(--border)]">
                    <div className="h-[320px]">
                      <AgentDemo type={agentTypes[activeAgent].demo} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works - Vertical step-by-step with animated connection */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white overflow-hidden">
        <div className="container-site">
          <ScrollReveal className="text-center mb-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[13px] text-[var(--text-secondary)] mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[var(--text)] mb-4 tracking-tight">
              From idea to deployment
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              No coding required. Just describe what you need.
            </p>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[27px] top-14 bottom-14 w-0.5 bg-[var(--border)]" />
              
              <div className="space-y-12">
                {[
                  { 
                    num: '1', 
                    title: 'Describe what you need', 
                    desc: 'Tell us what you want in plain English. Our AI understands context and requirements.',
                    icon: MessageCircle,
                    visual: (
                      <div className="mt-4 bg-[var(--bg-subtle)] rounded-xl p-4 border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[14px]">
                          <span className="text-[var(--accent)] font-mono">$</span>
                          <span className="text-[var(--text)]">Analyze my sales data every Monday and email me the report</span>
                        </div>
                      </div>
                    )
                  },
                  { 
                    num: '2', 
                    title: 'Connect your tools', 
                    desc: 'Link your database, CRM, or any app with one-click integrations. We handle the technical setup.',
                    icon: Layers,
                    visual: (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Salesforce', 'Slack', 'Gmail', 'Notion'].map((tool) => (
                          <span key={tool} className="px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-full text-[12px] text-[var(--text-secondary)]">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )
                  },
                  { 
                    num: '3', 
                    title: 'Deploy in seconds', 
                    desc: 'Your agent goes live instantly. Track performance, review outputs, and refine as needed.',
                    icon: Send,
                    visual: (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[14px] text-[var(--text)]">Agent deployed successfully</span>
                      </div>
                    )
                  },
                ].map((step, i) => (
                  <ScrollReveal key={step.title} delay={i * 150}>
                    <div className="flex gap-6 items-start">
                      {/* Step indicator */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="h-14 w-14 rounded-full bg-[var(--text)] text-white flex items-center justify-center text-[18px] font-medium shadow-lg">
                          <step.icon className="h-6 w-6" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-medium">
                          {step.num}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <h3 className="text-xl font-medium text-[var(--text)] mb-2">{step.title}</h3>
                        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                          {step.desc}
                        </p>
                        {step.visual}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32 bg-[var(--bg-subtle)]">
        <div className="container-site">
          <ScrollReveal className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--text-secondary)] mb-4">
              Customer stories
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[var(--text)] mb-4 tracking-tight">
              Loved by teams everywhere
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="group bg-white rounded-[28px] p-8 border border-[var(--border)] hover:shadow-xl hover:shadow-black/5 transition-all duration-300 h-full flex flex-col">
                  <p className="text-[18px] text-[var(--text)] mb-8 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  
                  <div className="flex items-center gap-3 mb-6 p-4 bg-[var(--bg-subtle)] rounded-2xl">
                    <div className="h-12 w-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[16px] font-medium">
                      {t.metric}
                    </div>
                    <p className="text-[14px] text-[var(--text-secondary)]">{t.metricLabel}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[14px] font-medium text-[var(--text)]">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[var(--text)]">{t.name}</p>
                      <p className="text-[13px] text-[var(--text-tertiary)]">{t.role}, {t.company}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32 bg-white">
        <div className="container-site">
          <ScrollReveal className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-light)] px-4 py-2 text-[13px] text-[var(--accent)] mb-4">
              Simple pricing
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[var(--text)] mb-4 tracking-tight">
              Start free, scale as you grow
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              No hidden fees. Cancel anytime.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Free', price: '$0', desc: 'For individuals', features: ['1 agent', '100 tasks/mo', 'Basic integrations', 'Email support'], cta: 'Get started', highlight: false },
              { name: 'Pro', price: '$29', desc: 'For professionals', features: ['5 agents', 'Unlimited tasks', 'All integrations', 'Priority support'], cta: 'Start free trial', highlight: true },
              { name: 'Team', price: '$79', desc: 'For teams', features: ['20 agents', 'Team collaboration', 'SSO & SAML', 'Dedicated support'], cta: 'Contact sales', highlight: false },
            ].map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 100}>
                <div className={`rounded-[28px] p-8 h-full flex flex-col ${plan.highlight ? 'bg-[var(--text)] text-white' : 'bg-[var(--bg-subtle)] border border-[var(--border)]'}`}>
                  {plan.highlight && (
                    <span className="inline-flex items-center rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] text-white mb-5 w-fit">Most popular</span>
                  )}
                  <p className={`text-[14px] mb-2 ${plan.highlight ? 'text-white/60' : 'text-[var(--text-tertiary)]'}`}>{plan.name}</p>
                  <div className="mb-6">
                    <span className={`text-4xl font-semibold ${plan.highlight ? 'text-white' : 'text-[var(--text)]'}`}>{plan.price}</span>
                    <span className={plan.highlight ? 'text-white/50' : 'text-[var(--text-tertiary)]'}>/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-center gap-3 text-[15px] ${plan.highlight ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                        <Check className="h-4 w-4 text-[var(--accent)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup" className={`w-full justify-center rounded-full py-3.5 text-[15px] font-medium transition-all inline-flex ${plan.highlight ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]' : 'bg-[var(--text)] text-white hover:bg-[var(--text-secondary)]'}`}>
                    {plan.cta}
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Unique design with visual elements */}
      <section className="py-24 bg-[var(--bg-subtle)]">
        <div className="container-site">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-[40px] overflow-hidden border border-[var(--border)] shadow-xl shadow-black/5">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative p-12 lg:p-16">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  {/* Left: Visual */}
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-3xl bg-[var(--text)] flex items-center justify-center">
                      <Bot className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Right: Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl md:text-4xl font-medium text-[var(--text)] mb-3 tracking-tight">
                      Start building your first agent
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] mb-8">
                      Join 10,000+ teams automating their work with Relay. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[15px] font-medium bg-[var(--text)] text-white hover:bg-[var(--text-secondary)] transition-colors">
                        Get started for free
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button className="flex items-center justify-center gap-2 text-[var(--text)] hover:text-[var(--accent)] transition-colors px-8 py-4">
                        <Play className="h-5 w-5" />
                        Watch demo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Pitch black */}
      <footer className="py-16 bg-black border-t border-white/10">
        <div className="container-wide">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to="/" className="text-white font-medium text-[18px] mb-4 block">
                Relay
              </Link>
              <p className="text-[15px] text-white/50 max-w-sm leading-relaxed">
                Build AI agents that work for you. Automate tasks, analyze data, and scale your operations.
              </p>
            </div>
            
            <div>
              <p className="text-[14px] font-medium text-white mb-4">Product</p>
              <ul className="space-y-3">
                <li><a href="#agents" className="text-[15px] text-white/50 hover:text-white transition-colors">Agents</a></li>
                <li><a href="#pricing" className="text-[15px] text-white/50 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-[15px] text-white/50 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-[15px] text-white/50 hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <p className="text-[14px] font-medium text-white mb-4">Company</p>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-[15px] text-white/50 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="text-[15px] text-white/50 hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/legal" className="text-[15px] text-white/50 hover:text-white transition-colors">Legal</Link></li>
                <li><a href="#" className="text-[15px] text-white/50 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[14px] text-white/40">© 2026 Relay. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
