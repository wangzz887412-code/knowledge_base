import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePetBehavior } from './usePetBehavior';
import { PetSpriteCanvas } from './PetSpriteCanvas';
import { PET_CONFIG, PetState } from './config';

const STORAGE_KEY = 'pika-pet-position-v2';
const PIKACHU_PREFIX = '[你是皮卡丘，请用皮卡丘的口吻回答，每句话都要包含"Pika"或"皮卡"，自称"皮卡丘"，称呼用户为"训练师"。语言风格俏皮可爱，偶尔撒娇，带emoji表情，回答简短有趣。] ';

const STATE_LABELS: Record<PetState, string> = {
  'idle': 'Pika~ ⚡',
  'walk-left': 'Pika~ 🚶',
  'walk-right': 'Pika~ 🚶',
  'interact': 'Chu~! 💛',
  'skill': ' 十万伏特! ⚡',
  'sleep': 'Zzz... 💤',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export const DesktopPetV2: React.FC = () => {
  const {
    petState, isDragging, dragDirection,
    setIsDragging, setDragDirection,
    recordInteraction, triggerInteract, triggerSkill,
    onWalkTick, bounce,
  } = usePetBehavior();

  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        return {
          x: Math.max(0, Math.min(window.innerWidth - 120, pos.x)),
          y: Math.max(0, Math.min(window.innerHeight - 130, pos.y)),
        };
      }
    } catch { /* ignore */ }
    return { x: Math.max(0, window.innerWidth - 150), y: Math.max(0, window.innerHeight - 160) };
  });

  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragXRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch { /* ignore */ }
  }, [position]);

  onWalkTick(useCallback((dx: number) => {
    setPosition((prev) => {
      const newX = prev.x + dx;
      const maxX = window.innerWidth - PET_CONFIG.displaySize.width;
      if (newX <= 0) { bounce(); return { ...prev, x: 0 }; }
      if (newX >= maxX) { bounce(); return { ...prev, x: maxX }; }
      return { ...prev, x: newX };
    });
  }, [bounce]));

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: position.x, y: position.y });
    lastDragXRef.current = e.clientX;
  }, [position, setIsDragging]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const newX = Math.max(0, Math.min(window.innerWidth - PET_CONFIG.displaySize.width, dragOffset.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - PET_CONFIG.displaySize.height, dragOffset.y + dy));
      setPosition({ x: newX, y: newY });
      const dragDx = e.clientX - lastDragXRef.current;
      if (Math.abs(dragDx) > 3) {
        setDragDirection(dragDx < 0 ? 'left' : 'right');
        lastDragXRef.current = e.clientX;
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setDragDirection(null); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, dragStart, dragOffset, setIsDragging, setDragDirection]);

  const showBubble = useCallback((text: string) => {
    setTooltipText(text);
    setShowTooltip(true);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setShowTooltip(false), 2000);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    recordInteraction();
    triggerInteract();
    showBubble(STATE_LABELS['interact']);
  }, [recordInteraction, triggerInteract, showBubble]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    recordInteraction();
    triggerSkill();
    showBubble(STATE_LABELS['skill']);
  }, [recordInteraction, triggerSkill, showBubble]);

  const handleRightClick = useCallback((e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userContent = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: userContent, id: `u-${Date.now()}` };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('请先登录再和皮卡丘聊天！');
      const pikachuMessage = PIKACHU_PREFIX + userContent;
      const payload: Record<string, string> = { message: pikachuMessage };
      if (chatId) payload.chat_id = String(chatId);

      const response = await fetch('http://localhost:8000/api/ai/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (data.chat_id) setChatId(data.chat_id);
      const aiResponse = data.response || 'Pika... 皮卡丘也不知道呢 🤔';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse, id: `a-${Date.now()}` }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Pika... 十万伏特短路了 ⚡ 网络出了点问题... (${error.message || ''})`,
        id: `e-${Date.now()}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatId]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
    setShowChat(false);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={handleRestore}
        style={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          boxShadow: '0 4px 16px rgba(255,165,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          fontSize: 22,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
      >
        ⚡
      </motion.div>
    );
  }

  const { width, height } = PET_CONFIG.displaySize;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              padding: '6px 14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              fontSize: 13,
              fontWeight: 600,
              color: '#2C2416',
              border: '1px solid rgba(247,208,44,0.3)',
            }}>
              {tooltipText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PetSpriteCanvas
        petState={petState}
        isPaused={isDragging}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onRightClick={handleRightClick}
        onMouseDown={handleMouseDown}
      />

      <div style={{ position: 'absolute', top: -6, right: -6, display: 'flex', gap: 5, zIndex: 10 }}>
        <div
          onClick={(e) => { e.stopPropagation(); setShowChat((v) => !v); }}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(247,208,44,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14, color: '#DAA520',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
        >💬</div>
        <div
          onClick={handleMinimize}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(139,90,43,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 13, color: '#8B7355',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
        >✕</div>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: -290,
              top: -20,
              width: 280,
              height: 380,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(12px)',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(247,208,44,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            <div style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              <span>⚡ 皮卡丘的对话</span>
              <span
                onClick={() => setShowChat(false)}
                style={{ cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              >×</span>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'linear-gradient(180deg, #FFFDF5, #FFF8E7)',
            }}>
              {messages.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#C4A35A',
                  fontSize: 12,
                  marginTop: 40,
                  lineHeight: 1.8,
                }}>
                  Pika~ 皮卡丘在这里等你！⚡<br />
                  点击输入框和皮卡丘聊天吧~
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #FFD700, #FFC107)'
                      : 'rgba(255,255,255,0.9)',
                    color: msg.role === 'user' ? '#5D4300' : '#4A3728',
                    fontSize: 13,
                    lineHeight: 1.5,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: msg.role === 'assistant' ? '1px solid rgba(247,208,44,0.15)' : 'none',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '8px 12px' }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{ fontSize: 12, color: '#C4A35A' }}
                  >
                    Pika... ⚡
                  </motion.div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{
              padding: '8px 10px',
              borderTop: '1px solid rgba(247,208,44,0.15)',
              display: 'flex',
              gap: 6,
              background: '#FFFDF5',
            }}>
              <input
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="和皮卡丘说点什么..."
                style={{
                  flex: 1,
                  border: '1px solid rgba(247,208,44,0.3)',
                  borderRadius: 10,
                  padding: '6px 10px',
                  fontSize: 12,
                  outline: 'none',
                  background: '#fff',
                  color: '#4A3728',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                style={{
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 12px',
                  background: input.trim() ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#E0D5B7',
                  color: input.trim() ? '#fff' : '#A09070',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: input.trim() ? 'pointer' : 'default',
                  textShadow: input.trim() ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                发送
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
