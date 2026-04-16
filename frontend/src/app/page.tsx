'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full">
        <Link href="/teacher">
          <motion.div 
            whileHover={{ scale: 1.05, y: -10 }}
            className="glass-card p-12 flex flex-col items-center gap-6 cursor-pointer border-neon-blue/20 hover:border-neon-blue transition-all group"
          >
            <div className="w-24 h-24 rounded-3xl bg-neon-blue/10 flex items-center justify-center text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-all">
              <Users size={48} />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tighter neon-text-blue mb-2 uppercase">Teacher Dashboard</h2>
              <p className="text-gray-500 text-sm">Real-time AI Co-Pilot • Multimodal Heatmaps • Intervention Engine</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/student">
          <motion.div 
            whileHover={{ scale: 1.05, y: -10 }}
            className="glass-card p-12 flex flex-col items-center gap-6 cursor-pointer border-neon-purple/20 hover:border-neon-purple transition-all group"
          >
            <div className="w-24 h-24 rounded-3xl bg-neon-purple/10 flex items-center justify-center text-neon-purple group-hover:bg-neon-purple group-hover:text-black transition-all">
              <GraduationCap size={48} />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tighter neon-text-purple mb-2 uppercase">Student Dashboard</h2>
              <p className="text-gray-500 text-sm">Personal AI Coach • Adaptive Difficulty • Smart Study Buddy</p>
            </div>
          </motion.div>
        </Link>
      </div>
      
      <div className="fixed bottom-8 text-center">
         <p className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">Tensor '26 • Industry Standard Deployment</p>
      </div>
    </div>
  );
}
