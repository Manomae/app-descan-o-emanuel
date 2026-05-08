/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, Wind, Moon, Sun, Timer, Volume2, ArrowLeft, Loader2, Pause, SkipForward } from 'lucide-react';
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

  const handleStart = async () => {
    setState('generating');
    try {
      setLoadingStep('Criando sua sessão personalizada...');
      const newSession = await generateMeditationSession(topic || "relaxamento geral", duration);
      setSession(newSession);

      setLoadingStep('Gerando visuais relaxantes...');
      const visual = await generateVisual(newSession.visualPrompt);
      setVisualUrl(visual);

      setLoadingStep('Preparando a narração...');
      const audio = await generateVoiceover(newSession.script, voice);
      setAudioUrl(audio);

      setState('playing');
    } catch (error) {
      console.error(error);
      setState('landing');
      alert("Algo deu errado. Por favor, tente novamente.");
    }
  };

  const handleReset = () => {
    setState('landing');
    setSession(null);
    setAudioUrl(null);
    setVisualUrl(null);
  };

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
            setVoice={(v) => setVoice(v as any)}
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

function Landing({ topic, setTopic, duration, setDuration, voice, setVoice, onStart }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-xl mx-auto px-6 py-20 flex flex-col items-center text-center space-y-12 h-screen justify-center"
    >
      <div className="space-y-4">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-serif font-light tracking-tight"
        >
          FortimRelaxEmanuel
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-lg"
        >
          Seu santuário movido a IA para momentos de reflexão.
        </motion.p>
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
              <div className={`p-2 rounded-2xl bg-gradient-to-br ${t.color}`}>
                {t.icon}
              </div>
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
          className="w-full py-5 rounded-full bg-white text-black font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors shadow-2xl shadow-white/10"
        >
          <Play className="fill-current w-5 h-5" />
          <span>Iniciar Sessão</span>
        </button>
      </div>
    </motion.div>
  );
}

interface GeneratingProps {
  step: string;
  key?: string;
}

function Generating({ step }: GeneratingProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col items-center justify-center space-y-8"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full border-2 border-dashed border-white/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
      <motion.p 
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-gray-400 font-serif italic text-xl"
      >
        {step}
      </motion.p>
    </motion.div>
  );
}

interface PlayerProps {
  session: MeditationSession;
  audioUrl: string;
  visualUrl: string | null;
  onFinish: () => void;
  onExit: () => void;
  key?: string;
}

function Player({ session, audioUrl, visualUrl, onFinish, onExit }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [breathState, setBreathState] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    // Breathing cycle: 4s inhale, 4s hold, 4s exhale
    const cycle = () => {
      setBreathState('inhale');
      setTimeout(() => setBreathState('hold'), 4000);
      setTimeout(() => setBreathState('exhale'), 8000);
    };
    const interval = setInterval(cycle, 12000);
    cycle();
    return () => clearInterval(interval);
  }, []);

  const breathLabels: Record<string, string> = {
    inhale: 'Inspire',
    hold: 'Segure',
    exhale: 'Expire'
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Visual */}
      <div className="absolute inset-0 z-0">
        <img 
          src={visualUrl} 
          className="w-full h-full object-cover opacity-50 transition-opacity duration-1000" 
          referrerPolicy="no-referrer"
          alt="Meditation backdrop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-transparent to-[#0a0502]/80" />
        
        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              x: [0, 100, 0], 
              y: [0, -100, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ 
              x: [0, -150, 0], 
              y: [0, 150, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-center z-20">
        <button 
          onClick={onExit}
          className="p-3 rounded-full hover:bg-white/10 transition-colors group"
        >
          <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-medium tracking-[0.3em] uppercase text-gray-400 mb-1">Meditando agora</h2>
          <p className="font-serif italic text-xl">{session.title}</p>
        </div>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      {/* Main Experience */}
      <div className="relative z-10 flex flex-col items-center space-y-16">
        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: breathState === 'inhale' ? 1.5 : breathState === 'hold' ? 1.5 : 1,
              opacity: breathState === 'inhale' ? 0.3 : 0.1
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute w-64 h-64 rounded-full bg-white/10 border border-white/20"
          />
          <motion.div
            animate={{ 
              scale: breathState === 'inhale' ? 1.3 : breathState === 'hold' ? 1.3 : 1,
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-48 h-48 rounded-full border border-white/40 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center">
              <motion.p 
                key={breathState}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium tracking-widest uppercase"
              >
                {breathLabels[breathState]}
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* Playback Controls */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 space-y-4 w-80">
          <div className="flex items-center justify-center space-x-8">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Loader2 className="w-5 h-5" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current translate-x-0.5" />}
            </button>
            <button 
              onClick={onFinish}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white" 
                style={{ width: `${(currentTime / (session.durationSeconds)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 font-medium">
              <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
              <span>{Math.floor(session.durationSeconds / 60)}:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio */}
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

interface FinishedProps {
  onReset: () => void;
  key?: string;
}

function Finished({ onReset }: FinishedProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-screen flex flex-col items-center justify-center text-center px-6 space-y-8"
    >
      <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <div className="space-y-4">
        <h2 className="text-5xl font-serif">Paz Profunda</h2>
        <p className="text-gray-400 max-w-sm mx-auto">Você completou sua sessão. Leve este momento de clareza com você ao longo do dia.</p>
      </div>
      <button
        onClick={onReset}
        className="px-10 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
      >
        Voltar ao Santuário
      </button>
    </motion.div>
  );
}

