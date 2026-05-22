import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export function InputArea({ onSendMessage, disabled }: InputAreaProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }

    // Prefill chat input listener
    const handlePrefill = (e: any) => {
      if (e.detail) {
        setText(e.detail);
      }
    };
    window.addEventListener('nino-prefill-chat', handlePrefill);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.removeEventListener('nino-prefill-chat', handlePrefill);
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text);
      setText('');
      if (isListening) {
        recognitionRef.current.stop();
      }
    }
  };

  return (
    <div className="relative">
      {/* Waveform animation for listening state */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-1"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [8, 24, 8] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                className="w-1 rounded-full bg-[#49111c]"
              />
            ))}
            <span className="ml-2 text-xs font-bold text-[#a9927d]">Listening to Chef...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 border border-[#5e503f] bg-[#0a0908] p-2 transition-all focus-within:border-[#a9927d]">
        <button
          onClick={toggleListening}
          className={`flex h-12 w-12 items-center justify-center transition-all ${
            isListening 
              ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
              : 'text-[#5e503f] hover:text-[#f2f4f3]'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="LET HIM COOK"
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-[#5e503f] tracking-widest uppercase font-mono"
          disabled={disabled}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex h-12 w-12 items-center justify-center bg-[#49111c] text-[#f2f4f3] transition-all hover:bg-[#5e503f] active:scale-[0.95] disabled:opacity-5"
        >
          {disabled ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
