'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Shield, CheckCircle2, Play, Lock, 
  Calendar, Zap, Brain, AlertTriangle, ChevronRight,
  Activity, BarChart3, Star
} from 'lucide-react';

type AssignedQuiz = {
  assignment_id: string;
  quiz_id: string;
  title: string;
  subject: string;
  due_time: string;
  start_time: string;
  duration: number;
  total_marks: number;
  proctoring_mode: 'full' | 'light' | 'disabled';
  instructions: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  attempt_id: string | null;
};

type ConsentState = { open: boolean; quiz: AssignedQuiz | null };

import { useRouter } from 'next/navigation';

export default function MyQuizzesPage() {
  const [tab, setTab] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [quizzes, setQuizzes] = useState<{ active: AssignedQuiz[]; upcoming: AssignedQuiz[]; completed: AssignedQuiz[] }>({
    active: [], upcoming: [], completed: []
  });
  const [consent, setConsent] = useState<ConsentState>({ open: false, quiz: null });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
      router.push('/student/login');
      return;
    }
    
    fetch(`http://localhost:8000/api/student/assigned-quizzes?student_id=${studentId}`)
      .then(r => r.json())
      .then(data => {
        setQuizzes({ active: data.active || [], upcoming: data.upcoming || [], completed: data.completed || [] });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleStartQuiz = (quiz: AssignedQuiz) => {
    if (quiz.proctoring_mode === 'full') {
      setConsent({ open: true, quiz });
    } else {
      window.location.href = `/student/quiz/${quiz.assignment_id}`;
    }
  };

  const confirmAndStart = async () => {
    if (!consent.quiz) return;
    const studentId = localStorage.getItem('student_id') || 'ST_ANON';
    const res = await fetch(`http://localhost:8000/api/student/start-quiz/${consent.quiz.assignment_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    const data = await res.json();
    setConsent({ open: false, quiz: null });
    window.location.href = `/student/quiz/${consent.quiz.assignment_id}`;
  };

  const PROCTORING_BADGE: Record<string, { label: string; color: string }> = {
    full: { label: 'Full Proctoring', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
    light: { label: 'Light Mode', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
    disabled: { label: 'No Proctoring', color: 'text-green-400 border-green-500/30 bg-green-500/5' }
  };

  const currentList = quizzes[tab] || [];

  return (
    <div className="min-h-screen p-8 custom-scrollbar">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter neon-text-purple mb-2 uppercase">
          My Neural Assessments
        </h1>
        <p className="text-gray-400 text-sm font-medium italic">
          Track assigned quizzes, monitor progress, and attend forensic-grade assessments.
        </p>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Active', value: quizzes.active.length, icon: Zap, color: 'text-neon-purple' },
          { label: 'Upcoming', value: quizzes.upcoming.length, icon: Calendar, color: 'text-neon-blue' },
          { label: 'Completed', value: quizzes.completed.length, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Avg Score', value: quizzes.completed.length ? 
              Math.round(quizzes.completed.reduce((s, q) => s + (q.score || 0), 0) / quizzes.completed.length) + '%' 
              : 'N/A', icon: Star, color: 'text-yellow-400' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex items-center gap-6">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 p-1.5 glass-card w-fit rounded-2xl">
        {(['active', 'upcoming', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
              tab === t ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'text-gray-500 hover:text-white'
            }`}>
            {t} ({quizzes[t]?.length || 0})
          </button>
        ))}
      </div>

      {/* Quiz Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
        </div>
      ) : currentList.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-16 text-center border-dashed border-white/10">
          <Brain className="w-16 h-16 text-gray-700 mx-auto mb-6" />
          <p className="text-gray-500 font-black uppercase text-[11px] tracking-[0.3em]">No Neural Assessments Found</p>
          <p className="text-gray-600 text-xs mt-2">Your teacher hasn't assigned any quizzes yet.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {currentList.map((quiz, idx) => {
              const badge = PROCTORING_BADGE[quiz.proctoring_mode] || PROCTORING_BADGE.disabled;
              const isCompleted = quiz.status === 'completed';
              const inProgress = quiz.status === 'in_progress';

              return (
                <motion.div key={quiz.assignment_id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.07 }}
                  className={`glass-card p-8 flex items-center gap-8 hover:border-neon-purple/30 transition-all duration-500 group ${
                    isCompleted ? 'opacity-60' : ''
                  }`}>
                  
                  {/* Status Ring */}
                  <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center border-2 shrink-0 ${
                    isCompleted ? 'bg-green-500/10 border-green-500/30' :
                    inProgress ? 'bg-neon-purple/10 border-neon-purple/30 animate-pulse' : 
                    'bg-white/5 border-white/5'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="text-green-400" size={28} /> :
                     inProgress ? <Activity className="text-neon-purple" size={28} /> :
                     <BarChart3 className="text-gray-500" size={28} />}
                  </div>

                  {/* Quiz Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black tracking-tight group-hover:text-neon-purple transition-colors truncate">{quiz.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-widest shrink-0 ${badge.color}`}>
                        {quiz.proctoring_mode === 'full' && <Shield className="inline w-3 h-3 mr-1" />}
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {quiz.duration} MIN</span>
                      <span className="flex items-center gap-1.5"><Zap size={12} /> {quiz.total_marks} PTS</span>
                      {quiz.due_time && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} /> DUE {new Date(quiz.due_time).toLocaleDateString()}
                        </span>
                      )}
                      {isCompleted && quiz.score !== null && (
                        <span className="text-green-400 flex items-center gap-1.5"><Star size={12} /> SCORE: {quiz.score}%</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <button className="px-6 py-3 glass-card text-[10px] font-black uppercase tracking-widest text-green-400 border-green-500/20">
                        VIEW RESULTS
                      </button>
                    ) : (
                      <button onClick={() => handleStartQuiz(quiz)}
                        className="flex items-center gap-3 px-8 py-4 bg-neon-purple text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-neon-purple/20 group/btn">
                        <Play size={16} className="group-hover/btn:scale-125 transition-all" />
                        {inProgress ? 'RESUME SESSION' : 'START QUIZ'}
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-all" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Webcam Consent Modal */}
      <AnimatePresence>
        {consent.open && consent.quiz && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="glass-card max-w-lg w-full p-12 border-neon-purple/30 relative overflow-hidden">
              
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-purple via-neon-blue to-transparent" />
              
              <Shield className="text-neon-purple mb-6 shrink-0" size={48} />
              <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase neon-text-purple">Forensic Consent</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                <strong className="text-white">"{consent.quiz.title}"</strong> requires full AI proctoring. Your webcam will be used for:
              </p>

              <ul className="space-y-3 mb-10">
                {['Face detection & gaze tracking (Lip-Eye Sync)', 'Tab-switch and focus monitoring', 'Behavioral telemetry archival'].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
                    <p className="text-xs text-gray-300 font-medium">{item}</p>
                  </div>
                ))}
              </ul>

              {consent.quiz.instructions && (
                <div className="p-5 bg-neon-purple/5 border border-neon-purple/20 rounded-2xl mb-8">
                  <p className="text-[10px] text-neon-purple font-black uppercase tracking-widest mb-2">Teacher Instructions</p>
                  <p className="text-xs text-gray-300">{consent.quiz.instructions}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setConsent({ open: false, quiz: null })}
                  className="flex-1 py-4 glass-card text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all">
                  DECLINE
                </button>
                <button onClick={confirmAndStart}
                  className="flex-1 py-4 bg-neon-purple text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-neon-purple/20 hover:scale-[1.02] transition-all">
                  I AGREE — START SESSION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
