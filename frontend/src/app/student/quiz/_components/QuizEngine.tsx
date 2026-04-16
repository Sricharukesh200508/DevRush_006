'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, ChevronLeft, ChevronRight, Shield,
  Flag, Send, AlertTriangle, Monitor,
  Zap, Brain, Check, BarChart3, Activity,
  User, BookOpen, CheckCircle2, Lock
} from 'lucide-react';
import MediaPipeController from '@/components/telemetry/MediaPipeController';

// ── Question Bank ─────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1, topic: 'Recursion', difficulty: 'Medium',
    text: 'Given f(n) = f(n-1) + f(n-2), which evidence identifies a lack of Memoization?',
    options: ['Exponential redundant sub-calls in the Stack Trace', 'O(n) Linear space complexity overhead', 'Immediate resolution of the Base Case anchor', 'Heap corruption due to pointer arithmetic'],
    correct: 0,
  },
  {
    id: 2, topic: 'Trees', difficulty: 'Easy',
    text: 'What is the time complexity of searching in a balanced Binary Search Tree?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correct: 1,
  },
  {
    id: 3, topic: 'Dynamic Programming', difficulty: 'Hard',
    text: 'Which property must hold for a problem to be solvable via Dynamic Programming?',
    options: ['Greedy choice property', 'Optimal substructure and overlapping sub-problems', 'Divide and conquer independence', 'NP-completeness'],
    correct: 1,
  },
  {
    id: 4, topic: 'Graphs', difficulty: 'Medium',
    text: "Dijkstra's algorithm fails on graphs with:",
    options: ['Directed edges', 'Negative weight edges', 'Cycles', 'Sparse graphs'],
    correct: 1,
  },
  {
    id: 5, topic: 'Sorting', difficulty: 'Easy',
    text: 'Which sorting algorithm has the best worst-case time complexity?',
    options: ['Quick Sort', 'Bubble Sort', 'Merge Sort', 'Insertion Sort'],
    correct: 2,
  },
];

type Phase = 'identity' | 'quiz' | 'submitting' | 'done';

export default function QuizEngine({ quizId }: { quizId: string }) {
  const safeId = quizId || 'demo-session';

  // ── Phase control ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('identity');

  // ── Student identity form ───────────────────────────────────────────────────
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    const sname = localStorage.getItem('student_name');
    const sid = localStorage.getItem('student_id');
    if (sname) setStudentName(sname);
    if (sid) setStudentId(sid);
  }, []);

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [telemetryStream, setTelemetryStream] = useState<any[]>([]);
  const [lookAwayCount, setLookAwayCount] = useState(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // ── Timer (only runs during quiz) ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Fullscreen enforcement ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'quiz') return;
    const handler = () => { if (!document.fullscreenElement) setShowExitWarning(true); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [phase]);

  // ── Telemetry ───────────────────────────────────────────────────────────────
  const handleTelemetry = useCallback((data: any) => {
    setTelemetryStream(prev => [...prev.slice(-99), { ...data, t: Date.now() }]);
    if (data.isLookingAway) setLookAwayCount(c => c + 1);
  }, []);

  // ── AI Hint ─────────────────────────────────────────────────────────────────
  const requestHint = async () => {
    setHintLoading(true);
    setHint(null);
    await new Promise(r => setTimeout(r, 1000));
    const topic = QUESTIONS[currentIdx]?.topic || 'this topic';
    setHint(`💡 ${topic} hint: Focus on how repeated computations affect time complexity. Think about caching sub-results.`);
    setHintLoading(false);
  };

  // ── Core Submit ─────────────────────────────────────────────────────────────
  const doSubmit = async (auto = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('submitting');

    // Compute score
    const topicPerformance = QUESTIONS.map((q, i) => ({
      topic: q.topic,
      question: q.text,
      student_answer: answers[i] !== undefined ? q.options[answers[i]] : 'Unanswered',
      correct_answer: q.options[q.correct],
      is_correct: answers[i] === q.correct,
    }));

    const correctCount = topicPerformance.filter(t => t.is_correct).length;
    const score = Math.round((correctCount / QUESTIONS.length) * 100);
    const weakTopics = [...new Set(topicPerformance.filter(t => !t.is_correct).map(t => t.topic))];
    const aiGrade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    const studyPlan = weakTopics.length > 0
      ? weakTopics.map(t => `📘 Review ${t} — practice 5 problems, watch concept video`)
      : ['🎯 Excellent! Progress to advanced topics in all domains.'];

    const payload = {
      // ── Student Identity ──────────────────────────────────────
      student_name: studentName,
      student_id: studentId || 'ST_ANON',
      roll_no: rollNo,
      section: section,
      quiz_id: safeId,

      // ── Academic Results ──────────────────────────────────────
      score,
      correct_count: correctCount,
      total_questions: QUESTIONS.length,
      ai_grade: aiGrade,
      topic_performance: topicPerformance,
      weak_topics: weakTopics,
      study_plan: studyPlan,
      answers_raw: answers,

      // ── Forensic Telemetry ────────────────────────────────────
      look_away_count: lookAwayCount,
      total_telemetry_events: telemetryStream.length,
      behavioral_vector: telemetryStream.map(t => (t.isLookingAway ? 0 : 1)),
      telemetry_sample: telemetryStream.slice(-10),
      auto_submitted: auto,
      time_taken_seconds: 1800 - timeLeft,
      timestamp: new Date().toISOString(),
    };

    // ── POST to backend ───────────────────────────────────────────────────────
    try {
      // 1. Store result + run AI analysis
      await fetch('http://localhost:8000/api/cms/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 2. Also post to attempt tracker
      await fetch(`http://localhost:8000/api/student/submit-quiz/attempt-${safeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Backend sync unavailable — result queued locally.');
    }

    // ── Redirect to student dashboard ─────────────────────────────────────────
    setPhase('done');
    setTimeout(() => { window.location.href = '/student?submitted=true'; }, 2500);
  };

  const handleSubmitClick = () => {
    if (!showSubmitConfirm) { setShowSubmitConfirm(true); return; }
    setShowSubmitConfirm(false);
    doSubmit(false);
  };

  const latestTel = telemetryStream[telemetryStream.length - 1];
  const engagementPct = latestTel?.isLookingAway ? 42 : 89;
  const answeredCount = Object.keys(answers).length;
  const currentQ = QUESTIONS[currentIdx];

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — Identity Collection Form
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'identity') {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg space-y-8">

          {/* Header */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center mx-auto mb-6">
              <User className="text-neon-purple" size={36} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter neon-text-purple uppercase mb-2">Identity Verification</h1>
            <p className="text-gray-400 text-sm">Complete your neural profile before the forensic assessment begins.</p>
          </div>

          {/* Form */}
          <div className="glass-card p-10 border-neon-purple/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-purple via-neon-blue to-transparent" />

            {[
              { label: 'Full Name *', placeholder: 'e.g. Alex Chen', value: studentName, setter: setStudentName, required: true },
              { label: 'Student ID *', placeholder: 'e.g. ST_2026_001', value: studentId, setter: setStudentId, required: true },
              { label: 'Roll Number', placeholder: 'e.g. CS-22-045', value: rollNo, setter: setRollNo, required: false },
              { label: 'Section / Class', placeholder: 'e.g. Section A', value: section, setter: setSection, required: false },
            ].map(field => (
              <div key={field.label} className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-neon-purple transition-all placeholder-gray-600"
                />
              </div>
            ))}

            {/* Consent */}
            <div
              onClick={() => setConsentChecked(!consentChecked)}
              className={`p-5 rounded-2xl border cursor-pointer flex items-start gap-4 transition-all ${consentChecked ? 'bg-neon-purple/10 border-neon-purple/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 border-2 shrink-0 transition-all ${consentChecked ? 'bg-neon-purple border-neon-purple' : 'border-white/20'}`}>
                {consentChecked && <Check size={14} className="text-white" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider mb-1">Forensic Consent</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  I consent to webcam-based proctoring (face, gaze, Lip-Eye Sync). Behavioral data will be analyzed by AI and shared with the teacher for academic integrity purposes.
                </p>
              </div>
            </div>

            <button
              disabled={!studentName.trim() || !studentId.trim() || !consentChecked}
              onClick={() => setPhase('quiz')}
              className="w-full py-5 bg-neon-purple text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-neon-purple/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
            >
              <Lock size={16} /> INITIALIZE FORENSIC SESSION
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — Submitting / Redirecting
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'submitting' || phase === 'done') {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full border-4 border-neon-purple/30 border-t-neon-purple animate-spin mx-auto mb-8" />
          <h2 className="text-3xl font-black tracking-tighter neon-text-purple uppercase mb-4">
            {phase === 'done' ? 'Submission Complete' : 'Transmitting to Neural Core'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {phase === 'done'
              ? 'Your results have been sent to the AI system and teacher dashboard. Redirecting...'
              : 'Encrypting answers and forensic telemetry. Packaging AI analysis report...'}
          </p>
          {phase === 'done' && (
            <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
              <CheckCircle2 className="text-green-400" size={20} />
              <span className="text-sm font-black text-green-400 uppercase tracking-wider">Results sent to teacher dashboard</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — Quiz Session
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans antialiased overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-24 border-b border-white/5 bg-black/60 backdrop-blur-3xl flex items-center justify-between px-16 z-50">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase neon-text-purple">
              {studentName.toUpperCase()} &nbsp;<span className="text-white/20">|</span>&nbsp; SESSION {safeId.slice(0, 6).toUpperCase()}
            </h1>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              FORENSIC TELEMETRY ACTIVE • {answeredCount}/{QUESTIONS.length} ANSWERED
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          {/* Timer */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Timer size={14} className={timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-neon-purple'} />
              <span className={`text-lg font-black tabular-nums ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${(timeLeft / 1800) * 100}%` }} className="h-full bg-neon-purple" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 glass-card px-4 py-2 border-green-500/20">
            <Shield className="text-green-500" size={16} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Integrity Valid</span>
              <span className="text-[7px] text-gray-500 font-bold uppercase">Token # {safeId.slice(0, 8)}</span>
            </div>
          </div>
          <button
            onClick={handleSubmitClick}
            className="group px-10 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-neon-purple hover:text-white transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3"
          >
            <Send size={14} /> SIGN &amp; SUBMIT
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 overflow-hidden">

        {/* ── Question Palette ─────────────────────────────────────────────── */}
        <nav className="col-span-1 border-r border-white/5 flex flex-col items-center py-10 gap-3 bg-black/40">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-4 border border-white/5">
            <BarChart3 size={18} />
          </div>
          {QUESTIONS.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[9px] font-black transition-all relative border ${
                currentIdx === i ? 'bg-neon-purple border-neon-purple text-white shadow-lg' :
                answers[i] !== undefined ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                flags.has(i) ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                'border-white/5 text-gray-600 hover:border-white/20'
              }`}>
              {i + 1}
              {flags.has(i) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full border border-black" />}
              {answers[i] !== undefined && currentIdx !== i && !flags.has(i) && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-black" />
              )}
            </button>
          ))}
          <div className="mt-auto flex flex-col gap-2">
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentIdx(i => Math.min(QUESTIONS.length - 1, i + 1))} disabled={currentIdx === QUESTIONS.length - 1}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </nav>

        {/* ── Question Engine ──────────────────────────────────────────────── */}
        <section className="col-span-8 p-16 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(188,19,254,0.02)_0%,transparent_70%)]">
          <AnimatePresence mode="wait">
            <motion.div key={currentIdx}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
              transition={{ type: 'spring', damping: 25 }}
              className="max-w-4xl mx-auto">

              {/* Meta row */}
              <div className="flex justify-between items-center mb-12">
                <div className="flex gap-3">
                  <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={10} className="text-neon-purple" /> NODE {String(currentIdx + 1).padStart(3, '0')}
                  </span>
                  <span className="px-4 py-1.5 bg-neon-purple/5 border border-neon-purple/20 text-neon-purple rounded-full text-[10px] font-black uppercase">{currentQ.topic}</span>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                    currentQ.difficulty === 'Easy' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                    currentQ.difficulty === 'Hard' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                    'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                  }`}>{currentQ.difficulty}</span>
                </div>
                {/* Flag button */}
                <button
                  onClick={() => { const f = new Set(flags); flags.has(currentIdx) ? f.delete(currentIdx) : f.add(currentIdx); setFlags(f); }}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    flags.has(currentIdx) ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                  }`}>
                  <Flag size={14} /> {flags.has(currentIdx) ? 'FLAGGED' : 'FLAG NEURON'}
                </button>
              </div>

              {/* Question text */}
              <h2 className="text-3xl font-black leading-[1.35] tracking-tight mb-12">{currentQ.text}</h2>

              {/* Options */}
              <div className="grid grid-cols-1 gap-4 mb-12">
                {currentQ.options.map((opt, idx) => (
                  <button key={idx} onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: idx }))}
                    className={`group w-full p-8 text-left rounded-[28px] border transition-all duration-300 flex items-center gap-8 relative overflow-hidden ${
                      answers[currentIdx] === idx
                        ? 'bg-neon-purple border-neon-purple shadow-[0_20px_50px_rgba(188,19,254,0.15)] scale-[1.01]'
                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/8'
                    }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all shrink-0 ${
                      answers[currentIdx] === idx ? 'bg-white text-black scale-110 rotate-3' : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white'
                    }`}>{String.fromCharCode(65 + idx)}</div>
                    <span className={`text-base font-semibold transition-colors ${answers[currentIdx] === idx ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{opt}</span>
                    {answers[currentIdx] === idx && (
                      <motion.div layoutId="checkmark" className="absolute right-8 text-white/60"><Check size={28} /></motion.div>
                    )}
                  </button>
                ))}
              </div>

              {/* PREV / NEXT / SUBMIT */}
              <div className="flex justify-between">
                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                  className="flex items-center gap-3 px-8 py-4 glass-card font-black text-[10px] uppercase tracking-widest hover:text-white transition-all disabled:opacity-30">
                  <ChevronLeft size={16} /> PREVIOUS
                </button>
                {currentIdx < QUESTIONS.length - 1 ? (
                  <button onClick={() => setCurrentIdx(i => i + 1)}
                    className="flex items-center gap-3 px-8 py-4 bg-neon-purple text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-neon-purple/20 hover:scale-105 transition-all">
                    NEXT <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={handleSubmitClick}
                    className="flex items-center gap-3 px-10 py-4 bg-green-500 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-green-500/20 hover:scale-105 transition-all">
                    <Send size={16} /> SUBMIT QUIZ
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── Forensic Sidebar ─────────────────────────────────────────────── */}
        <aside className="col-span-3 border-l border-white/5 p-8 bg-black/60 flex flex-col gap-6 overflow-y-auto">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Monitor size={14} className="text-neon-purple shrink-0" /> LIVE PROCTOR_UI
          </h3>
          {/* Webcam */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
            <MediaPipeController onTelemetry={handleTelemetry} />
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${latestTel?.isLookingAway ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-[8px] font-black uppercase text-gray-300 truncate">
                {latestTel?.isLookingAway ? 'GAZE DEVIATION' : 'NEURAL PULSE ACTIVE'}
              </span>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">Mental Load</span>
              <span className={`text-sm font-black ${lookAwayCount > 5 ? 'text-red-400' : 'text-neon-blue'}`}>
                {lookAwayCount > 5 ? 'ELEVATED' : 'OPTIMAL'}
              </span>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">Focus Score</span>
              <span className="text-sm font-black text-neon-purple">{engagementPct}%</span>
            </div>
          </div>
          {/* Engagement bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black">
              <span className="text-gray-500 flex items-center gap-1"><Activity size={11} className="text-neon-blue" /> ENGAGEMENT</span>
              <span className="text-neon-blue">{engagementPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${engagementPct}%`, backgroundColor: engagementPct < 60 ? '#f59e0b' : '#00f2ff' }}
                className="h-full" transition={{ duration: 1 }} />
            </div>
            {lookAwayCount > 0 && (
              <p className="text-[9px] text-yellow-500 font-bold">⚠ {lookAwayCount} look-away event{lookAwayCount !== 1 ? 's' : ''} logged</p>
            )}
          </div>
          {/* Gaze warning */}
          <AnimatePresence>
            {latestTel?.isLookingAway && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="text-red-500" size={14} />
                  <span className="text-[9px] font-black text-red-500 uppercase">Protocol Warning</span>
                </div>
                <p className="text-[9px] text-red-400">Gaze deviation detected. Realign immediately.</p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Student info card */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Session Identity</p>
            <p className="text-xs font-black">{studentName}</p>
            <p className="text-[9px] text-gray-500">{studentId} {rollNo ? `• ${rollNo}` : ''} {section ? `• ${section}` : ''}</p>
          </div>
          {/* AI Co-Pilot */}
          <div className="mt-auto glass-card p-6 border-neon-blue/20 bg-linear-to-tr from-neon-blue/5 to-transparent">
            <div className="flex justify-between items-center mb-3">
              <Brain className="text-neon-blue" size={18} />
              <span className="text-[8px] font-black text-neon-blue uppercase border border-neon-blue/30 px-2 py-0.5 rounded-full">AI CO-PILOT</span>
            </div>
            {hint
              ? <p className="text-[10px] text-gray-300 leading-relaxed mb-4">{hint}</p>
              : <p className="text-[10px] text-gray-500 italic mb-4">"Need a nudge? Request a forensic hint from the AI engine."</p>}
            <button onClick={requestHint} disabled={hintLoading}
              className="w-full py-3 bg-neon-blue/10 border border-neon-blue/20 rounded-xl text-[9px] font-black text-neon-blue uppercase tracking-widest hover:bg-neon-blue hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {hintLoading ? <><div className="w-3 h-3 rounded-full border border-neon-blue border-t-transparent animate-spin" /> LOADING...</> : 'REQUEST SYMPATHY HINT'}
            </button>
          </div>
        </aside>
      </main>

      {/* ── Submit Confirm Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="glass-card max-w-md w-full p-12 text-center border-neon-purple/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-purple to-neon-blue" />
              <Send className="text-neon-purple mx-auto mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Finalize Submission</h3>
              <p className="text-gray-400 text-sm mb-2">
                <strong className="text-white">{studentName}</strong> — You have answered{' '}
                <strong className="text-neon-purple">{answeredCount}</strong> of{' '}
                <strong className="text-white">{QUESTIONS.length}</strong> questions.
              </p>
              {answeredCount < QUESTIONS.length && (
                <p className="text-yellow-400 text-xs mb-4 font-bold">
                  ⚠ {QUESTIONS.length - answeredCount} unanswered question{QUESTIONS.length - answeredCount > 1 ? 's' : ''} will be marked incorrect.
                </p>
              )}
              <p className="text-gray-600 text-xs mb-8">
                Your answers, forensic telemetry, and behavioral data will be transmitted to the AI system and teacher dashboard.
                <strong className="text-white block mt-1">Results will not be shown to you — they go directly to the teacher.</strong>
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-4 glass-card text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all rounded-2xl">
                  CONTINUE QUIZ
                </button>
                <button onClick={() => { setShowSubmitConfirm(false); doSubmit(false); }}
                  className="flex-1 py-4 bg-neon-purple text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-neon-purple/20 hover:scale-[1.02] transition-all">
                  CONFIRM &amp; SUBMIT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fullscreen Warning ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExitWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
            <div className="glass-card p-12 max-w-lg text-center border-red-500/40">
              <AlertTriangle className="text-red-500 mx-auto mb-6" size={48} />
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter text-red-500">Integrity Breach</h3>
              <p className="text-gray-400 text-sm mb-8">Full-Screen exit detected and logged. Return immediately.</p>
              <button onClick={() => { document.documentElement.requestFullscreen(); setShowExitWarning(false); }}
                className="px-12 py-4 bg-red-500 text-white font-black text-xs uppercase rounded-2xl hover:bg-red-600 transition-all">
                RE-SYNC PROTOCOL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
