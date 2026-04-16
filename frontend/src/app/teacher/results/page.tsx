'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Shield, AlertTriangle, CheckCircle2,
  User, Brain, TrendingDown, Clock, Eye, Filter,
  Download, RefreshCw, Star, Zap, Flag
} from 'lucide-react';
import StudyPlanCard from '@/components/cms/StudyPlanCard';

type TopicPerf = { topic: string; is_correct: boolean; question: string; student_answer: string; correct_answer: string };
type Result = {
  student_name: string;
  student_id: string;
  roll_no: string;
  section: string;
  quiz_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  ai_grade: string;
  topic_performance: TopicPerf[];
  weak_topics: string[];
  study_plan: string[];
  look_away_count: number;
  time_taken_seconds: number;
  ai_integrity_score: number;
  ai_flag: boolean;
  ai_comment: string;
  submitted_at: string;
};

type Summary = {
  total_submissions: number;
  average_score: number;
  flagged_for_review: number;
  completion_rate: string;
};

export default function TeacherResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Result | null>(null);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'passed' | 'failed'>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const generatePlanForStudent = async (studentData: Result) => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/student/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentData.student_id,
          student_name: studentData.student_name,
          weak_topics: studentData.weak_topics,
          look_away_count: studentData.look_away_count,
          score: studentData.score
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.plan) {
         setSelected(prev => prev ? { ...prev, generated_study_plan: data.plan } as any : null);
         fetchResults(); // Refresh background data
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/teacher/results');
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary || null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) {
      alert("No results to export!");
      return;
    }
    const headers = ["Student ID", "Student Name", "Score", "Time Taken (s)", "AI Flag", "Integrity Score", "Submitted At", "Weak Topics"];
    const rows = results.map(r => [
       r.student_id,
       `"${r.student_name}"`, // Quote to handle spaces
       r.score,
       r.time_taken_seconds || 0,
       r.ai_flag ? "Yes" : "No",
       r.ai_integrity_score || "N/A",
       `"${r.submitted_at || ''}"`,
       `"${(r.weak_topics || []).join(', ')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `student_results_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { fetchResults(); }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchResults, 30000);
    return () => clearInterval(t);
  }, []);

  const filtered = results.filter(r => {
    if (filter === 'flagged') return r.ai_flag;
    if (filter === 'passed') return r.score >= 60;
    if (filter === 'failed') return r.score < 60;
    return true;
  });

  const formatTime = (secs: number) => `${Math.floor(secs / 60)}m ${secs % 60}s`;

  return (
    <div className="min-h-screen p-8 custom-scrollbar relative overflow-hidden">
      {/* BG decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-start mb-12 z-10 relative">
        <div>
          <h1 className="text-4xl font-black tracking-tighter neon-text-blue uppercase mb-2">
            Student Submissions
          </h1>
          <p className="text-gray-400 text-sm font-medium" suppressHydrationWarning>
            AI-evaluated forensic assessment results • Last sync: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchResults}
            className="flex items-center gap-2 px-6 py-3 glass-card text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">
            <RefreshCw size={14} /> REFRESH
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-3 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-neon-blue hover:text-black transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <Download size={14} /> EXPORT CSV
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-6 mb-10 z-10 relative">
          {[
            { label: 'Total Submissions', value: summary.total_submissions, icon: User, color: 'text-neon-blue', border: 'border-neon-blue/20' },
            { label: 'Average Score', value: `${summary.average_score}%`, icon: Star, color: 'text-yellow-400', border: 'border-yellow-500/20' },
            { label: 'Flagged by AI', value: summary.flagged_for_review, icon: AlertTriangle, color: 'text-red-400', border: 'border-red-500/20' },
            { label: 'Passed (≥60%)', value: results.filter(r => r.score >= 60).length, icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/20' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 flex items-center gap-5 border-b-4 ${s.border}`}>
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${s.color}`}>
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-3xl font-black">{s.value}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 z-10 relative">
        {(['all', 'flagged', 'passed', 'failed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? 'bg-neon-blue text-black shadow-lg' : 'glass-card text-gray-500 hover:text-white'
            }`}>
            {f} {f !== 'all' && `(${
              f === 'flagged' ? results.filter(r => r.ai_flag).length :
              f === 'passed' ? results.filter(r => r.score >= 60).length :
              results.filter(r => r.score < 60).length
            })`}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div className="glass-card overflow-hidden z-10 relative">
        <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
          <span className="col-span-2">Student</span>
          <span className="col-span-1">Roll / ID</span>
          <span className="col-span-1">Section</span>
          <span className="col-span-1">Score</span>
          <span className="col-span-1">Grade</span>
          <span className="col-span-2">Integrity</span>
          <span className="col-span-2">Weak Topics</span>
          <span className="col-span-1">Time</span>
          <span className="col-span-1">Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 rounded-full border-2 border-neon-blue border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Brain className="text-gray-700 mb-4" size={32} />
            <p className="text-gray-600 font-black uppercase text-[10px] tracking-widest">No submissions yet</p>
            <p className="text-gray-700 text-xs mt-1">Results will appear here when students submit their quiz.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/3 transition-all group">
                  
                  {/* Student name */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-neon-purple/20 flex items-center justify-center text-neon-purple font-black text-xs shrink-0">
                      {r.student_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-black truncate">{r.student_name || 'Unknown'}</span>
                  </div>

                  {/* Roll / ID */}
                  <div className="col-span-1">
                    <p className="text-[10px] font-bold text-gray-400 truncate">{r.roll_no || r.student_id}</p>
                  </div>

                  {/* Section */}
                  <div className="col-span-1">
                    <span className="text-[10px] text-gray-500">{r.section || '—'}</span>
                  </div>

                  {/* Score */}
                  <div className="col-span-1">
                    <span className={`text-sm font-black ${
                      r.score >= 80 ? 'text-green-400' : r.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{r.score}%</span>
                    <p className="text-[8px] text-gray-600">{r.correct_count}/{r.total_questions} correct</p>
                  </div>

                  {/* Grade */}
                  <div className="col-span-1">
                    <span className={`text-xl font-black ${
                      r.ai_grade === 'A' ? 'text-green-400' : r.ai_grade === 'B' ? 'text-yellow-400' :
                      r.ai_grade === 'C' ? 'text-orange-400' : 'text-red-400'
                    }`}>{r.ai_grade}</span>
                  </div>

                  {/* Integrity */}
                  <div className="col-span-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${
                      r.ai_flag ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
                    }`}>
                      {r.ai_flag ? <AlertTriangle size={12} className="text-red-400" /> : <Shield size={12} className="text-green-400" />}
                      <span className={`text-[9px] font-black uppercase ${r.ai_flag ? 'text-red-400' : 'text-green-400'}`}>
                        {r.ai_flag ? `FLAGGED (${r.look_away_count} deviations)` : `CLEAN (${r.look_away_count})`}
                      </span>
                    </div>
                  </div>

                  {/* Weak topics */}
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-1">
                      {(r.weak_topics || []).slice(0, 2).map((t, j) => (
                        <span key={j} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black rounded-full">{t}</span>
                      ))}
                      {(r.weak_topics || []).length === 0 && <span className="text-[9px] text-green-400 font-bold">All mastered</span>}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="col-span-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock size={10} /> {formatTime(r.time_taken_seconds || 0)}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1">
                    <button onClick={() => setSelected(r)}
                      className="px-3 py-2 bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[9px] font-black uppercase rounded-xl hover:bg-neon-blue hover:text-black transition-all">
                      <Eye size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-black/90 backdrop-blur-2xl flex items-start justify-center p-8 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-2xl my-8 border-neon-blue/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-blue via-neon-purple to-transparent" />
              
              <div className="p-10 space-y-8">
                {/* Student Identity */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 flex items-center justify-center text-neon-purple font-black text-2xl">
                      {selected.student_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{selected.student_name}</h2>
                      <p className="text-gray-500 text-xs">{selected.student_id} • {selected.roll_no || 'No Roll'} • {selected.section || 'No Section'}</p>
                      <p className="text-[10px] text-gray-600 mt-1">Submitted: {new Date(selected.submitted_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-5xl font-black ${selected.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>{selected.score}%</p>
                    <p className="text-gray-500 text-xs">{selected.correct_count}/{selected.total_questions} correct • Grade {selected.ai_grade}</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className={`p-6 rounded-2xl border ${selected.ai_flag ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className={selected.ai_flag ? 'text-red-400' : 'text-green-400'} size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Forensic Analysis</span>
                    <span className={`ml-auto text-[9px] font-black px-3 py-1 rounded-full ${selected.ai_flag ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {selected.ai_flag ? '⚠ FLAGGED' : '✓ CLEAN'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{selected.ai_comment}</p>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <p className="text-lg font-black text-neon-blue">{selected.ai_integrity_score}%</p>
                      <p className="text-[8px] text-gray-500 uppercase">AI Integrity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-yellow-400">{selected.look_away_count}</p>
                      <p className="text-[8px] text-gray-500 uppercase">Deviations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-neon-purple">{formatTime(selected.time_taken_seconds || 0)}</p>
                      <p className="text-[8px] text-gray-500 uppercase">Time Taken</p>
                    </div>
                  </div>
                </div>

                {/* Topic Performance */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BarChart3 size={12} className="text-neon-blue" /> Per-Topic Neural Analysis
                  </h4>
                  <div className="space-y-3">
                    {(selected.topic_performance || []).map((tp, i) => (
                      <div key={i} className={`p-4 rounded-2xl border ${tp.is_correct ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider">{tp.topic}</span>
                          <span className={`text-[9px] font-black uppercase ${tp.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                            {tp.is_correct ? '✓ CORRECT' : '✗ INCORRECT'}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500 truncate mb-1">Q: {tp.question}</p>
                        <p className="text-[9px]">Student: <span className={tp.is_correct ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{tp.student_answer}</span></p>
                        {!tp.is_correct && <p className="text-[9px] text-gray-500">Correct: <span className="text-green-400 font-bold">{tp.correct_answer}</span></p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Study Plan */}
                <div>
                  {/* @ts-ignore */}
                  {selected.generated_study_plan ? (
                     <StudyPlanCard 
                       /* @ts-ignore */
                       plan={selected.generated_study_plan} 
                       onRegenerate={() => generatePlanForStudent(selected)}
                       isRegenerating={isGeneratingPlan}
                     />
                  ) : (
                     <div className="p-6 rounded-2xl border border-neon-blue/20 bg-neon-blue/5 text-center">
                        <Zap size={24} className="text-neon-blue mx-auto mb-3" />
                        <h4 className="text-sm font-black uppercase text-neon-blue mb-2">Automated 7-Day Curriculum</h4>
                        <p className="text-[10px] text-gray-400 mb-4">No advanced study plan generated for this submission yet.</p>
                        <button 
                          onClick={() => generatePlanForStudent(selected)}
                          disabled={isGeneratingPlan}
                          className="px-6 py-3 bg-neon-blue text-black font-black text-[10px] uppercase rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)] disabled:opacity-50"
                        >
                          {isGeneratingPlan ? 'GENERATING CURRICULUM...' : 'GENERATE 7-DAY STUDY PLAN'}
                        </button>
                     </div>
                  )}
                </div>

                <button onClick={() => setSelected(null)}
                  className="w-full py-4 glass-card text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all rounded-2xl">
                  CLOSE PROFILE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
