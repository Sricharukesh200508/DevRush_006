'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Clock, Shield, ChevronDown,
  X, Send, CheckCircle2, AlertCircle, Shuffle,
  Minus, Users2, Zap, BookOpen
} from 'lucide-react';

// Mock class roster with gap profiles
const CLASS_ROSTER = [
  { id: 'ST_001', name: 'Alex Chen', avatar: '🧑‍💻', gap: 'Weak: Recursion (45%)', mastery: 45 },
  { id: 'ST_002', name: 'Priya Sharma', avatar: '👩‍🔬', gap: 'Weak: Trees (58%)', mastery: 58 },
  { id: 'ST_003', name: 'Marcus Webb', avatar: '🧑‍🎨', gap: 'Weak: DP (32%)', mastery: 32 },
  { id: 'ST_004', name: 'Lena Müller', avatar: '👩‍💼', gap: 'Weak: Graphs (71%)', mastery: 71 },
  { id: 'ST_005', name: 'Rahul Patel', avatar: '🧑‍🏫', gap: 'Optimal (89%)', mastery: 89 },
  { id: 'ST_006', name: 'Sofia Torres', avatar: '👩‍🔬', gap: 'Weak: Hashing (38%)', mastery: 38 },
];

type Quiz = { id: string; title: string; duration: number; questions: any[] };

type AssignModalProps = {
  quiz: Quiz;
  onClose: () => void;
};

export default function AssignQuizModal({ quiz, onClose }: AssignModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [proctoringMode, setProctoringMode] = useState<'full' | 'light' | 'disabled'>('full');
  const [autoRelease, setAutoRelease] = useState<'immediately' | 'after_due' | 'manual'>('immediately');
  const [startTime, setStartTime] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [randomize, setRandomize] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [bulkMode, setBulkMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectWeakStudents = () => {
    const weak = CLASS_ROSTER.filter(s => s.mastery < 60).map(s => s.id);
    setSelectedStudents(weak);
    setBulkMode(true);
  };

  const handleDeploy = async () => {
    setStatus('deploying');
    try {
      const payload = {
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        assigned_to: bulkMode ? CLASS_ROSTER.map(s => s.id) : selectedStudents,
        proctoring_mode: proctoringMode,
        start_time: startTime || null,
        due_time: dueTime || null,
        max_attempts: maxAttempts,
        randomize,
        negative_marking: negativeMarking,
        auto_release: autoRelease,
        instructions
      };

      const res = await fetch('http://localhost:8000/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => { onClose(); }, 2000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const PROCTORING_OPTIONS = [
    { value: 'full', label: 'Full Proctor', desc: 'Webcam + Lip-Eye Sync', icon: Shield, color: 'border-red-500/40 bg-red-500/5 text-red-400' },
    { value: 'light', label: 'Light Mode', desc: 'Tab-switch only', icon: AlertCircle, color: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400' },
    { value: 'disabled', label: 'Disabled', desc: 'No monitoring', icon: CheckCircle2, color: 'border-green-500/40 bg-green-500/5 text-green-400' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 bg-black/90 backdrop-blur-2xl flex items-start justify-center p-8 overflow-y-auto">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        className="glass-card w-full max-w-3xl my-8 border-neon-purple/20 relative overflow-hidden">
        
        {/* Top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-purple via-neon-blue to-transparent" />
        
        {/* Header */}
        <div className="flex justify-between items-start p-10 border-b border-white/5">
          <div>
            <h2 className="text-3xl font-black tracking-tighter neon-text-purple uppercase mb-1">Assign Assessment</h2>
            <p className="text-gray-400 text-sm font-medium">"{quiz.title}" • {quiz.duration} min • {quiz.questions?.length || 0} neurons</p>
          </div>
          <button onClick={onClose} className="p-3 glass-card hover:text-white text-gray-500 rounded-2xl"><X size={20} /></button>
        </div>

        <div className="p-10 space-y-10">
          {/* Student Selection */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Users size={14} className="text-neon-purple" /> Student Node Selection
              </h3>
              <div className="flex gap-3">
                <button onClick={() => { setBulkMode(true); setSelectedStudents(CLASS_ROSTER.map(s => s.id)); }}
                  className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 text-neon-blue text-[9px] font-black uppercase border border-neon-blue/20 rounded-xl hover:scale-105 transition-all">
                  <Users2 size={12} /> SELECT ALL
                </button>
                <button onClick={selectWeakStudents}
                  className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 text-neon-purple text-[9px] font-black uppercase border border-neon-purple/20 rounded-xl hover:scale-105 transition-all">
                  <Zap size={12} /> BULK: WEAK STUDENTS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CLASS_ROSTER.map(student => {
                const selected = selectedStudents.includes(student.id) || bulkMode;
                return (
                  <button key={student.id} onClick={() => !bulkMode && toggleStudent(student.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                      selected ? 'bg-neon-purple/10 border-neon-purple/40' : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}>
                    <span className="text-2xl">{student.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">{student.name}</p>
                      <p className="text-[9px] text-gray-500 font-bold truncate">{student.gap}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                      student.mastery < 60 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>{student.mastery}%</div>
                  </button>
                );
              })}
            </div>
            {(bulkMode || selectedStudents.length > 0) && (
              <p className="text-[10px] text-neon-purple font-black mt-3 uppercase tracking-widest">
                ✓ {bulkMode ? CLASS_ROSTER.length : selectedStudents.length} nodes targeted for neural deployment
              </p>
            )}
          </section>

          {/* Scheduling */}
          <section>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
              <Calendar size={14} className="text-neon-blue" /> Scheduling Matrix
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Start Date / Time</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-neon-blue transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Due Date / Time</label>
                <input type="datetime-local" value={dueTime} onChange={e => setDueTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-neon-blue transition-all" />
              </div>
            </div>
          </section>

          {/* Proctoring Mode */}
          <section>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
              <Shield size={14} className="text-red-400" /> Forensic Protocol
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {PROCTORING_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setProctoringMode(opt.value as any)}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    proctoringMode === opt.value ? opt.color : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                  }`}>
                  <opt.icon size={24} className="mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{opt.label}</p>
                  <p className="text-[8px] text-gray-500 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Advanced Settings */}
          <section>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
              <Zap size={14} className="text-neon-blue" /> Advanced Parameters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Randomize Questions', key: 'randomize', value: randomize, setter: setRandomize },
                { label: 'Negative Marking', key: 'negative', value: negativeMarking, setter: setNegativeMarking },
              ].map(toggle => (
                <button key={toggle.key} onClick={() => toggle.setter(!toggle.value)}
                  className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                    toggle.value ? 'bg-neon-blue/10 border-neon-blue/30' : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}>
                  <div className="flex items-center gap-3">
                    <Shuffle size={16} className={toggle.value ? 'text-neon-blue' : 'text-gray-500'} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{toggle.label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all ${toggle.value ? 'bg-neon-blue' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white m-0.5 transform transition-all ${toggle.value ? 'translate-x-5' : ''}`} />
                  </div>
                </button>
              ))}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Max Attempts</label>
                <select value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-neon-blue transition-all">
                  {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Result Release</label>
                <select value={autoRelease} onChange={e => setAutoRelease(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-neon-blue transition-all">
                  <option value="immediately">Immediately</option>
                  <option value="after_due">After Due Date</option>
                  <option value="manual">Manual Release</option>
                </select>
              </div>
            </div>
          </section>

          {/* Instructions */}
          <section>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
              <BookOpen size={14} className="text-gray-400" /> Student Instructions
            </h3>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="Add custom instructions for students before they start the quiz..."
              className="w-full h-28 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-neon-blue transition-all resize-none" />
          </section>

          {/* Deploy Button */}
          <button onClick={handleDeploy} disabled={status === 'deploying' || status === 'success'}
            className={`w-full py-6 font-black text-xs uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-4 transition-all ${
              status === 'success' ? 'bg-green-500 text-white' :
              status === 'error' ? 'bg-red-500 text-white' :
              'bg-neon-purple text-white hover:scale-[1.02] shadow-xl shadow-neon-purple/20'
            }`}>
            {status === 'deploying' && <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {status === 'success' && <CheckCircle2 size={20} />}
            {status === 'error' && <AlertCircle size={20} />}
            <Send size={18} />
            {status === 'idle' && 'DEPLOY NEURAL ASSESSMENT TO STUDENT NODES'}
            {status === 'deploying' && 'TRANSMITTING TO NEURAL NETWORK...'}
            {status === 'success' && 'SUCCESSFULLY DEPLOYED ✓'}
            {status === 'error' && 'DEPLOYMENT FAILED — RETRY'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
