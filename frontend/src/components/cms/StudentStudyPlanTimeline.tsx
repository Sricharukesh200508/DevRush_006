'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, PlayCircle, BookOpen, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export default function StudentStudyPlanTimeline({ plan }: { plan: any }) {
  const [expandedDay, setExpandedDay] = useState<number>(1);
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());

  if (!plan || !plan.daily_plans || !Array.isArray(plan.daily_plans)) {
    return <div className="p-4 text-center">Invalid Plan Format</div>;
  }

  const toggleBlock = async (blockId: string) => {
    const newSet = new Set(completedBlocks);
    if (newSet.has(blockId)) newSet.delete(blockId);
    else newSet.add(blockId);
    setCompletedBlocks(newSet);

    const total = plan.daily_plans.reduce((acc: number, day: any) => acc + (day.blocks?.length || 0), 0);
    const progress = Math.round((newSet.size / (total || 1)) * 100);

    // Sync progress to teacher dashboard
    const sid = localStorage.getItem('student_id');
    if (sid) {
      await fetch('http://localhost:8000/api/student/study-plan-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: sid,
          progress_percent: progress,
          is_finished: plan.is_finished || false
        })
      });
    }
  };

  const finishPlan = async () => {
    const sid = localStorage.getItem('student_id');
    if (sid) {
      await fetch('http://localhost:8000/api/student/study-plan-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: sid,
          progress_percent: 100,
          is_finished: true
        })
      });
      alert('Plan Completion Synced! Your teacher has been notified.');
      window.location.reload();
    }
  };

  const calculateProgress = () => {
    if (plan.is_finished) return 100;
    const total = plan.daily_plans.reduce((acc: number, day: any) => acc + (day.blocks?.length || 0), 0);
    return Math.round((completedBlocks.size / (total || 1)) * 100);
  };

  return (
    <div className="w-full mx-auto p-8 glass-card border-neon-purple/20">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">{plan.planTitle || "Neural Study Protocol"}</h2>
          <p className="text-neon-blue text-xs font-black uppercase tracking-widest mb-1">{plan.overallGoal}</p>
          <p className="text-gray-400 text-sm mt-2">{plan.behavioral_insights}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-4xl font-black text-neon-purple">{calculateProgress()}%</div>
          <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Mastery Gained</div>
        </div>
      </div>

      <div className="relative border-l-2 border-white/10 ml-6 space-y-12 pb-12">
        {plan.daily_plans.map((day: any, dIdx: number) => {
          const isExpanded = expandedDay === day.day;
          const isLocked = day.day > 1 && completedBlocks.size < (day.day - 1) * 2; 

          return (
            <div key={day.day || dIdx} className="relative pl-8">
              {/* Timeline dot */}
              <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center
                ${isExpanded ? 'bg-neon-purple' : isLocked ? 'bg-gray-800' : 'bg-white/10'} transition-colors`}>
                {isLocked ? <Lock size={12} className="text-gray-500" /> : <span className="text-[10px] font-black">{day.day}</span>}
              </div>

              <div 
                className={`glass-card p-6 cursor-pointer transition-all border ${isExpanded ? 'border-neon-purple/50 bg-white/5 shadow-[0_0_20px_rgba(188,19,254,0.15)]' : 'border-white/5 bg-transparent hover:bg-white/5'} ${isLocked ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                onClick={() => setExpandedDay(day.day)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-white">{day.theme || day.focusTheme}</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{day.time_commitment || day.estimatedTime}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 space-y-3">
                        {day.blocks?.map((block: any, idx: number) => {
                          const id = `d${day.day}-b${idx}`;
                          const isDone = completedBlocks.has(id);
                          return (
                            <div key={idx} className={`p-4 rounded-xl border flex gap-4 transition-all ${isDone ? 'bg-green-500/10 border-green-500/30' : 'bg-black/50 border-white/5 hover:border-white/20'}`}>
                              <button onClick={(e) => { e.stopPropagation(); toggleBlock(id); }} className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-white/20 hover:border-neon-purple'}`}>
                                {isDone && <CheckCircle2 size={14} className="text-black" />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {block.type.includes('Review') ? <PlayCircle size={14} className="text-neon-purple" /> : <BookOpen size={14} className="text-neon-blue" />}
                                  <span className="text-[10px] font-black uppercase text-gray-300">{block.type}</span>
                                  <span className="text-[8px] font-black text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">{block.duration}</span>
                                </div>
                                <p className={`text-sm ${isDone ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{block.details || block.content}</p>
                                {!isDone && block.resource && (
                                  <a href={block.resource} target="_blank" rel="noreferrer" className="inline-block mt-3 text-[10px] text-neon-blue uppercase font-black hover:underline z-10 relative">
                                    Launch Module →
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {day.dailyChecklist && (
                        <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-xl">
                           <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Checklist:</p>
                           {day.dailyChecklist.map((c: string, i: number) => (
                             <div key={i} className="flex items-center gap-2 text-xs text-gray-300 mb-1"><span className="text-neon-blue">•</span> {c}</div>
                           ))}
                        </div>
                      )}

                      {day.gamification && (
                        <div className="mt-4 p-4 bg-neon-purple/10 border border-neon-purple/20 rounded-xl flex items-start gap-3">
                          <div className="text-2xl pt-1">🥇</div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-neon-purple mb-1">Reward: {day.gamification.badge}</p>
                            <p className="text-xs text-gray-300 italic">"{day.gamification.quote}"</p>
                          </div>
                        </div>
                      )}
                      
                      {day.predictedMasteryGain && (
                         <p className="mt-4 text-xs font-black text-green-400 bg-green-400/10 inline-block px-3 py-1 rounded-full">{day.predictedMasteryGain}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      
      {plan.motivationalNote && (
        <div className="text-center italic text-gray-400 text-sm mt-8 pb-4">
          "{plan.motivationalNote}"
        </div>
      )}

      <div className="mt-8 flex justify-center">
        {plan.is_finished ? (
          <div className="px-8 py-4 bg-green-500/10 border border-green-500/30 text-green-400 font-black tracking-widest uppercase rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={18} /> FULL 7-DAY CURRICULUM COMPLETED & SYNCED
          </div>
        ) : (
          <button 
            onClick={finishPlan}
            className="px-10 py-5 bg-neon-purple text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(188,19,254,0.3)] hover:scale-105 transition-all flex items-center gap-3"
          >
            <CheckCircle2 size={20} /> MARK 7-DAY PLAN AS COMPLETELY FINISHED
          </button>
        )}
      </div>
    </div>
  );
}
