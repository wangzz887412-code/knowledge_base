import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PetState {
  mood: 'idle' | 'happy' | 'thinking' | 'sleepy' | 'excited';
  message: string | null;
  messageTimer: ReturnType<typeof setTimeout> | null;
}

const MESSAGES = {
  idle: [
    '有什么需要帮忙的吗？ 🐾',
    '点击我可以聊天哦～',
    '知识就是力量！✨',
    '今天也是元气满满的一天',
  ],
  happy: [
    '太棒了！🎉',
    '做得好！👏',
    '你真厉害！⭐',
  ],
  thinking: [
    '让我想想...🤔',
    '嗯...这个问题有意思',
    '正在思考中...💭',
  ],
  sleepy: [
    '呼...有点困了 💤',
    'Zzz... 🌙',
    '休息一下也不错～',
  ],
  excited: [
    '哇！太厉害了！🌟',
    '了不起的成就！🏆',
    '你真是天才！💎',
  ],
};

const MOOD_EMOJIS: Record<string, string> = {
  idle: '🐱',
  happy: '😸',
  thinking: '🤔',
  sleepy: '😴',
  excited: '🌟',
};

const DesktopPet: React.FC = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 140 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [petState, setPetState] = useState<PetState>({ mood: 'idle', message: null, messageTimer: null });
  const [showParticles, setShowParticles] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const petRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearMessage = useCallback(() => {
    setPetState(prev => {
      if (prev.messageTimer) clearTimeout(prev.messageTimer);
      return { ...prev, message: null, messageTimer: null };
    });
  }, []);

  const showMessage = useCallback((mood: PetState['mood']) => {
    const messages = MESSAGES[mood];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    clearMessage();

    const timer = setTimeout(() => {
      setPetState(prev => ({ ...prev, message: null, messageTimer: null }));
    }, 4000);

    setPetState({ mood, message: msg, messageTimer: timer });
  }, [clearMessage]);

  useEffect(() => {
    idleTimer.current = setInterval(() => {
      const moods: PetState['mood'][] = ['idle', 'happy', 'thinking', 'sleepy'];
      const mood = moods[Math.floor(Math.random() * moods.length)];
      if (Math.random() > 0.5) {
        showMessage(mood);
      }
      setPetState(prev => ({ ...prev, mood }));
      setTimeout(() => setPetState(prev => ({ ...prev, mood: 'idle' })), 3000);
    }, 15000);

    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
      clearMessage();
    };
  }, [showMessage, clearMessage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    setPetState(prev => ({ ...prev, mood: 'excited' }));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragStart.y));
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setPetState(prev => ({ ...prev, mood: 'idle' }));
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClick = () => {
    if (!isDragging) {
      setShowParticles(true);
      setPetState(prev => ({ ...prev, mood: 'happy' }));
      showMessage('happy');
      setTimeout(() => setShowParticles(false), 1000);
      setTimeout(() => setPetState(prev => ({ ...prev, mood: 'idle' })), 2000);
    }
  };

  const handleDoubleClick = () => {
    setPetState(prev => ({ ...prev, mood: 'excited' }));
    showMessage('excited');
    setTimeout(() => setPetState(prev => ({ ...prev, mood: 'idle' })), 3000);
  };

  const petSize = 56;
  const bubbleTailOffset = 20;

  return (
    <>
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed z-[9999] cursor-pointer select-none"
            style={{ right: 20, bottom: 20 }}
            onClick={() => setIsVisible(true)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
              <span className="text-lg">{MOOD_EMOJIS.idle}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={petRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed z-[9999] select-none"
            style={{
              left: position.x,
              top: position.y,
              width: petSize + 20,
              height: petSize + 20,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            <div className="relative">
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
                style={{
                  background: isDragging
                    ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                    : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
                animate={
                  isDragging
                    ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }
                    : petState.mood === 'sleepy'
                    ? {
                        y: [0, -3, 0],
                        rotate: [0, 1, -1, 0],
                        scale: [1, 0.97, 1],
                      }
                    : petState.mood === 'excited'
                    ? {
                        y: [0, -8, 0, -4, 0],
                        rotate: [0, 5, -5, 0],
                      }
                    : petState.mood === 'thinking'
                    ? {
                        rotate: [0, -3, 3, -3, 0],
                      }
                    : {
                        y: [0, -2, 0],
                      }
                }
                transition={
                  petState.mood === 'sleepy'
                    ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                    : petState.mood === 'excited'
                    ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
                    : petState.mood === 'thinking'
                    ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                }
              >
                <motion.span
                  className="text-2xl"
                  animate={
                    petState.mood === 'excited' ? { scale: [1, 1.3, 1] } : { scale: [1, 1.05, 1] }
                  }
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {MOOD_EMOJIS[petState.mood]}
                </motion.span>
              </motion.div>

              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                <div className="w-2 h-1.5 bg-indigo-300 rounded-full opacity-60" />
                <div className="w-2 h-1.5 bg-indigo-300 rounded-full opacity-60" />
              </div>

              <AnimatePresence>
                {petState.message && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="absolute z-50 whitespace-nowrap"
                    style={{
                      bottom: petSize + 16 + bubbleTailOffset,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="bg-white rounded-2xl px-3.5 py-2 shadow-xl border border-indigo-100 text-sm text-slate-700 font-medium relative">
                      {petState.message}
                      <div
                        className="absolute w-3 h-3 bg-white border-r border-b border-indigo-100 rotate-45"
                        style={{
                          bottom: -6,
                          left: '50%',
                          marginLeft: -6,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showParticles && (
                  <>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        animate={{
                          opacity: 0,
                          scale: 0,
                          x: (i - 2) * 20,
                          y: -30 - Math.random() * 20,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                        style={{ background: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa'][i] }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DesktopPet;