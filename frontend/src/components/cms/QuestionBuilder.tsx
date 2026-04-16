'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, X, Plus, Trash2, Code, Type, 
  HelpCircle, Sparkles, Tag, Clock,
  Image as ImageIcon
} from 'lucide-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface QuestionBuilderProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function QuestionBuilder({ onSave, onCancel, initialData }: QuestionBuilderProps) {
  const [type, setType] = useState(initialData?.type || 'MCQ');
  const [text, setText] = useState(initialData?.text || '');
  const [options, setOptions] = useState(initialData?.options || [{ id: 1, text: '', isCorrect: false }]);
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Medium');

  const addOption = () => {
    setOptions([...options, { id: Date.now(), text: '', isCorrect: false }]);
  };

  const removeOption = (id: number) => {
    setOptions(options.filter((o: any) => o.id !== id));
  };

  const setCorrect = (id: number) => {
    setOptions(options.map((o: any) => ({ ...o, isCorrect: o.id === id })));
  };

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-3xl overflow-hidden rounded-3xl border border-white/5">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
         <div>
            <h2 className="text-2xl font-black neon-text-purple uppercase tracking-tighter">Neuron Architect</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Multi-Type Content Engine</p>
         </div>
         <div className="flex gap-4">
            <button onClick={onCancel} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-500">
               <X size={20} />
            </button>
            <button 
              onClick={() => onSave({ type, text, options, difficulty })}
              className="flex items-center gap-2 px-8 py-3 bg-neon-purple text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-neon-purple/20"
            >
               <Save size={16} /> Deploy Neuron
            </button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12">
        {/* Type Selector */}
        <div className="grid grid-cols-4 gap-4">
           {['MCQ', 'Text', 'Coding', 'T/F'].map(t => (
             <button
               key={t}
               onClick={() => setType(t)}
               className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-2 ${
                 type === t ? 'bg-neon-purple/10 border-neon-purple text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
               }`}
             >
                {t === 'MCQ' && <Type size={20} />}
                {t === 'Coding' && <Code size={20} />}
                {t === 'Text' && <HelpCircle size={20} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-2 gap-12">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                 <Sparkles size={12} className="text-neon-purple" /> Question Payload (Markdown/LaTeX)
              </label>
              <textarea 
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 placeholder="Search complexity of $O(\log n)$..."
                 className="w-full h-64 bg-white/5 border border-white/10 rounded-3xl p-8 text-sm outline-none focus:border-neon-purple transition-all font-mono leading-relaxed"
              />
           </div>
           
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Real-time Preview</label>
              <div className="w-full h-64 glass-card p-8 overflow-y-auto border-neon-purple/20 bg-linear-to-br from-neon-purple/5 to-transparent">
                 <p className="text-sm leading-relaxed text-gray-300">
                    {text.split('$').map((part: string, i: number) => (
                      i % 2 === 1 ? <InlineMath key={i} math={part} /> : part
                    ))}
                 </p>
                 {!text && <p className="text-gray-600 italic text-xs">Live visualization of your neuron content will appear here...</p>}
              </div>
           </div>
        </div>

        {/* Dynamic Options for MCQ */}
        {type === 'MCQ' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Distractor & Correction Options</label>
                <button onClick={addOption} className="text-[10px] font-black uppercase text-neon-blue flex items-center gap-2 hover:bg-neon-blue/10 px-3 py-1 rounded-full transition-all">
                  <Plus size={14} /> Add Choice
                </button>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {options.map((opt: any, idx: number) => (
                   <div key={opt.id} className="flex gap-4 group">
                      <button 
                        onClick={() => setCorrect(opt.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all ${
                          opt.isCorrect ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-500 border border-white/5 group-hover:border-white/20'
                        }`}
                      >
                         {opt.isCorrect ? 'TRUE' : String.fromCharCode(65 + idx)}
                      </button>
                      <input 
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx].text = e.target.value;
                          setOptions(newOpts);
                        }}
                        placeholder="Option variant content..."
                        className={`flex-1 bg-white/5 border rounded-2xl px-6 text-sm outline-none transition-all ${
                          opt.isCorrect ? 'border-green-500/30 font-bold' : 'border-white/10 focus:border-neon-purple'
                        }`}
                      />
                      <button onClick={() => removeOption(opt.id)} className="p-4 rounded-2xl hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-all">
                         <Trash2 size={20} />
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/5">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><Tag size={12}/> Taxonomy Tags</label>
              <input type="text" placeholder="recursion, binary-search" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none" />
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><Clock size={12}/> Time Budget (Sec)</label>
              <input type="number" defaultValue={60} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none" />
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><ImageIcon size={12}/> Forensic Visualization</label>
              <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[8px] font-black text-gray-600 hover:border-neon-purple/30 hover:text-neon-purple transition-all">
                 ATTACH SCHEMATIC
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
