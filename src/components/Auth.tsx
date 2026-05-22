import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChefHat, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: username }
          }
        });
        if (error) throw error;
        setError("Account created! You can now log in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0908] p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm space-y-12 border border-[#5e503f] bg-[#0a0908] p-12"
      >
        <div className="relative">
          <div className="absolute -top-6 -left-6 text-[80px] font-serif italic opacity-[0.03] pointer-events-none">Auth</div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[10px] bg-[#49111c] text-[#f2f4f3] px-2 py-1 font-bold">KITCHEN ACCESS</span>
            <span className="h-px w-12 bg-[#5e503f]" />
          </div>
          <h2 className="font-serif text-5xl font-light tracking-tighter text-[#f2f4f3]">
            {isLogin ? 'Chef\nSign-In' : 'Register\nNew Chef'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#a9927d] font-bold">Chef Name</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0908] border border-[#5e503f] py-4 px-4 text-sm outline-none transition-all focus:border-[#a9927d] text-[#f2f4f3]"
                placeholder="CHEF_NAME"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-[#a9927d] font-bold">Chef Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0908] border border-[#5e503f] py-4 px-4 text-sm outline-none transition-all focus:border-[#a9927d] text-[#f2f4f3]"
              placeholder="CHEF_EMAIL"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-[#a9927d] font-bold">Passcode</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0908] border border-[#5e503f] py-4 px-4 text-sm outline-none transition-all focus:border-[#a9927d] text-[#f2f4f3]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 bg-[#49111c] py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-[#f2f4f3] transition-all hover:bg-[#5e503f] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Enter Kitchen' : 'Register Service'}</span>
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-widest text-[#a9927d] hover:text-[#f2f4f3] transition-all font-bold"
          >
            {isLogin ? "Join the Kitchen Crew" : "Already a Registered Chef?"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
