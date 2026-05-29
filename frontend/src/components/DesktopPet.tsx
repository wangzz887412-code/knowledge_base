import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePetTask, PetTaskStatus } from '../contexts/TaskContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PIKACHU_IMG = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';
const STORAGE_KEY = 'pika-pet-position';
const PIKACHU_PREFIX = '[你是皮卡丘，请用皮卡丘的口吻回答，每句话都要包含"Pika"，自称"皮卡丘"，称呼用户为"主人"。活泼可爱，带emoji表情。] ';

const SAJIAO_MESSAGES = [
  'Pika pika～ ⚡',
  'Pika～chu！💛',
  'Pi...ka...chu～ ✨',
  'Chu～来陪皮卡丘玩嘛！',
  'Pika！戳戳我嘛～ 💕',
  'Pika pi... 主人不理我了吗？😢',
  '有什么需要皮卡丘帮忙的？',
  '最喜欢和主人在一起了～ Pika！',
];

const TASK_MESSAGES: Record<PetTaskStatus, string[]> = {
  idle: [],
  uploading: ['Pika pika！搬运中～ 📦', '嘿咻嘿，十万伏特加速！⚡', 'Pika～数据传输中...'],
  processing: ['Pika...认真思考中～ 🧠', '让我用十万伏特分析一下！⚡', 'Pika pika！AI 大脑全开！'],
  completed: ['Pika！完成啦！', '皮卡～丘！任务完美达成！✨', '主人好厉害！Pika pika！'],
  failed: ['Pika...出了点问题 ', '皮卡丘会继续加油的！', '十万伏特短路了...需要主人帮忙 '],
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

function ChatPanel({ onClose, onSajiao }: { onClose: () => void; onSajiao: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Pika pika！⚡ 皮卡丘在这里！主人想聊什么呢？', id: 'welcome' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: userContent, id: `u-${Date.now()}` };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    onSajiao();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Pika... 请先登录再和皮卡丘聊天！');
      }

      const pikachuMessage = PIKACHU_PREFIX + userContent;
      const payload: Record<string, any> = { message: pikachuMessage };
      if (chatId !== null && chatId !== undefined) {
        payload.chat_id = String(chatId);
      }

      console.log('发送AI聊天请求:', {
        url: 'http://localhost:8000/api/ai/chat/',
        payload,
        tokenLength: token.length,
      });

      const response = await fetch('http://localhost:8000/api/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('AI 聊天请求失败详情:', {
          status: response.status,
          statusText: response.statusText,
          body: errText,
          requestPayload: payload,
        });
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log('AI 聊天响应:', data);
      
      if (data.chat_id) setChatId(data.chat_id);

      const aiResponse = data.response || 'Pika... 皮卡丘也不知道呢 ';
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse, id: `a-${Date.now()}` }]);
    } catch (error: any) {
      console.error('AI 聊天请求失败:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Pika... 十万伏特短路了  网络出了点问题... (${error.message || ''})`,
        id: `e-${Date.now()}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-72 h-80 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%)', border: '1px solid rgba(247,208,44,0.3)' }}
    >
      <div className="px-3 py-2 flex items-center justify-between flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #F7D02C 0%, #E5B820 100%)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-xs font-bold text-stone-800">皮卡丘聊天</span>
        </div>
        <button onClick={onClose}
          className="w-5 h-5 rounded-full flex items-center justify-center text-stone-700 hover:bg-white/30 transition-colors">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l8 8M9 1l-8 8" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-3 py-2 text-xs leading-relaxed"
              style={{
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #F7D02C, #E5B820)' : 'rgba(255,255,255,0.8)',
                color: msg.role === 'user' ? '#1a1510' : '#2C2416',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  p: ({ children }) => <span className="text-xs">{children}</span>,
                  strong: ({ children }) => <span className="font-bold">{children}</span>,
                  em: ({ children }) => <span className="italic">{children}</span>,
                }}>{msg.content || '...'}</ReactMarkdown>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
              {msg.role === 'assistant' && isLoading && msg.content === '' && (
                <span className="inline-block animate-pulse">...</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: 'rgba(139,90,43,0.1)' }}>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="和皮卡丘说话..."
            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(139,90,43,0.1)', color: '#2C2416' }}
            disabled={isLoading} />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F7D02C, #E5B820)', color: '#1a1510', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {isLoading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}></motion.span>
            ) : '↑'}
          </button>
        </div>
      </div>
    </div>
  );
}

type PetAction = 'idle' | 'walking-right' | 'walking-left' | 'interact' | 'working' | 'sleepy' | 'happy';

const FRAME_CONFIG: Record<PetAction, { frames: number; fps: number; loop: boolean }> = {
  'idle': { frames: 8, fps: 4, loop: true },
  'walking-right': { frames: 8, fps: 6, loop: true },
  'walking-left': { frames: 8, fps: 6, loop: true },
  'interact': { frames: 4, fps: 5, loop: false },
  'working': { frames: 4, fps: 3, loop: true },
  'sleepy': { frames: 4, fps: 2, loop: true },
  'happy': { frames: 4, fps: 6, loop: true },
};

function SpriteAnimator({ action, isPaused, onClick, onRightClick }: {
  action: PetAction;
  isPaused: boolean;
  onClick: (e: React.MouseEvent) => void;
  onRightClick: (e: React.MouseEvent) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const config = FRAME_CONFIG[action];

  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, _frame: number, w: number, h: number) => {
    if (!imgRef.current || !imgRef.current.complete) return;

    const frameW = imgRef.current.width;
    const frameH = imgRef.current.height;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgRef.current, 0, 0, frameW, frameH, 0, 0, w, h);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      frameIndexRef.current = 0;
    };
    img.src = PIKACHU_IMG;

    return () => { imgRef.current = null; };
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = FRAME_CONFIG[action];
    lastFrameTimeRef.current = performance.now();
    frameIndexRef.current = 0;

    const animate = (time: number) => {
      if (isPaused) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const elapsed = time - lastFrameTimeRef.current;
      const frameDuration = 1000 / config.fps;

      if (elapsed >= frameDuration) {
        lastFrameTimeRef.current = time;
        frameIndexRef.current = (frameIndexRef.current + 1) % config.frames;

        if (!config.loop && frameIndexRef.current === config.frames - 1) {
          return;
        }

        if (imgRef.current && imgRef.current.complete) {
          drawFrame(ctx, frameIndexRef.current, canvas.width, canvas.height);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [action, isPaused, config.fps, config.loop, config.frames, drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (imgRef.current && imgRef.current.complete) {
      drawFrame(ctx, frameIndexRef.current, canvas.width, canvas.height);
    }
  }, [drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      onClick={onClick}
      onContextMenu={onRightClick}
      className="cursor-grab active:cursor-grabbing"
      style={{ imageRendering: 'auto' }}
    />
  );
}

function ContextMenu({ position, items, onClose }: {
  position: { x: number; y: number };
  items: { label: string; icon: string; onClick: () => void }[];
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed z-[10001] rounded-xl overflow-hidden shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        background: 'linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%)',
        border: '1px solid rgba(247,208,44,0.3)',
        minWidth: 140,
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className="w-full px-4 py-2.5 text-sm flex items-center gap-3 transition-colors text-left"
          style={{
            color: '#2C2416',
            borderBottom: i < items.length - 1 ? '1px solid rgba(139,90,43,0.08)' : 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(247,208,44,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span className="text-sm">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

const DesktopPet: React.FC = () => {
  const { task } = usePetTask();

  const getDefaultPosition = () => ({
    x: Math.max(0, window.innerWidth - 180),
    y: Math.max(0, window.innerHeight - 260),
  });

  const loadPosition = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        const x = Math.max(0, Math.min(window.innerWidth - 150, pos.x));
        const y = Math.max(0, Math.min(window.innerHeight - 250, pos.y));
        return { x, y };
      }
    } catch { /* ignore */ }
    return getDefaultPosition();
  }, []);

  const [position, setPosition] = useState(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [petAction, setPetAction] = useState<PetAction>('idle');
  const [baseAction, setBaseAction] = useState<PetAction>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isFacedLeft, setIsFacedLeft] = useState(false);

  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPosition = useRef(position);

  useEffect(() => {
    lastPosition.current = position;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch { /* ignore */ }
  }, [position]);

  const clearMessageTimeout = useCallback(() => {
    if (messageTimer.current) { clearTimeout(messageTimer.current); messageTimer.current = null; }
  }, []);

  const showPetMessage = useCallback((msg: string, duration: number = 4000) => {
    clearMessageTimeout();
    setMessage(msg);
    messageTimer.current = setTimeout(() => setMessage(null), duration);
  }, [clearMessageTimeout]);

  const triggerInteraction = useCallback(() => {
    setIsInteracting(true);
    setPetAction('interact');
    showPetMessage(SAJIAO_MESSAGES[Math.floor(Math.random() * SAJIAO_MESSAGES.length)], 4000);
    spawnParticles(4, 60, 60);

    setTimeout(() => {
      setIsInteracting(false);
      if (task.status === 'idle') {
        setPetAction(baseAction);
      }
    }, 1500);
  }, [baseAction, task.status, showPetMessage]);

  const spawnParticles = (count: number, baseX: number, baseY: number) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: baseX + (Math.random() - 0.5) * 40,
      y: baseY + (Math.random() - 0.5) * 30,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id < Date.now()));
    }, 1200);
  };

  useEffect(() => {
    if (isInteracting || isDragging) return;

    switch (task.status) {
      case 'uploading':
      case 'processing':
        setPetAction('working');
        setBaseAction('working');
        showPetMessage(TASK_MESSAGES[task.status][Math.floor(Math.random() * TASK_MESSAGES[task.status].length)], 5000);
        break;
      case 'completed':
        setPetAction('happy');
        showPetMessage(TASK_MESSAGES.completed[Math.floor(Math.random() * TASK_MESSAGES.completed.length)], 5000);
        setTimeout(() => { setPetAction('idle'); setBaseAction('idle'); }, 4000);
        break;
      case 'failed':
        setPetAction('sleepy');
        showPetMessage(TASK_MESSAGES.failed[Math.floor(Math.random() * TASK_MESSAGES.failed.length)], 5000);
        setTimeout(() => { setPetAction('idle'); setBaseAction('idle'); }, 4000);
        break;
    }
  }, [task.status, isInteracting, isDragging, showPetMessage]);

  const scheduleAutoMove = useCallback(() => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    const delay = 5000 + Math.random() * 8000;
    moveTimer.current = setTimeout(() => {
      if (task.status !== 'idle' || isDragging) {
        scheduleAutoMove();
        return;
      }

      setPetAction('idle');
      scheduleAutoMove();
    }, delay);
  }, [task.status, isDragging]);

  useEffect(() => {
    if (task.status === 'idle' && !isDragging) {
      scheduleAutoMove();
    }
    return () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
    };
  }, [task.status, isDragging, scheduleAutoMove]);

  useEffect(() => {
    if (isDragging) return;

    const handleWindowResize = () => {
      const maxX = window.innerWidth - 150;
      const maxY = window.innerHeight - 250;
      const newX = Math.max(0, Math.min(maxX, position.x));
      const newY = Math.max(0, Math.min(maxY, position.y));
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [position, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: position.x, y: position.y });
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const newX = Math.max(0, Math.min(window.innerWidth - 150, dragOffset.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 250, dragOffset.y + dy));
      setPosition({ x: newX, y: newY });

      if (Math.abs(dx) > 2) {
        setIsFacedLeft(dx < 0);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, dragOffset]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggerInteraction();
  }, [triggerInteraction]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const contextMenuItems = useMemo(() => [
    {
      label: '聊天',
      icon: '',
      onClick: () => setShowChat(prev => !prev),
    },
    {
      label: '收起',
      icon: '📦',
      onClick: () => setIsMinimized(true),
    },
    {
      label: '重置位置',
      icon: '🔄',
      onClick: () => {
        const defaultPos = getDefaultPosition();
        setPosition(defaultPos);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPos)); } catch { /* */ }
      },
    },
    {
      label: '隐藏桌宠',
      icon: '',
      onClick: () => setIsVisible(false),
    },
    {
      label: '关闭桌宠',
      icon: '❌',
      onClick: () => setIsVisible(false),
    },
  ], []);

  const getGlowColor = () => {
    switch (petAction) {
      case 'working': return 'rgba(255,215,0,0.5)';
      case 'happy': return 'rgba(255,200,100,0.5)';
      case 'sleepy': return 'rgba(150,150,200,0.3)';
      case 'interact': return 'rgba(255,107,157,0.5)';
      default: return 'rgba(247,208,44,0.25)';
    }
  };

  if (!isVisible) {
    return (
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="fixed z-[9999] cursor-pointer select-none"
        style={{ right: 20, bottom: 20 }}
        onClick={() => { setIsVisible(true); setIsMinimized(false); }}
      >
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-yellow-200"
          style={{ background: 'linear-gradient(135deg, #F7D02C, #E5B820)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <img src={PIKACHU_IMG} alt="pika" className="w-6 h-6 object-contain" />
        </motion.div>
      </motion.div>
    );
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="fixed z-[9999] cursor-pointer select-none"
        style={{ right: 20, bottom: 20 }}
        onClick={() => setIsMinimized(false)}
      >
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-yellow-200"
          style={{ background: 'linear-gradient(135deg, #F7D02C, #E5B820)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <img src={PIKACHU_IMG} alt="pika" className="w-6 h-6 object-contain" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showContextMenu && (
          <ContextMenu
            position={contextMenuPos}
            items={contextMenuItems}
            onClose={() => setShowContextMenu(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed z-[9999] select-none"
            style={{ left: position.x, top: position.y, width: 150, height: 200 }}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ scale: isHovered ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${getGlowColor()}, transparent 70%)`,
                  filter: 'blur(16px)',
                }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Particles */}
              {particles.map(p => (
                <motion.span
                  key={p.id}
                  className="absolute text-lg pointer-events-none"
                  style={{ left: p.x, top: p.y }}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0, y: -50 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  ⚡
                </motion.span>
              ))}

              {/* Sprite Canvas */}
              <div
                className="absolute inset-0 flex items-end justify-center"
                style={{ transform: isFacedLeft ? 'scaleX(-1)' : 'scaleX(1)' }}
              >
                <SpriteAnimator
                  action={petAction}
                  isPaused={isDragging}
                  onClick={handleClick}
                  onRightClick={handleRightClick}
                />
              </div>

              {/* Speech bubble */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="absolute whitespace-nowrap pointer-events-none"
                    style={{ bottom: '100%', left: '50%', transform: isFacedLeft ? 'translateX(-20%)' : 'translateX(-50%)', marginBottom: 8 }}
                  >
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-2.5 shadow-2xl border border-amber-100 text-sm text-slate-700 font-medium relative">
                      {message}
                      <div className="absolute w-3 h-3 bg-white border-r border-b border-amber-100 rotate-45"
                        style={{ bottom: -6, left: '50%', marginLeft: -6 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Minimize button */}
              <motion.button
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer z-50 shadow-md"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(139,90,43,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              >
                <span className="text-[10px]" style={{ color: '#8B7355' }}>−</span>
              </motion.button>

              {/* Chat toggle */}
              <motion.button
                className="absolute -right-7 top-8 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer z-50 shadow-md"
                style={{ background: 'linear-gradient(135deg, #F7D02C, #E5B820)', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 6px rgba(247,208,44,0.3)' }}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setShowChat(prev => !prev); }}
              >
                <span className="text-[10px]">{showChat ? '✕' : '💬'}</span>
              </motion.button>

              {/* Chat panel */}
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="absolute z-50"
                    style={{ right: 30, top: 0 }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <ChatPanel onClose={() => setShowChat(false)} onSajiao={() => setPetAction('working')} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status dot */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: task.status === 'uploading' || task.status === 'processing' ? '#F7D02C'
                      : task.status === 'completed' ? '#4ADE80'
                      : task.status === 'failed' ? '#EF4444'
                      : '#C4A882',
                  }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DesktopPet;
