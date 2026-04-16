'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentLogin() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim()) return;
    
    // Save to local storage for demo purposes
    localStorage.setItem('student_id', studentId.trim().toUpperCase());
    localStorage.setItem('student_name', studentName.trim());
    
    // Redirect to dashboard
    router.push('/student');
  };

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-8 relative overflow-hidden">
      {/* BG decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="text-neon-purple" size={36} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter neon-text-purple uppercase mb-2">Student Portal</h1>
          <p className="text-gray-400 text-sm">Synchronize your identity to the Neural Core</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-10 border-neon-purple/20 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-purple via-neon-blue to-transparent" />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-neon-purple" /> Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-neon-purple transition-all placeholder-gray-600 focus:bg-white/10"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} className="text-neon-purple" /> Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. ST_001"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-neon-purple transition-all placeholder-gray-600 focus:bg-white/10 uppercase"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!studentId.trim() || !studentName.trim()}
            className="w-full py-5 bg-neon-purple text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-neon-purple/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-3 mt-4"
          >
            INITIALIZE SESSION <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
