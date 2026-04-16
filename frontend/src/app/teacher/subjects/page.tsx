'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, Search, Edit3, Trash2, 
  Layers, ChevronRight, Globe,
  PlusCircle, X
} from 'lucide-react';

export default function SubjectsCMS() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', grade: '', icon: 'ðŸ“š', topics: 0 });

  // 1. SYNC WITH NEURAL STORE
  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/cms/data');
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Neural Store Sync Error:', err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // 2. CREATE NEW DISCIPLINE
  const handleAddSubject = async () => {
    if (!newSubject.name) return;
    try {
      const res = await fetch('http://localhost:8000/api/cms/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSubject, id: Date.now() })
      });
      if (res.ok) {
        fetchSubjects();
        setShowAddModal(false);
        setNewSubject({ name: '', grade: '', icon: '📚', topics: 0 });
      } else {
        console.error('API Rejection:', await res.text());
      }
    } catch (err) {
      console.error('Connectivity Failure:', err);
    }
  };

  const handleDelete = async (id: number) => {
     console.log('Deleting Neuron:', id);
     alert('Neuron cleanup protocol initiated.');
  };

  return (
    <div className="min-h-screen p-8 custom-scrollbar relative">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter neon-text-blue mb-2 uppercase">
            Academic CMS <span className="text-white/20">|</span> Subject Control
          </h1>
          <p className="text-gray-400 text-sm font-medium italic">Architect curriculum topic trees and manage core academic metadata.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-neon-blue text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,242,255,0.2)]"
        >
          <FolderPlus size={18} /> Deploy New Discipline
        </button>
      </header>

      {/* Global Filter Bar */}
      <div className="grid grid-cols-12 gap-8 mb-12">
        <div className="col-span-8 glass-card p-2 flex items-center gap-4 border-neon-blue/10 bg-white/2">
          <Search className="ml-4 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search academic nodes..."
            className="flex-1 bg-transparent border-none outline-none text-sm py-4 font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-span-4 flex gap-4">
           <button className="flex-1 glass-card text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-neon-blue transition-all">Export Matrix</button>
           <button className="flex-1 glass-card text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-neon-blue transition-all">Bulk Sync</button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((subject, idx) => (
          <motion.div 
            key={subject.id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card group hover:border-neon-blue/40 transition-all duration-500 overflow-hidden relative bg-linear-to-br from-white/2 to-transparent"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{subject.icon}</div>
                <div className="flex gap-2">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(subject.id)} className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500/50 hover:text-red-500 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black mb-2 tracking-tighter">{subject.name}</h3>
              <p className="text-gray-500 text-[10px] font-black uppercase mb-8 tracking-[0.3em]">{subject.grade || 'GRADUATE'} LEVEL</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white/5 p-5 rounded-3xl border border-white/5 group-hover:border-neon-blue/20 transition-all">
                    <Layers className="text-neon-blue mb-2" size={20} />
                    <p className="text-2xl font-black leading-none mb-1">{subject.topics}</p>
                    <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Active Topics</p>
                 </div>
                 <div className="bg-white/5 p-5 rounded-3xl border border-white/5 group-hover:border-neon-purple/20 transition-all">
                    <Globe className="text-neon-purple mb-2" size={20} />
                    <p className="text-2xl font-black leading-none mb-1">2026</p>
                    <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Schema Rev</p>
                 </div>
              </div>

              <button className="w-full py-4 rounded-2xl border border-white/5 bg-white/3 hover:bg-neon-blue hover:text-black font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                MANAGE TOPIC TREE <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}

        <motion.div 
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.02 }}
          className="glass-card border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-gray-600 hover:text-neon-blue hover:border-neon-blue/40 cursor-pointer transition-all bg-white/1"
        >
          <PlusCircle size={48} className="mb-4 opacity-10" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Discipline</span>
        </motion.div>
      </div>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
               className="glass-card max-w-lg w-full p-12 relative border-neon-blue/20"
             >
                <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X size={24}/></button>
                <h2 className="text-3xl font-black mb-1 neon-text-blue uppercase tracking-tighter">Initialize Node</h2>
                <p className="text-gray-500 text-xs mb-10 font-medium">Deploy a new discipline to the Neural CMS matrix.</p>
                
                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Discipline Nomenclature</label>
                      <input 
                        type="text" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                        placeholder="e.g. Quantum Computing" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-neon-blue transition-all font-black" 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Level</label>
                         <input 
                           type="text" value={newSubject.grade} onChange={e => setNewSubject({...newSubject, grade: e.target.value})}
                           placeholder="UG-4" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs outline-none focus:border-neon-blue transition-all" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Emoji Icon</label>
                         <input 
                           type="text" value={newSubject.icon} onChange={e => setNewSubject({...newSubject, icon: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center text-xl outline-none focus:border-neon-blue transition-all" 
                         />
                      </div>
                   </div>
                   <button 
                     onClick={handleAddSubject}
                     className="w-full py-5 bg-neon-blue text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-neon-blue/20 hover:scale-[1.02] transition-all"
                   >
                      DEPLOY DISCIPLINE
                   </button>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
