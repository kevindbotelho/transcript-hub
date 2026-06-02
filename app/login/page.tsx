'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { AudioLines, Loader2, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Insira um e-mail válido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials' 
        ? 'Credenciais inválidas. Verifique seu e-mail e senha.' 
        : authError.message
      );
      setIsLoading(false);
    } else {
      router.refresh();
      router.push('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center items-center px-6 py-12 bg-[#080c14] selection:bg-cyan-300/20 selection:text-cyan-200">
      
      {/* Background Canvas e Nebulosas Flutuantes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-80">
        <div className="aura-bg-blob-one absolute top-[-15%] left-[-15%] w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-blue-900/12 blur-[8.5rem] will-change-transform"></div>
        <div className="aura-bg-blob-two absolute bottom-[-20%] right-[-15%] w-[80vw] h-[80vw] sm:w-[55vw] sm:h-[55vw] rounded-full bg-cyan-900/10 blur-[9rem] will-change-transform"></div>
        <div className="aura-bg-blob-three absolute top-[30%] left-[25%] w-[40vw] h-[40vw] rounded-full bg-indigo-950/15 blur-[7rem] will-change-transform"></div>
        <div 
          className="aura-bg-dots absolute inset-0 opacity-[0.035]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', 
            backgroundSize: '2.5rem 2.5rem' 
          }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-auto space-y-8">
        
        {/* Header do Login */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-white to-slate-200 border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105">
              <AudioLines className="h-5 w-5 text-slate-950" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-4xl font-light tracking-[-0.04em] text-white font-jakarta">
              Transcript <span className="font-semibold text-cyan-400">Hub</span>
            </h2>
            <p className="text-sm text-slate-400 font-geist font-light">
              Acesse sua central pessoal de transcrições
            </p>
          </div>
        </div>

        {/* Card Form de Vidro (Glassmorphism) */}
        <div className="relative group">
          {/* Sombra de brilho sob o card */}
          <div 
            aria-hidden="true" 
            className="absolute inset-0 -z-10 rounded-[2rem] bg-cyan-500/[0.02] blur-2xl transition-all duration-500 group-hover:bg-cyan-500/[0.04]"
          ></div>
          
          <div className="rounded-[2rem] border border-white/[0.1] bg-[#090f1a]/75 p-8 shadow-2xl backdrop-blur-2xl transition duration-500 ease-out hover:border-cyan-300/30 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Feedback de erro */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-950/20 p-4 text-xs text-red-300 border border-red-500/15 font-geist">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <p>{error}</p>
                </div>
              )}

              {/* Input de E-mail */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[10px] font-mono-jb text-slate-400 uppercase tracking-wider">
                  E-mail
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className="block w-full rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_12px_rgba(34,211,238,0.15)] transition-all font-geist"
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-400 font-geist mt-1 pl-1">{errors.email.message}</p>
                )}
              </div>

              {/* Input de Senha */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[10px] font-mono-jb text-slate-400 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    className="block w-full rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_12px_rgba(34,211,238,0.15)] transition-all font-geist"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-[10px] text-red-400 font-geist mt-1 pl-1">{errors.password.message}</p>
                )}
              </div>

              {/* Botão Ciano Neon de Entrada */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 bg-gradient-to-b from-cyan-400 to-cyan-500 border border-cyan-400 text-slate-950 text-xs font-semibold shadow-[0_4px_12px_rgba(34,211,238,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 hover:from-cyan-300 hover:to-cyan-400 hover:shadow-[0_8px_20px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-geist cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Rodapé do Login */}
        <div className="text-center">
          <span className="px-2.5 py-1 rounded text-[9px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 uppercase font-mono-jb">
            Aura & Pulse Estética
          </span>
        </div>
      </div>
    </div>
  );
}

