import React, { useId, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

type TeamMember = {
  name: string;
  role: string;
};

type TimelineEntry = {
  stage: string;
  date: string;
  description: string;
  image?: string;
};

export const InputGroup = ({ label, value, onChange, isTextarea = false, description }: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  isTextarea?: boolean, 
  description?: string 
}) => {
  const inputId = useId();
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">
        {label}
        {description && (
          <span id={descriptionId} className="block mt-1 text-[8px] font-normal tracking-wide opacity-60 normal-case">
            {description}
          </span>
        )}
      </label>
      {isTextarea ? (
        <textarea
          id={inputId}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-describedby={descriptionId}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent min-h-[100px] resize-none text-sm transition-all"
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-describedby={descriptionId}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent transition-all text-sm"
        />
      )}
    </div>
  );
};

export const UploadBox = ({
  field,
  value,
  onUpload,
  progress,
  status,
  state,
  stateSetter,
  accept = 'image/*',
  mediaType = 'image',
  placeholder,
}: any) => {
  const urlInputId = useId();
  const fileInputId = useId();
  const uploadKey = Object.keys(progress).find(key => key.startsWith(`${field}_`));
  const isUploading = !!uploadKey;
  const currentProgress = uploadKey ? progress[uploadKey] : 0;
  const currentStatus = uploadKey ? status[uploadKey] : '';
  const isVideo = mediaType === 'video';

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-grow relative group">
          <input 
            id={urlInputId}
            type="text" 
            value={value || ''} 
            onChange={e => stateSetter((prev: any) => ({...prev, [field]: e.target.value}))} 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand-accent outline-none text-xs" 
            placeholder={placeholder || `Paste direct ${isVideo ? 'media' : 'image'} URL here...`} 
          />
        </div>
        <label className={cn(
          "cursor-pointer p-4 rounded-2xl transition-all h-full flex items-center justify-center min-w-[56px]",
          isUploading ? "bg-brand-accent text-brand-bg animate-pulse" : "glass hover:bg-white/10"
        )} htmlFor={fileInputId} aria-label={`Upload ${isVideo ? 'media' : 'image'} file`}>
          {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Plus size={20} /></motion.div> : <ImageIcon size={20} />}
          <input 
            id={fileInputId}
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={e => {
              const file = e.target.files?.[0];
              if(file) {
                onUpload(file, field, stateSetter);
                e.target.value = ''; 
              }
            }} 
          />
        </label>
      </div>
      {isUploading && (
        <div className="space-y-2">
          <div className="w-full bg-white/10 h-[2px] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${currentProgress}%` }} 
              className="bg-brand-accent h-full" 
            />
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-brand-accent">
            Uploading... {currentProgress}% 
            <span className="ml-2 opacity-60 font-medium normal-case tracking-normal">({currentStatus})</span>
          </p>
        </div>
      )}
      {value && !isUploading && (
        <div className="aspect-video w-32 rounded-lg overflow-hidden border border-white/10 relative group">
          {isVideo ? (
            <video src={value} className="w-full h-full object-cover" controls muted playsInline />
          ) : (
            <img src={value} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" alt="" />
          )}
          <button type="button" onClick={() => stateSetter((p: any) => ({...p, [field]: ''}))} className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex" aria-label="Remove uploaded media"><Trash2 size={16} /></button>
        </div>
      )}
    </div>
  );
};

export const ListManager = ({ label, items, onAdd, onRemove }: { 
  label: string, 
  items: string[], 
  onAdd: (v: string) => void, 
  onRemove: (i: number) => void 
}) => {
  const inputId = useId();
  const [val, setVal] = useState('');
  return (
    <div className="space-y-4">
      {label && <label htmlFor={inputId} className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 block font-black">{label}</label>}
      <div className="flex gap-2">
        <input 
          id={inputId}
          type="text" 
          value={val} 
          onChange={e => setVal(e.target.value)} 
          onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); onAdd(val); setVal(''); } }} 
          className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent text-sm" 
          placeholder="Add entry..." 
        />
        <button type="button" onClick={() => { onAdd(val); setVal(''); }} className="px-4 bg-white/10 rounded-xl hover:bg-brand-accent hover:text-brand-bg transition-all" aria-label={`Add ${label || 'entry'}`}><Plus size={16}/></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="px-3 py-1 glass rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group">
            {it} <button type="button" onClick={() => onRemove(i)} className="opacity-30 group-hover:opacity-100 hover:text-red-400" aria-label={`Remove ${it}`}><X size={10} /></button>
          </span>
        ))}
      </div>
    </div>
  );
};

export const ImagePhaseManager = ({
  title,
  field,
  images,
  onUpload,
  progress,
  status,
  state,
  stateSetter,
  onRemove,
  hideHeading = false,
  mediaType = 'image',
  accept,
}: any) => {
  const urlInputId = useId();
  const fileInputId = useId();
  const uploadingThisField = Object.keys(progress).filter(key => key.startsWith(`${field}_`));
  const isVideo = mediaType === 'video';

  return (
    <div className="space-y-6">
      {!hideHeading && <h4 className="text-xl font-black uppercase tracking-tighter">{title}</h4>}
      <div className="flex gap-4">
        <input 
          id={urlInputId}
          type="text" 
          placeholder={`Paste ${isVideo ? 'video' : 'image'} URL...`}
          className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm" 
          onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value; if(v){ stateSetter((prev: any) => ({...prev, [field]: [...(prev[field] || []), v]})); (e.target as HTMLInputElement).value = ''; } } }} 
        />
        <label htmlFor={fileInputId} className="cursor-pointer px-6 bg-white/10 rounded-2xl hover:bg-brand-accent hover:text-brand-bg transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs min-h-[56px]">
          <Plus size={18} /> Upload
          <input id={fileInputId} type="file" className="hidden" accept={accept || (isVideo ? "video/*" : "image/*")} multiple onChange={e => { 
            if(e.target.files) {
              Array.from(e.target.files).forEach(f => onUpload(f, field, stateSetter));
              e.target.value = ''; 
            }
          }} />
        </label>
      </div>
      
      {uploadingThisField.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 glass rounded-2xl border border-brand-accent/20 border-dashed">
          {uploadingThisField.map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-brand-accent">
                <span className="truncate max-w-[100px]">{key.split('_').pop()}</span>
                <span>{progress[key]}%</span>
              </div>
              <p className="text-[7px] text-white/40 truncate mb-1 italic">{status[key]}</p>
              <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress[key]}%` }} className="h-full bg-brand-accent" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {images.map((img: string, i: number) => (
          <div key={i} className={cn("relative group rounded-2xl overflow-hidden border border-white/5 shadow-lg", isVideo ? "aspect-video col-span-4 md:col-span-3 lg:col-span-4" : "aspect-square")}>
            {isVideo ? (
              <video src={img} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" controls muted playsInline />
            ) : (
              <img src={img} className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110" alt="" />
            )}
            <button type="button" onClick={() => onRemove(i)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remove ${title} item ${i + 1}`}><Trash2 size={24} className="text-white"/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ColorPaletteManager = ({ colors, onChange }: { 
  colors: { hex: string, emotion: string }[], 
  onChange: (v: { hex: string, emotion: string }[]) => void 
}) => {
  const [newColor, setNewColor] = useState({ hex: '#000000', emotion: '' });
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input type="color" value={newColor.hex} onChange={e => setNewColor({...newColor, hex: e.target.value})} className="w-16 h-12 bg-transparent border-none outline-none cursor-pointer rounded-lg overflow-hidden flex-shrink-0" />
        <input 
          type="text" 
          value={newColor.emotion} 
          onChange={e => setNewColor({...newColor, emotion: e.target.value})} 
          className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm" 
          placeholder="Emotion/Feeling..." 
        />
        <button type="button" onClick={() => { if(newColor.emotion){ onChange([...colors, newColor]); setNewColor({ hex: '#000000', emotion: '' }); } }} className="px-6 bg-white/10 rounded-xl hover:bg-brand-accent hover:text-brand-bg transition-all"><Plus size={18}/></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {colors.map((c, i) => (
          <div key={i} className="p-4 glass rounded-2xl flex items-center gap-4 relative group border border-white/5">
            <div className="w-10 h-10 rounded-lg shadow-inner flex-shrink-0" style={{ backgroundColor: c.hex }} />
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{c.hex}</p>
              <p className="text-xs text-brand-muted truncate italic">{c.emotion}</p>
            </div>
            <button type="button" onClick={() => onChange(colors.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-muted hover:text-red-400"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamManager = ({
  members,
  onChange,
}: {
  members: TeamMember[];
  onChange: (next: TeamMember[]) => void;
}) => {
  const [draft, setDraft] = useState<TeamMember>({ name: '', role: '' });

  const addMember = () => {
    const name = draft.name.trim();
    const role = draft.role.trim();
    if (!name && !role) return;
    onChange([...members, { name, role }]);
    setDraft({ name: '', role: '' });
  };

  const updateMember = (index: number, key: keyof TeamMember, value: string) => {
    onChange(members.map((member, memberIndex) => (
      memberIndex === index ? { ...member, [key]: value } : member
    )));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Team member</label>
          <input
            type="text"
            value={draft.name}
            onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm"
            placeholder="Name"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Role</label>
          <input
            type="text"
            value={draft.role}
            onChange={e => setDraft(prev => ({ ...prev, role: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm"
            placeholder="Role / contribution"
          />
        </div>
        <button type="button" onClick={addMember} className="h-[56px] px-6 bg-white/10 rounded-2xl hover:bg-brand-accent hover:text-brand-bg transition-all flex items-center gap-2 font-black uppercase tracking-widest text-xs">
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member, index) => (
          <div key={index} className="grid md:grid-cols-[1fr_1fr_auto] gap-4 p-6 glass rounded-[2rem] border border-white/5">
            <input
              type="text"
              value={member.name}
              onChange={e => updateMember(index, 'name', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent text-sm"
              placeholder="Name"
            />
            <input
              type="text"
              value={member.role}
              onChange={e => updateMember(index, 'role', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent text-sm"
              placeholder="Role"
            />
            <button type="button" onClick={() => onChange(members.filter((_, memberIndex) => memberIndex !== index))} className="w-12 h-12 text-brand-muted hover:text-red-400 transition-colors justify-self-end">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimelineManager = ({
  entries,
  onChange,
}: {
  entries: TimelineEntry[];
  onChange: (next: TimelineEntry[]) => void;
}) => {
  const [draft, setDraft] = useState<TimelineEntry>({
    stage: '',
    date: '',
    description: '',
    image: '',
  });

  const addEntry = () => {
    const stage = draft.stage.trim();
    const date = draft.date.trim();
    const description = draft.description.trim();
    const image = draft.image?.trim() || '';
    if (!stage && !date && !description && !image) return;
    onChange([...entries, { stage, date, description, image }]);
    setDraft({ stage: '', date: '', description: '', image: '' });
  };

  const updateEntry = (index: number, key: keyof TimelineEntry, value: string) => {
    onChange(entries.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [key]: value } : entry
    )));
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          value={draft.stage}
          onChange={e => setDraft(prev => ({ ...prev, stage: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm"
          placeholder="Stage"
        />
        <input
          type="text"
          value={draft.date}
          onChange={e => setDraft(prev => ({ ...prev, date: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm"
          placeholder="Date / marker"
        />
        <textarea
          value={draft.description}
          onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
          className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent min-h-[120px] resize-none text-sm"
          placeholder="What happened in this phase?"
        />
        <input
          type="text"
          value={draft.image}
          onChange={e => setDraft(prev => ({ ...prev, image: e.target.value }))}
          className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm"
          placeholder="Optional image URL"
        />
      </div>
      <button type="button" onClick={addEntry} className="px-6 py-4 bg-white/10 rounded-2xl hover:bg-brand-accent hover:text-brand-bg transition-all flex items-center gap-2 font-black uppercase tracking-widest text-xs">
        <Plus size={16} />
        Add Timeline Entry
      </button>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="space-y-4 p-6 glass rounded-[2rem] border border-white/5">
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-4">
              <input
                type="text"
                value={entry.stage}
                onChange={e => updateEntry(index, 'stage', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent text-sm"
                placeholder="Stage"
              />
              <input
                type="text"
                value={entry.date}
                onChange={e => updateEntry(index, 'date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent text-sm"
                placeholder="Date"
              />
              <button type="button" onClick={() => onChange(entries.filter((_, entryIndex) => entryIndex !== index))} className="w-12 h-12 text-brand-muted hover:text-red-400 transition-colors justify-self-end">
                <Trash2 size={18} />
              </button>
            </div>
            <textarea
              value={entry.description}
              onChange={e => updateEntry(index, 'description', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-brand-accent min-h-[120px] resize-none text-sm"
              placeholder="Description"
            />
            <input
              type="text"
              value={entry.image || ''}
              onChange={e => updateEntry(index, 'image', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent text-sm"
              placeholder="Optional image URL"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
