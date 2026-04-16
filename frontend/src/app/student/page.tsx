'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, BookOpen, MessageCircle, Calendar, 
  Activity, Zap, Target, ArrowRight,
  Brain, Star, Sparkles, Send, Shield
} from 'lucide-react';

import StudentStudyPlanTimeline from '@/components/cms/StudentStudyPlanTimeline';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [studentIdentity, setStudentIdentity] = useState({ id: '', name: '' });
  const [difficulty, setDifficulty] = useState(65);
  const [chatOpen, setChatOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
     { role: 'assistant', text: "Hey Alex! I noticed you spent 3x more time on the 'Base Case' section today. Want me to break it down like a video game level?" }
  ]);

  const handleSendMessage = async () => {
    if (!message) return;
    const newHistory = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(newHistory);
    setMessage('');
    
    // Neural AI Logic Integration
    try {
      const formData = new FormData();
      formData.append('student_id', studentIdentity.id || 'ST_ANON');
      formData.append('topic', 'Recursion');
      formData.append('mastery', '0.45');
      
      const res = await fetch('http://127.0.0.1:8000/analyze/gap_detection', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      setTimeout(() => {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          text: `Neural analysis complete: ${data.recommended_action}. Predicted decay: ${data.decay_prediction.predicted_mastery_48h * 100}% in 48h.` 
        }]);
      }, 1000);
    } catch (err) {
      console.error('AI Link Severed:', err);
    }
  };

  // Real-time synchronization with Neural CMS
  useEffect(() => {
    // Auth Check
    const sid = localStorage.getItem('student_id');
    const sname = localStorage.getItem('student_name');
    if (!sid) {
      router.push('/student/login');
      return;
    }
    setStudentIdentity({ id: sid, name: sname || 'Student' });

    fetch('http://localhost:8000/api/cms/data')
      .then(res => res.json())
      .then(data => setQuizzes(data.quizzes || []))
      .catch(err => console.error('Cloud Sync Failed:', err));

     fetch(`http://localhost:8000/api/student/mastery/${sid}`)
      .then(res => res.json())
      .then(data => setMasteryData(data.mastery || []))
      .catch(err => console.error(err));

    fetch('http://localhost:8000/api/teacher/results')
      .then(res => res.json())
      .then(data => {
         const results = data.results || [];
         // ONLY get the study plan generated explicitly for this logged-in student
         const myResults = results.filter((r: any) => r.student_id === sid && r.generated_study_plan);
         if (myResults.length > 0) {
            setStudyPlan(myResults[myResults.length - 1].generated_study_plan);
         }
      })
      .catch(err => console.error(err));
  }, [router]);

  // Mock data for 2026 aesthetics
  const PATH_DAYS = [
    { day: 'Mon', topic: 'Arrays', mastery: 85, active: false },
    { day: 'Tue', topic: 'Hashing', mastery: 70, active: false },
    { day: 'Wed', topic: 'Recursion', mastery: 45, active: true },
    { day: 'Thu', topic: 'Trees', mastery: 30, active: false },
    { day: 'Fri', topic: 'DP', mastery: 10, active: false },
  ];

  return (
    <div className="min-h-screen p-8 flex flex-col gap-8 custom-scrollbar relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center z-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter neon-text-purple uppercase">
            NEURAL COACH <span className="text-white/20">|</span> HELLO {studentIdentity.name.split(' ')[0]}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Study smarter, not longer • Powered by DKT-26</p>
        </div>
        
        <div className="flex gap-4">
          <a href="/student/quizzes" className="flex gap-4" style={{textDecoration: 'none'}}>
            <div className="glass-card px-6 py-3 flex items-center gap-3 border-neon-blue/20 hover:border-neon-blue/60 transition-all group cursor-pointer">
              <Zap className="text-neon-blue" size={18} />
              <div className="text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase">My Quizzes</p>
                <p className="text-sm font-black text-neon-blue group-hover:text-white transition-colors">{quizzes.length > 0 ? `${quizzes.length} ACTIVE` : 'VIEW ALL'}</p>
              </div>
            </div>
          </a>
          
          <div className="glass-card px-6 py-3 flex items-center gap-3 border-neon-purple/20">
            <Trophy className="text-neon-purple" size={18} />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 font-bold uppercase">League Rank</p>
              <p className="text-sm font-black text-neon-purple">#4 BRONZE</p>
            </div>
          </div>
        </div>
      </header>


      <main className="grid grid-cols-12 gap-8 flex-1 z-10">
        {/* Left: Personalized Path & Insights */}
        <div className="col-span-8 flex flex-col gap-8">
          <section className="glass-card p-8 group">
            <div className="flex justify-between items-center mb-8">
              <h3 className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-tighter text-sm">
                <Target size={16} className="text-neon-purple" /> Personalized 7-Day Path
              </h3>
              <button className="text-[10px] font-black uppercase text-neon-blue border border-neon-blue/30 px-4 py-2 rounded-lg hover:bg-neon-blue hover:text-white transition-all">
                SYNC CALENDAR
              </button>
            </div>
            
            
            <div className="flex justify-between gap-4">
              {studyPlan ? (
                 <StudentStudyPlanTimeline plan={studyPlan} />
              ) : (
                (masteryData.length > 0 ? masteryData : PATH_DAYS).map((p, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ y: -5 }}
                    className={`flex-1 p-6 rounded-3xl border transition-all duration-500 relative ${
                      p.active || idx === 0 ? 'bg-neon-purple/10 border-neon-purple shadow-[0_0_30px_rgba(188,19,254,0.15)]' : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {(p.active || idx === 0) && <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-neon-purple text-white text-[8px] font-black px-3 py-1 rounded-full">ACTIVE NODE</div>}
                    <p className="text-gray-500 text-xs font-bold mb-2 uppercase">{p.day || 'Topic'}</p>
                    <h4 className="text-xl font-black mb-4">{p.topic}</h4>
                    
                    {/* Confidence Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <circle 
                          cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          strokeDasharray={175}
                          strokeDashoffset={175 - (175 * p.mastery) / 100}
                          className={(p.active || idx === 0) ? 'text-neon-purple' : 'text-neon-blue'}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-black">{p.mastery}%</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-8">
            <div className="glass-card p-6 border-b-4 border-neon-blue">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-tighter">
                  <Activity size={16} className="text-neon-blue" /> Adaptive Difficulty
                </h4>
                <div className="flex items-center gap-1">
                   <span className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-neon-blue uppercase">AI Auto-Syncing</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-500">CURRENT LEVEL: <span className="text-white">INTERMEDIATE</span></span>
                  <span className="text-neon-blue">{difficulty}%</span>
                </div>
                <input 
                  type="range" value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                />
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  "I've identified you're struggling with Recursion. I've lowered the complexity of the current quiz to optimize your learning state."
                </p>
              </div>
            </div>

            <div className="glass-card p-6 border-b-4 border-neon-purple">
               <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-tighter mb-4">
                  <Star size={16} className="text-neon-purple" /> Micro-Expression Insights
                </h4>
                <div className="space-y-4">
                   <div className="p-3 bg-neon-purple/5 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center text-neon-purple">
                         <Brain size={24} />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold">Confusion Pulse Detected</p>
                         <p className="text-[10px] text-gray-500">During "Big O" explanation at 12:45</p>
                      </div>
                   </div>
                   <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all">WATCH 2-MIN EXPLAINER</button>
                </div>
            </div>
          </div>
        </div>

        {/* Right: Study Buddy Chat */}
        <div className="col-span-4 flex flex-col gap-8">
           <div className={`glass-card flex-1 p-6 flex flex-col relative transition-all duration-700 ${chatOpen ? 'border-neon-blue shadow-[0_0_40px_rgba(0,242,255,0.1)]' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-tighter text-sm">
                    <Sparkles size={16} className="text-neon-blue" /> Study Buddy AI
                 </h3>
                 <span className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-4">
                 {chatHistory.map((msg, i) => (
                    <div key={i} className={`p-4 rounded-2xl ${msg.role === 'assistant' ? 'bg-white/5 rounded-tl-none mr-12' : 'bg-neon-blue/10 rounded-tr-none ml-12 border border-neon-blue/20'}`}>
                       <p className="text-xs leading-relaxed">{msg.text}</p>
                    </div>
                 ))}
              </div>
              
              <div className="relative mt-auto">
                 <input 
                    type="text" value={message} onChange={e => setMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask your coach anything..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs outline-none focus:border-neon-blue transition-all"
                 />
                 <button onClick={handleSendMessage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-neon-blue text-black rounded-lg hover:scale-110 transition-all">
                    <Send size={16} />
                 </button>
              </div>
           </div>

          <div className="glass-card p-8 flex flex-col gap-6 border-neon-purple/20 bg-linear-to-br from-neon-purple/5 to-transparent shadow-2xl">
            <div className="flex justify-between items-center">
               <h3 className="text-xs font-black text-neon-purple uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={16} /> NEURAL ASSESSMENT CENTER
               </h3>
               <span className="px-3 py-1 bg-neon-purple text-white text-[8px] font-black rounded-full shadow-lg shadow-neon-purple/20">2 ACTIVE</span>
            </div>

            <div className="space-y-4">
               {quizzes.length > 0 ? quizzes.map((quiz) => (
                  <div key={quiz.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-neon-purple/40 transition-all group flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-bold text-gray-200 group-hover:text-neon-purple transition-colors">{quiz.title}</h4>
                        <div className="flex gap-3 mt-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                           <span>{quiz.timeLimit} MINS</span>
                           <span>•</span>
                           <span>{quiz.questions?.length || 0} NEURONS</span>
                        </div>
                     </div>
                     <a href={`/student/quiz/${quiz.id}`} className="px-5 py-2.5 bg-neon-purple text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all uppercase tracking-tighter">
                        ATTEND
                     </a>
                  </div>
               )) : (
                  <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No Active Neurons Found</p>
                  </div>
               )}
            </div>
            
            <div className="mt-2 p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 flex items-center gap-3">
               <Shield className="text-gray-500" size={14} />
               <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">Proctoring Forensic Layer v1.0.4 Online</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
