import { useEffect, useRef, useState, useCallback } from 'react';
import { PET_CONFIG, PetState } from './config';

interface UsePetBehaviorReturn {
  petState: PetState;
  isDragging: boolean;
  dragDirection: 'left' | 'right' | null;
  setIsDragging: (v: boolean) => void;
  setDragDirection: (d: 'left' | 'right' | null) => void;
  recordInteraction: () => void;
  triggerInteract: () => void;
  triggerSkill: () => void;
  onWalkTick: (callback: (dx: number) => void) => void;
  bounce: () => void;
}

export function usePetBehavior(): UsePetBehaviorReturn {
  const [petState, setPetState] = useState<PetState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const lastActionRef = useRef<number>(Date.now());
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkTickCallbackRef = useRef<((dx: number) => void) | null>(null);
  const petStateRef = useRef(petState);

  petStateRef.current = petState;

  const recordInteraction = useCallback(() => {
    lastActionRef.current = Date.now();
    if (petStateRef.current === 'sleep') {
      setPetState('idle');
    }
  }, []);

  const scheduleWalk = useCallback(() => {
    if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    const delay = PET_CONFIG.timeouts.walkIntervalMin +
      Math.random() * (PET_CONFIG.timeouts.walkIntervalMax - PET_CONFIG.timeouts.walkIntervalMin);
    walkTimerRef.current = setTimeout(() => {
      if (isDragging || petStateRef.current === 'sleep' || petStateRef.current === 'interact' || petStateRef.current === 'skill') {
        scheduleWalk();
        return;
      }
      const direction: PetState = Math.random() < 0.5 ? 'walk-left' : 'walk-right';
      setPetState(direction);
      const walkDuration = 2000 + Math.random() * 4000;
      walkTimerRef.current = setTimeout(() => {
        if (petStateRef.current === 'walk-left' || petStateRef.current === 'walk-right') {
          setPetState('idle');
        }
        scheduleWalk();
      }, walkDuration);
    }, delay);
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging) {
      scheduleWalk();
    }
    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    };
  }, [isDragging, scheduleWalk]);

  useEffect(() => {
    if (!isDragging) return;
    if (dragDirection) {
      setPetState(dragDirection === 'left' ? 'walk-left' : 'walk-right');
    }
  }, [isDragging, dragDirection]);

  useEffect(() => {
    if (!isDragging && (petStateRef.current === 'walk-left' || petStateRef.current === 'walk-right') && dragDirection) {
      setPetState('idle');
      setDragDirection(null);
      scheduleWalk();
    }
  }, [isDragging, dragDirection, scheduleWalk]);

  useEffect(() => {
    const handleMouseMove = () => recordInteraction();
    const handleKeyDown = () => recordInteraction();
    const handleScroll = () => recordInteraction();
    const handleClick = () => recordInteraction();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastActionRef.current = Date.now();
        setPetState('idle');
      }
    };

    const handleFocus = () => {
      lastActionRef.current = Date.now();
      setPetState('idle');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [recordInteraction]);

  useEffect(() => {
    if (isDragging) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      const timeSinceLastAction = Date.now() - lastActionRef.current;
      const current = petStateRef.current;

      if (current === 'interact' || current === 'skill') return;

      if (timeSinceLastAction > PET_CONFIG.timeouts.idleToSleep) {
        if (current !== 'sleep') {
          setPetState('sleep');
        }
      } else {
        if (current === 'sleep') {
          setPetState('idle');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDragging]);

  const triggerInteract = useCallback(() => {
    setPetState('interact');
    lastActionRef.current = Date.now();
    setTimeout(() => {
      setPetState((prev) => (prev === 'interact' ? 'idle' : prev));
    }, 1500);
  }, []);

  const triggerSkill = useCallback(() => {
    setPetState('skill');
    lastActionRef.current = Date.now();
    setTimeout(() => {
      setPetState((prev) => (prev === 'skill' ? 'idle' : prev));
    }, 2000);
  }, []);

  const onWalkTick = useCallback((callback: (dx: number) => void) => {
    walkTickCallbackRef.current = callback;
  }, []);

  const bounce = useCallback(() => {
    const current = petStateRef.current;
    if (current === 'walk-left') {
      setPetState('walk-right');
    } else if (current === 'walk-right') {
      setPetState('walk-left');
    }
  }, []);

  useEffect(() => {
    if (petState !== 'walk-left' && petState !== 'walk-right') return;

    const speed = PET_CONFIG.timeouts.walkSpeed;
    const direction = petState === 'walk-left' ? -1 : 1;

    const tick = () => {
      if (walkTickCallbackRef.current) {
        walkTickCallbackRef.current(direction * speed);
      }
    };

    const intervalId = setInterval(tick, 16);
    return () => clearInterval(intervalId);
  }, [petState]);

  return {
    petState,
    isDragging,
    dragDirection,
    setIsDragging,
    setDragDirection,
    recordInteraction,
    triggerInteract,
    triggerSkill,
    onWalkTick,
    bounce,
  };
}
