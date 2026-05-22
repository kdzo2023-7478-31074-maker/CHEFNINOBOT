import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ChefHat, User, Volume2, VolumeX, Bookmark, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { NlpAnalysis } from '../lib/nlp';
import { saveMessageToJournal } from '../lib/journal';

interface MessageBubbleProps {
  message: any;
  analysis?: NlpAnalysis | null;
}

export function MessageBubble({ message, analysis }: MessageBubbleProps) {
  const isBot = message.role === 'assistant' || message.role === 'bot' || message.role === 'model';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = async () => {
    try {
      await saveMessageToJournal(message);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save message to journal:", e);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy recipe content:", err);
    }
  };

  const containsRecipe = isBot && (
    message.content.toLowerCase().includes('ingredient') ||
    message.content.toLowerCase().includes('instruction') ||
    message.content.toLowerCase().includes('recipe') ||
    message.content.toLowerCase().includes('directions') ||
    message.content.toLowerCase().includes('prep') ||
    message.content.toLowerCase().includes('cook') ||
    message.content.includes('- ') ||
    message.content.includes('* ') ||
    message.content.includes('1. ')
  );

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'excited': return '✨';
      case 'hungry': return '🤤';
      case 'frustrated': return '😤';
      case 'stressed': return '😰';
      default: return '😐';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'excited': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'hungry': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'frustrated': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'stressed': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex w-full gap-6 ${isBot ? 'justify-start' : 'justify-end flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm transition-all ${
        isBot ? 'bg-[#49111c] text-[#f2f4f3]' : 'bg-[#0a0908] text-[#a9927d] border border-[#5e503f]'
      }`}>
        {isBot ? <ChefHat size={18} /> : <User size={18} />}
      </div>

      {/* Content Container */}
      <div className={`flex max-w-[75%] flex-col gap-3 ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Helper Badges */}
        <div className="flex flex-wrap gap-2">
           {isBot && (
             <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#a9927d]">
               SOUS CHEF ADVICE
             </span>
           )}
           {!isBot && (message.sentiment || analysis) && (
             <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${getSentimentColor(message.sentiment || analysis?.sentiment)}`}>
               <span className="w-1 h-1 rounded-full bg-current" />
               {message.sentiment || analysis?.sentiment}
             </span>
           )}
           {!isBot && (message.keywords || analysis?.allKeywords)?.slice(0, 3).map((kw: string) => (
              <span key={kw} className="text-[9px] uppercase tracking-widest text-[#a9927d] font-bold">
                [{kw}]
              </span>
           ))}
        </div>

        {/* Main Bubble */}
        <div className={`relative px-6 py-5 transition-all ${
          isBot 
            ? 'bg-[#0a0908] border border-[#5e503f] text-[#f2f4f3]' 
            : 'bg-[#0a0908] border border-[#49111c]/30 text-[#f2f4f3]'
        }`}>
          <div className="prose prose-sm prose-invert max-w-none">
             <ReactMarkdown 
                components={{
                  strong: ({node, ...props}) => <strong className="text-white border-b border-white pb-0.5" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed font-light" {...props} />,
                  li: ({node, ...props}) => <li className="pl-0 before:content-['—'] before:mr-3 before:text-[#5e503f]" {...props} />
                }}
             >
                {message.content}
             </ReactMarkdown>
          </div>

          {/* Actions Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {isBot && (
              <button
                onClick={handleSpeak}
                className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] transition-all ${
                  isSpeaking ? 'text-[#49111c]' : 'text-[#5e503f] hover:text-[#f2f4f3]'
                }`}
              >
                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                {isSpeaking ? 'MUTE_SPEECH' : 'SAY_RECIPE'}
              </button>
            )}

            {containsRecipe && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] transition-all relative ${
                  isCopied ? 'text-emerald-500' : 'text-[#5e503f] hover:text-[#f2f4f3]'
                }`}
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                {isCopied ? 'RECIPE_COPIED' : 'COPY_RECIPE'}
              </button>
            )}
            
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] transition-all ${
                isSaved ? 'text-emerald-500' : 'text-[#5e503f] hover:text-[#f2f4f3]'
              }`}
            >
              {isSaved ? <Check size={12} /> : <Bookmark size={12} />}
              {isSaved ? 'SAVED_TO_JOURNAL' : 'SAVE_TO_JOURNAL'}
            </button>
          </div>
        </div>

        {/* Timestamp / Meta */}
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest text-[#5e503f] font-bold">
          <span>{message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</span>
          {isBot && analysis && (
            <>
              <span className="h-1 w-1 rounded-full bg-[#5e503f]" />
              <span>{analysis.cuisine || 'NON_SPECIFIC'} | {analysis.mealType || 'ALL_DAY'}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
