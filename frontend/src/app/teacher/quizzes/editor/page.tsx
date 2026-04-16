'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import AssignQuizModal from '@/components/cms/AssignQuizModal';
import { 
  Save, Shield, Settings, Calendar, Clock, Lock, 
  Settings2, LayoutGrid, ListOrdered, Share2, Copy, 
  Trash2, Eye, Zap, Sparkles, ChevronDown, CheckCircle, Users
} from 'lucide-react';

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(''),
  duration: z.number().min(1).max(180),
  passingScore: z.number().min(0).max(100).optional().default(40),
  proctoring: z.boolean().default(true),
  randomize: z.boolean().default(true),
  attempts: z.number().min(1).max(5),
  startTime: z.string().optional().default(''),
  endTime: z.string().optional().default(''),
});

export default function QuizEditor() {
  const [activeSegment, setActiveSegment] = useState('settings');
  const [isSaved, setIsSaved] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deployedQuizId, setDeployedQuizId] = useState<string | null>(null);
  const [showBank, setShowBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([
    { id: 1, text: "What is the time complexity of a balanced BST search?", points: 5, difficulty: 'Easy' },
    { id: 2, text: "Implement a recursive function for Fibonacci numbers.", points: 10, difficulty: 'Medium' }
  ]);

  const loadBank = async () => {
     if (showBank) {
        setShowBank(false);
        return;
     }
     try {
        const res = await fetch('http://localhost:8000/api/cms/data');
        const data = await res.json();
        setBankQuestions(data.questions || []);
        setShowBank(true);
     } catch (err) {
        console.error("Failed to load bank", err);
     }
  };

  const addNeuron = (q: any) => {
     if (!questions.find((x: any) => x.id === q.id)) {
        setQuestions([...questions, { ...q, points: q.points || 10, difficulty: q.difficulty || 'Medium' }]);
     }
  };
  
  const removeNeuron = (id: any) => {
     setQuestions(questions.filter((q: any) => q.id !== id));
  };

  const { register, watch, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      proctoring: true,
      randomize: true,
      duration: 30,
      passingScore: 40,
      attempts: 1,
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    }
  });
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');

  // Auto-save simulation
  useEffect(() => {
    const subscription = watch((value) => {
       console.log("Auto-saving draft...", value);
       setIsSaved(false);
       const timer = setTimeout(() => setIsSaved(true), 1500);
       return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleDeploy = async () => {
    const data = getValues();
    const title = data.title?.trim() || 'Untitled Quiz';
    setDeployStatus('deploying');
    try {
      const payload = {
        ...data,
        title,
        id: `qz-${Date.now()}`,
        questions,
        timestamp: new Date().toISOString()
      };
      
      const res = await fetch('http://localhost:8000/api/cms/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        setDeployedQuizId(payload.id);
        setDeployStatus('success');
        setIsSaved(true);
        setTimeout(() => setDeployStatus('idle'), 3000);
      } else {
        setDeployStatus('error');
        setTimeout(() => setDeployStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Deployment Failed:', err);
      setDeployStatus('error');
      setTimeout(() => setDeployStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen p-8 custom-scrollbar">
      <header className="flex justify-between items-end mb-12">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-3xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
              <Settings2 size={32} />
           </div>
           <div>
             <h1 className="text-4xl font-black tracking-tighter neon-text-blue">
               QUIZ ARCHITECT <span className="text-white/20">|</span> v2.6
             </h1>
             <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isSaved ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`} />
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {isSaved ? 'ALL CHANGES SYNCED' : 'UPLOADING DRAFT...'}
                </p>
             </div>
           </div>
        </div>

        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 glass-card text-gray-400 font-black text-xs uppercase tracking-widest hover:text-white transition-all">
              <Eye size={16} /> PREVIEW MODE
           </button>
           <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-8 py-3 bg-neon-purple text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-neon-purple/20"
           >
              <Users size={16} /> ASSIGN TO CLASS
           </button>
           <button 
               onClick={handleDeploy}
               disabled={deployStatus === 'deploying'}
               className={`flex items-center gap-2 px-8 py-3 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl ${
                 deployStatus === 'success'
                   ? 'bg-green-500 text-white shadow-green-500/20'
                   : deployStatus === 'error'
                   ? 'bg-red-500 text-white shadow-red-500/20'
                   : deployStatus === 'deploying'
                   ? 'bg-neon-blue/50 text-black cursor-wait'
                   : 'bg-neon-blue text-black shadow-neon-blue/20'
               }`}
            >
               {deployStatus === 'deploying' && <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />}
               {deployStatus === 'success' && <CheckCircle size={16} />}
               {deployStatus === 'error' && <Share2 size={16} />}
               {deployStatus === 'idle' && <Share2 size={16} />}
               {deployStatus === 'deploying' ? 'DEPLOYING...' : deployStatus === 'success' ? 'DEPLOYED ✓' : deployStatus === 'error' ? 'RETRY DEPLOY' : 'DEPLOY QUIZ'}
            </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-12">
        {/* Left: Navigation Tabs */}
        <aside className="col-span-3 flex flex-col gap-4">
           {[
             { id: 'settings', label: 'Global Configuration', icon: Settings },
             { id: 'questions', label: 'Question Distribution', icon: ListOrdered },
             { id: 'proctoring', label: 'Proctoring & Safety', icon: Shield },
             { id: 'access', label: 'Scheduling & Access', icon: Clock },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveSegment(tab.id)}
               className={`p-6 rounded-3xl border text-left transition-all flex items-center gap-4 group ${
                 activeSegment === tab.id ? 'bg-neon-blue/10 border-neon-blue text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
               }`}
             >
               <tab.icon size={20} className={activeSegment === tab.id ? 'text-neon-blue' : 'group-hover:text-white'} />
               <div className="flex-1">
                 <p className="font-black text-[10px] uppercase tracking-widest">{tab.label}</p>
                 <p className="text-[8px] text-gray-600 font-bold mt-1 uppercase">Phase {tab.id === 'settings' ? '01' : '02'}</p>
               </div>
               {activeSegment === tab.id && <Zap size={14} className="text-neon-blue animate-pulse" />}
             </button>
           ))}

           <div className="mt-8 glass-card p-8 border-neon-blue/10 bg-linear-to-br from-neon-blue/5 to-transparent">
              <h4 className="text-[10px] font-black uppercase text-neon-blue mb-4 tracking-tighter flex items-center gap-2">
                <Sparkles size={14} /> AI Distribution Hint
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed italic">
                "Based on recent gaps, we recommend including 15% more questions on 'Recursion' and 'Stack Overflow' principles."
              </p>
           </div>
        </aside>

        {/* Right: Dynamic Editor Content */}
        <div className="col-span-9 glass-card p-12 min-h-[600px] shadow-2xl overflow-hidden relative">
           <AnimatePresence mode="wait">
             {activeSegment === 'settings' && (
               <motion.div 
                 key="settings"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="space-y-12"
               >
                  <div className="grid grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Quiz Master Title</label>
                        <input 
                           {...register('title')}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-xl font-bold outline-none focus:border-neon-blue transition-all"
                           placeholder="e.g., Data Structures Mid-Term"
                        />
                        {errors.title && <p className="text-red-500 text-[10px] font-black">{errors.title.message}</p>}
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Duration (Minutes)</label>
                        <input 
                           type="number"
                           {...register('duration', { valueAsNumber: true })}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-xl font-bold outline-none focus:border-neon-blue transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Conceptual Description</label>
                     <textarea 
                        {...register('description')}
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-sm leading-relaxed outline-none focus:border-neon-blue transition-all"
                        placeholder="Provide internal notes or student instructions..."
                     />
                  </div>

                  <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                     <div className="flex items-center justify-between p-6 glass-card bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase text-gray-400">Randomize Order</span>
                           <span className="text-[8px] text-neon-blue font-black uppercase">Shuffle Engine v2</span>
                        </div>
                        <input type="checkbox" {...register('randomize')} className="w-5 h-5 accent-neon-blue" />
                     </div>
                     <div className="flex items-center justify-between p-6 glass-card bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase text-gray-400">Lip-Eye Proctoring</span>
                           <span className="text-[8px] text-neon-purple font-black uppercase">MediaPipe Shield</span>
                        </div>
                        <input type="checkbox" {...register('proctoring')} className="w-5 h-5 accent-neon-purple" />
                     </div>
                     <div className="flex items-center justify-between p-6 glass-card bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black uppercase text-gray-400">Attempts Limit</span>
                           <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">High Impact</span>
                        </div>
                        <select {...register('attempts', { valueAsNumber: true })} className="bg-transparent text-xs font-black outline-none appearance-none cursor-pointer">
                           <option value={1}>1</option>
                           <option value={2}>2</option>
                           <option value={3}>3</option>
                        </select>
                     </div>
                  </div>
               </motion.div>
             )}

             {activeSegment === 'questions' && (
               <motion.div 
                 key="questions"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-black">Curated Question Payload</h3>
                     <div className="flex gap-4">
                        <button className="px-6 py-3 bg-white/5 text-[10px] font-black uppercase border border-white/5 rounded-xl hover:bg-white/10 transition-all">MANUAL SELECT</button>
                        <button className="px-6 py-3 bg-neon-purple text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-neon-purple/20 flex items-center gap-2">
                           <Sparkles size={14} /> AI AUTO-GENERATE
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {questions.map((q, idx) => (
                        <div key={q.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-6 group hover:border-neon-blue/30 transition-all">
                           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xs font-black text-gray-500 group-hover:bg-neon-blue group-hover:text-black transition-all">
                              {idx + 1}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-bold truncate max-w-[400px]">{q.text}</p>
                              <div className="flex gap-4 mt-2">
                                 <span className="text-[8px] font-black uppercase text-neon-blue">{q.difficulty}</span>
                                 <span className="text-[8px] font-black uppercase text-gray-500">{q.points} POINTS</span>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => removeNeuron(q.id)} className="p-2 bg-white/5 hover:bg-red-400/10 text-gray-600 hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
                              <button className="p-2 bg-white/5 hover:bg-neon-blue/10 text-gray-600 hover:text-neon-blue rounded-lg cursor-grab active:cursor-grabbing"><ListOrdered size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>

                  <button onClick={loadBank} className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl text-gray-600 font-black uppercase text-[10px] tracking-widest hover:border-neon-blue/30 hover:text-neon-blue hover:bg-neon-blue/5 transition-all duration-700">
                     {showBank ? '- CLOSE NEURAL BANK' : '+ PULL MORE NEURONS FROM BANK'}
                  </button>

                  <AnimatePresence>
                     {showBank && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden border-t border-white/10 pt-4">
                           {bankQuestions.length === 0 ? (
                              <p className="text-center text-gray-500 text-xs italic p-4">Neural Bank is empty. Generate questions first.</p>
                           ) : bankQuestions.map(bq => (
                              <div key={bq.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-neon-purple/30">
                                 <div>
                                    <p className="text-sm font-bold">{bq.text}</p>
                                    <span className="text-[10px] text-gray-500 uppercase">{bq.subject || 'GENERAL'} • {bq.difficulty || 'MEDIUM'}</span>
                                 </div>
                                 <button 
                                    onClick={() => addNeuron(bq)}
                                    disabled={questions.some(q => q.id === bq.id)}
                                    className="px-4 py-2 border border-neon-purple text-neon-purple rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-purple hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                 >
                                    {questions.some(q => q.id === bq.id) ? 'ADDED' : 'PULL TO QUIZ'}
                                 </button>
                              </div>
                           ))}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
             )}

             {activeSegment === 'proctoring' && (
               <motion.div 
                 key="proctoring"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Shield size={24} className="text-neon-purple" /> FORENSIC PROCTORING CONFIG</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                     <div className="p-8 border border-white/10 rounded-3xl bg-white/5 hover:border-neon-purple/50 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="p-3 bg-neon-purple/10 rounded-2xl text-neon-purple"><Sparkles size={20} /></div>
                           <input type="checkbox" {...register('proctoring')} className="w-6 h-6 accent-neon-purple" />
                        </div>
                        <h4 className="font-bold mb-2">MediaPipe Deep Proctoring</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                           Activate live WebGL tracking. Captures 3D facial vectors, calculates lip synchrony mapping to detect whispering, and measures absolute pupil deviation over time.
                        </p>
                     </div>

                     <div className="p-8 border border-white/10 rounded-3xl bg-white/5 opacity-50 cursor-not-allowed group">
                        <div className="flex justify-between items-start mb-4">
                           <div className="p-3 bg-white/10 rounded-2xl text-gray-500"><Lock size={20} /></div>
                           <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-black">ENTERPRISE TIER</span>
                        </div>
                        <h4 className="font-bold mb-2">Multi-Person Detection</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                           Identifies background entities entering the frame during the assessment using YOLO integration. Requires a Tier 2 subscription node.
                        </p>
                     </div>
                  </div>
               </motion.div>
             )}

             {activeSegment === 'access' && (
               <motion.div 
                 key="access"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Clock size={24} className="text-neon-blue" /> SCHEDULING & METRICS</h3>
                  
                  <div className="grid grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Opening Window</label>
                        <input 
                           type="datetime-local"
                           {...register('startTime')}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-sm font-bold outline-none focus:border-neon-blue transition-all"
                        />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Strict Closing Deadline</label>
                        <input 
                           type="datetime-local"
                           {...register('endTime')}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-sm font-bold outline-none focus:border-neon-blue transition-all"
                        />
                     </div>
                  </div>

                  <div className="p-8 border border-white/10 rounded-3xl bg-white/5 mt-8">
                      <div className="mb-4 text-[10px] font-black uppercase text-neon-blue tracking-[0.2em]">Mandatory Passing Protocol</div>
                      <div className="flex gap-4 items-center">
                         <input 
                            type="range" min="0" max="100" 
                            {...register('passingScore', { valueAsNumber: true })}
                            className="flex-1 accent-neon-blue" 
                         />
                         <span className="w-16 text-center text-xl font-black bg-white/5 py-2 rounded-xl">{watch('passingScore')}%</span>
                      </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Backdrop VisualDecor */}
           <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[80px] pointer-events-none" />
         </div>
       </main>

      {/* Quiz Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignQuizModal
            quiz={{ id: deployedQuizId || `qz-draft`, title: 'Current Quiz', duration: 30, questions }}
            onClose={() => setShowAssignModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
