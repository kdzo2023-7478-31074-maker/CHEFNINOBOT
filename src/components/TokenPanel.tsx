import { NlpAnalysis, Token } from '../lib/nlp';
import { Sparkles, Utensils, Flame, Layers } from 'lucide-react';

interface TokenPanelProps {
  analysis: NlpAnalysis;
}

export function TokenPanel({ analysis }: TokenPanelProps) {
  // Map sentiment to colored labels
  const getSentimentLabel = (sentiment?: string) => {
    switch (sentiment) {
      case 'excited': return 'Positive / Excited ✨';
      case 'hungry': return 'Craving / Hungry 🤤';
      case 'frustrated': return 'Frustrated / Challenged 😤';
      case 'stressed': return 'Stressed / Busy 😰';
      default: return 'Neutral / Calm 😐';
    }
  };

  const getSentimentTextClass = (sentiment?: string) => {
    switch (sentiment) {
      case 'excited': return 'text-emerald-400';
      case 'hungry': return 'text-amber-400';
      case 'frustrated': return 'text-rose-400';
      case 'stressed': return 'text-orange-400';
      default: return 'text-zinc-500';
    }
  };

  // Categorized ingredients
  const hasIngredients = Object.keys(analysis.ingredientCategories || {}).length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Lexical Token Breakdown */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#a9927d] mb-3 font-semibold font-mono">
          Lexical Token Analysis
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.tokens.map((token: Token, idx: number) => (
            <div
              key={idx}
              className={`group relative flex items-center justify-center border px-3 py-1.5 transition-all text-[10px] font-mono tracking-tighter ${
                token.type === 'punctuation'
                  ? 'border-dashed border-[#5e503f] text-[#5e503f]'
                  : token.isStopWord
                  ? 'border-[#5e503f] text-[#5e503f]/50'
                  : 'border-[#a9927d] text-[#f2f4f3] bg-[#0a0908]'
              }`}
            >
              <span>{token.text}</span>
              
              <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 scale-0 items-center justify-center rounded bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-0.5 text-[8px] font-bold transition-all group-hover:scale-100 uppercase tracking-widest whitespace-nowrap z-10 font-sans">
                 {token.isStopWord ? 'BASE' : token.type === 'punctuation' ? 'PUNCTUATION' : token.type}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 2. Structured Classification Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        
        {/* Card A: Request & Dish Classifications */}
        <div className="border border-[#5e503f]/40 bg-[#080706] p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#5e503f] font-mono font-bold mb-3 flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#a9927d]" />
              Query Classification
            </div>
            
            <div className="space-y-3.5">
              {/* Request Classification */}
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#a9927d]/60 mb-1">Intent Category</span>
                <span className="inline-flex items-center gap-1.5 bg-[#49111c]/20 border border-[#49111c]/30 text-[#f2f4f3] px-2 py-1 text-[10px] uppercase font-bold tracking-wider">
                  <Flame size={11} className="text-[#49111c]" />
                  {analysis.requestCategory || 'General Assistance'}
                </span>
              </div>

              {/* Dish Type Classification */}
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#a9927d]/60 mb-1">Dish Type Classification</span>
                <span className="inline-flex items-center gap-1.5 bg-zinc-900 border border-[#5e503f]/30 text-[#f2f4f3] px-2 py-1 text-[10px] uppercase font-extrabold tracking-wider">
                  <Utensils size={10} className="text-[#a9927d]" />
                  {analysis.dishType || 'Anytime Culinary Dish'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#5e503f]/20 pt-3 flex flex-col gap-1 text-[9px] font-mono text-[#a9927d]/70">
            <div>
              <span className="text-[#5e503f]">QUERY TYPE:</span> <span className="uppercase text-[#f2f4f3] tracking-widest">{analysis.queryType}</span>
            </div>
            <div>
              <span className="text-[#5e503f]">COOK SKILL:</span> <span className="uppercase text-[#f2f4f3] tracking-widest">{analysis.skillLevel}</span>
            </div>
          </div>
        </div>

        {/* Card B & C: Ingredient Categories List */}
        <div className="md:col-span-2 border border-[#5e503f]/40 bg-[#080706] p-4 flex flex-col justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#5e503f] font-mono font-bold mb-3 flex items-center gap-1.5">
              <Layers size={11} className="text-[#a9927d]" />
              Parsed Ingredients Classification
            </div>

            {hasIngredients ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(analysis.ingredientCategories).map(([categoryName, items]) => (
                  <div key={categoryName} className="space-y-1.5">
                    <span className="block text-[8px] uppercase tracking-widest text-[#a9927d] font-bold border-b border-[#5e503f]/20 pb-0.5">
                      {categoryName}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span 
                          key={item} 
                          className="px-2 py-0.5 border border-[#5e503f]/20 bg-[#0c0a08] text-[#f2f4f3] text-[9.5px] lowercase font-mono rounded-sm hover:border-[#a9927d]/40 transition-colors"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] italic text-[#5e503f] max-w-xs font-mono">
                  No explicit primary ingredients matched. Chef Nino is procedurally utilizing his base pantry essentials (herbs, seasonings, aromatics).
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[#5e503f]/20 pt-3 mt-4 flex items-center justify-between text-[9px] font-mono text-[#a9927d]/70">
            <div className="flex items-center gap-1">
              <span className="text-[#5e503f]">SENTIMENT:</span> 
              <span className={`font-bold uppercase tracking-wider ${getSentimentTextClass(analysis.sentiment)}`}>
                {getSentimentLabel(analysis.sentiment)}
              </span>
            </div>
            <div>
              <span className="text-[#5e503f]">SCORE:</span> <span className="text-zinc-300">{(analysis.sentimentScore * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Stats Bar */}
      <div className="flex items-center gap-6 border-t border-[#5e503f]/20 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#a9927d]">
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#a9927d]" />
            <span>Tokens: {analysis.tokenCount}</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#49111c] shadow-[0_0_4px_#49111c]" />
            <span>Flavors: {analysis.contentWords.length}</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#5e503f]" />
            <span>Parsing Time: {analysis.processingMs}ms</span>
         </div>
      </div>
    </div>
  );
}
