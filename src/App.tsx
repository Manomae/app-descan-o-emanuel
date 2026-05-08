/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Ajustado para o padrão mais comum
import { Play, Sparkles, Wind, Moon, Sun, Timer, ArrowLeft, Loader2, Pause, SkipForward } from 'lucide-react';
import { generateMeditationSession, generateVoiceover, generateVisual, MeditationSession } from './services/geminiService';

type AppState = 'landing' | 'generating' | 'playing' | 'finished';

const THEMES = [
  { id: 'inner-peace', name: 'Paz Interior', icon: <Wind className="w-5 h-5" />, color: 'from-blue-500/20 to-teal-500/20' },
  { id: 'deep-sleep', name: 'Sono Profundo', icon: <Moon className="w-5 h-5" />, color: 'from-indigo-500/20 to-purple-500/20' },
  { id: 'focus', name: 'Foco Mental', icon: <Sparkles className="w-5 h-5" />, color: 'from-amber-500/20 to-orange-500/20' },
  { id: 'anxiety-relief', name: 'Alívio de Estresse', icon: <Sun className="w-5 h-5" />, color: 'from-rose-500/20 to-pink-500/20' },
];

const VOICES = [
  { id: 'Kore', name: 'Kore (Calma)' },
  { id: 'Puck', name: 'Puck (Alegre)' },
  { id: 'Charon', name: 'Charon (Grave)' },
];

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(3);
  const [voice, setVoice] = useState<'Kore' | 'Puck' | 'Charon'>('Kore');
  const [session, setSession] = useState<MeditationSession | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [visualUrl, setVisualUrl] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

  // Otimização: Uso de useCallback para estabilidade da função
  const handleStart = useCallback(async () => {
    setState('generating');
    try {
      setLoadingStep('Criando sua sessão personalizada...');
      const newSession = await generateMeditationSession(topic || "relaxamento geral", duration);
      setSession(newSession);

      setLoadingStep('Gerando visuais relaxantes...');
      const visual = await generateVisual(newSession.visualPrompt);
      
      // Pré-carregamento da imagem para evitar flash branco
      const img = new Image();
      img.src = visual;
      setVisualUrl(visual);

      setLoadingStep('Preparando a narração...');
      const audio = await generateVoiceover(newSession.script, voice);
      
      // Pré-carregamento do áudio para garantir fluidez
      const audioPreload = new Audio();
      audioPreload.src = audio;
      audioPreload.preload = "auto";
      
      setAudioUrl(audio);
      setState('playing');
    } catch (error) {
      console.error("Erro na geração:", error);
      setState('landing');
      alert("Houve um problema ao conectar com a IA. Verifique sua conexão e tente novamente.");
    }
  }, [topic, duration, voice]);

  const handleReset = useCallback(() => {
    setState('landing');
    setSession(null);
    setAudioUrl(null);
    setVisualUrl(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans selection:bg-orange-500/30 overflow-hidden">
      <AnimatePresence mode="wait">
        {state === 'landing' && (
          <Landing 
            key="landing"
            topic={topic} 
            setTopic={setTopic} 
            duration={duration} 
            setDuration={setDuration}
            voice={voice}
            setVoice={(v: any) => setVoice(v)}
            onStart={handleStart} 
          />
        )}

        {state === 'generating' && (
          <Generating key="generating" step={loadingStep} />
        )}

        {state === 'playing' && session && audioUrl && (
          <Player 
            key="player"
            session={session} 
            audioUrl={audioUrl} 
            visualUrl={visualUrl} 
            onFinish={() => setState('finished')}
            onExit={handleReset}
          />
        )}

        {state === 'finished' && (
          <Finished key="finished" onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-componentes mantidos conforme sua estrutura original, apenas com ajustes de performance internos
function Landing({ topic, setTopic, duration, setDuration, voice, setVoice, onStart }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="max-w-xl mx-auto px-6 py-20 flex flex-col items-center text-center space-y-12 h-screen justify-center"
    >
      <div className="space-y-4">
        <h1 className="text-6xl font-serif font-light tracking-tight">FortimRelaxEmanuel</h1>
        <p className="text-gray-400 text-lg">Seu santuário movido a IA para momentos de reflexão.</p>
      </div>

      <div className="w-full space-y-8">
        <div className="grid grid-cols-2 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.name)}
              className={`p-4 rounded-3xl border border-white/10 transition-all flex items-center space-x-3 text-left
                ${topic === t.name ? 'bg-white/10 border-white/30 scale-[1.02]' : 'hover:bg-white/5'}`}
            >
              <div className={`p-2 rounded-2xl bg-gradient-to-br ${t.color}`}>{t.icon}</div>
              <span className="font-medium">{t.name}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/10">
            <div className="flex items-center space-x-3">
              <Timer className="text-gray-400 w-5 h-5" />
              <span className="text-gray-300 font-medium">{duration} Minutos</span>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={duration} 
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="accent-white cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all border 
                  ${voice === v.id ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white hover:bg-white/5'}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!topic}
          className={`w-full py-5 rounded-full font-semibold text-lg flex items-center justify-center space-x-2 transition-all shadow-2xl
            ${topic ? 'bg-white text-black hover:bg-gray-200 shadow-white/10' : 'bg-white/20 text-gray-500 cursor-not-allowed'}`}
        >
          <Play className="fill-current w-5 h-5" />
          <span>Iniciar Sessão</span>
        </button>
      </div>
    </motion.div>
  );
}

function Generating({ step }: { step: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col items-center justify-center space-y-8"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-2 border-dashed border-white/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
      <p className="text-gray-400 font-serif italic text-xl animate-pulse">{step}</p>
    </motion.div>
  );
}

function Player({ session, audioUrl, visualUrl, onFinish, onExit }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [breathState, setBreathState] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    const cycle = () => {
      setBreathState('inhale');
      setTimeout(() => setBreathState('hold'), 4000);
      setTimeout(() => setBreathState('exhale'), 8000);
    };
    const interval = setInterval(cycle, 12000);
    cycle();
    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => 
    (currentTime / (session.durationSeconds || 1)) * 100, 
    [currentTime, session.durationSeconds]
  );

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(e => console.error("Erro ao dar play:", e));
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {visualUrl && <img src={visualUrl} className="w-full h-full object-cover opacity-50" alt="Meditation" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-transparent to-[#0a0502]/80" />
      </div>

      <div className="absolute top-0 w-full p-8 flex justify-between items-center z-20">
        <button onClick={onExit} className="p-3 rounded-full hover:bg-white/10 transition-colors group">
          <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-medium tracking-[0.3em] uppercase text-gray-400 mb-1">Meditando agora</h2>
          <p className="font-serif italic text-xl">{session.title}</p>
        </div>
        <div className="w-12 h-12" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-16">
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: breathState === 'exhale' ? 1 : 1.5, opacity: breathState === 'inhale' ? 0.3 : 0.1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute w-64 h-64 rounded-full bg-white/10 border border-white/20"
          />
          <div className="w-48 h-48 rounded-full border border-white/40 backdrop-blur-md flex items-center justify-center">
             <p className="text-sm font-medium tracking-widest uppercase">{breathState === 'inhale' ? 'Inspire' : breathState === 'hold' ? 'Segure' : 'Expire'}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 space-y-4 w-80">
          <div className="flex items-center justify-center space-x-8">
            <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current translate-x-0.5" />}
            </button>
            <button onClick={onFinish} className="text-gray-400 hover:text-white transition-colors"><SkipForward className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={audioUrl} 
        autoPlay 
        onEnded={onFinish}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
    </motion.div>
  );
}

function Finished({ onReset }: { onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-screen flex flex-col items-center justify-center text-center px-6 space-y-8">
      <Sparkles className="w-16 h-16 text-white mb-4" />
      <h2 className="text-5xl font-serif">Paz Profunda</h2>
      <button onClick={onReset} className="px-10 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all">
        Voltar ao Santuário
      </button>
    </motion.div>
  );
}
