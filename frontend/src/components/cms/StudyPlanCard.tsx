'use client';

import { motion } from 'framer-motion';
import { Calendar, PlayCircle, CheckCircle2, Award, BookOpen, AlertCircle } from 'lucide-react';

interface StudyPlanCardProps {
  plan: any;
  onSendToStudent?: () => void;
  onRegenerate?: () => void;
  isSending?: boolean;
  isRegenerating?: boolean;
}

export default function StudyPlanCard({ plan, onSendToStudent, onRegenerate, isSending, isRegenerating }: StudyPlanCardProps) {
  if (!plan) return null;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={12} className="text-neon-blue" /> Generated 7-Day Advanced Learning Plan
        </h4>
        <div className="flex gap-3">
          {onRegenerate && (
            <button 
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              {isRegenerating ? 'GENERATING...' : 'REGENERATE PLAN'}
            </button>
          )}
          {onSendToStudent && (
            <button 
              onClick={onSendToStudent}
              disabled={isSending}
              className="px-4 py-2 bg-neon-blue text-black rounded-xl text-[9px] font-black uppercase shadow-[0_0_15px_rgba(0,242,255,0.3)] hover:scale-105 transition-all flex items-center gap-2"
            >
              {isSending ? 'SENDING...' : 'SEND TO STUDENT'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className={`p-4 flex-1 rounded-2xl border flex items-center justify-between ${plan.is_finished ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan.is_finished ? 'bg-green-500/20 text-green-400' : 'bg-neon-purple/20 text-neon-purple'}`}>
                 <CheckCircle2 size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Student Progress</p>
                 <p className={`text-sm font-black ${plan.is_finished ? 'text-green-400' : 'text-white'}`}>
                    {plan.is_finished ? '100% COMPLETED' : `${plan.progress_percent || 0}% SYNCHRONIZED`}
                 </p>
              </div>
           </div>
           {plan.is_finished && <span className="px-3 py-1 bg-green-500 text-black text-[10px] font-black uppercase rounded-lg">Verified</span>}
        </div>
      </div>

      <div className="p-4 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
         <AlertCircle className="text-neon-purple shrink-0 mt-1" size={16} />
         <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Behavioral Insight</p>
            <p className="text-[11px] text-gray-300 leading-relaxed font-mono">{plan.behavioral_insights}</p>
         </div>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {plan.daily_plans?.map((day: any, i: number) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex gap-6"
          >
            <div className="flex flex-col items-center">
               <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue font-black text-sm border border-neon-blue/30 shrink-0">
                  D{day.day}
               </div>
               <div className="flex-1 w-px bg-white/10 my-2" />
               <span className="text-[8px] font-black text-gray-500 uppercase">{day.time_commitment}</span>
            </div>
            
            <div className="flex-1">
               <h5 className="text-sm font-black text-white mb-3 tracking-tight">{day.theme}</h5>
               <div className="space-y-3 mb-4">
                  {day.blocks?.map((b: any, j: number) => (
                     <div key={j} className="flex gap-3 items-start p-3 rounded-xl bg-black/40 border border-white/5">
                        {b.type.includes('Review') ? <PlayCircle size={14} className="text-neon-purple mt-0.5 shrink-0" /> : <BookOpen size={14} className="text-neon-blue mt-0.5 shrink-0" />}
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase text-gray-300">{b.type}</span>
                              <span className="text-[8px] font-black text-gray-600 uppercase border border-gray-700 px-2 py-0.5 rounded-md">{b.duration}</span>
                           </div>
                           <p className="text-[10px] text-gray-500">{b.details}</p>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="flex items-center gap-2 p-3 bg-neon-purple/5 rounded-xl border border-neon-purple/10">
                  <Award size={14} className="text-neon-purple shrink-0" />
                  <div>
                     <p className="text-[9px] font-black uppercase text-neon-purple">{day.gamification?.badge}</p>
                     <p className="text-[9px] text-gray-400 italic">"{day.gamification?.quote}"</p>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
