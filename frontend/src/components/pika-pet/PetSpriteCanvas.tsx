import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PET_CONFIG, PetState, PetAction } from './config';

const STATE_TO_ACTION: Record<PetState, { action: PetAction; fpsMultiplier: number }> = {
  'idle':       { action: 'idle',       fpsMultiplier: 1 },
  'walk-left':  { action: 'walk_left',  fpsMultiplier: 1 },
  'walk-right': { action: 'walk_right', fpsMultiplier: 1 },
  'interact':   { action: 'interact',   fpsMultiplier: 1 },
  'skill':      { action: 'skill',      fpsMultiplier: 1 },
  'sleep':      { action: 'sleep',      fpsMultiplier: 1 },
};

const CROSSFADE_RATIO = 0.5;

interface PetSpriteCanvasProps {
  petState: PetState;
  isPaused: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onRightClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const PetSpriteCanvas: React.FC<PetSpriteCanvasProps> = ({
  petState,
  isPaused,
  onClick,
  onDoubleClick,
  onRightClick,
  onMouseDown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const spritesheetRef = useRef<HTMLImageElement | null>(null);
  const isLoadedRef = useRef(false);
  const petStateRef = useRef(petState);
  const [imgError, setImgError] = useState(false);

  const progressRef = useRef(0);
  const frameIndexRef = useRef(0);
  const lastTimeRef = useRef(0);

  petStateRef.current = petState;

  const getSrcRect = useCallback((frame: number) => {
    const stateConfig = STATE_TO_ACTION[petStateRef.current];
    const actionConfig = PET_CONFIG.actions[stateConfig.action];
    const { cellWidth, cellHeight, cols } = PET_CONFIG.spritesheet;
    const srcCol = frame % cols;
    const srcRow = actionConfig.row;
    return { x: srcCol * cellWidth, y: srcRow * cellHeight, w: cellWidth, h: cellHeight };
  }, []);

  const drawBlended = useCallback((ctx: CanvasRenderingContext2D, fromFrame: number, toFrame: number, alpha: number, w: number, h: number) => {
    if (!spritesheetRef.current || !isLoadedRef.current) return;
    const sheet = spritesheetRef.current;

    ctx.clearRect(0, 0, w, h);

    const from = getSrcRect(fromFrame);
    ctx.globalAlpha = 1 - alpha;
    ctx.drawImage(sheet, from.x, from.y, from.w, from.h, 0, 0, w, h);

    const to = getSrcRect(toFrame);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sheet, to.x, to.y, to.w, to.h, 0, 0, w, h);

    ctx.globalAlpha = 1;
  }, [getSrcRect]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      spritesheetRef.current = img;
      isLoadedRef.current = true;
      setImgError(false);
      frameIndexRef.current = 0;
      progressRef.current = 0;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawBlended(ctx, 0, 0, 0, canvas.width, canvas.height);
      }
    };
    img.onerror = () => {
      setImgError(true);
      isLoadedRef.current = false;
    };
    img.src = PET_CONFIG.spritesheet.url;
    return () => { isLoadedRef.current = false; spritesheetRef.current = null; };
  }, [drawBlended]);

  useEffect(() => {
    if (isPaused || !isLoadedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameIndexRef.current = 0;
    progressRef.current = 0;
    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      if (isPaused) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const stateConfig = STATE_TO_ACTION[petStateRef.current];
      const actionConfig = PET_CONFIG.actions[stateConfig.action];
      const fps = actionConfig.fps * stateConfig.fpsMultiplier;
      const frameDuration = 1000 / fps;

      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      progressRef.current += dt / frameDuration;

      if (progressRef.current >= 1) {
        progressRef.current -= Math.floor(progressRef.current);

        if (actionConfig.loop) {
          frameIndexRef.current = (frameIndexRef.current + 1) % actionConfig.frames;
        } else {
          if (frameIndexRef.current < actionConfig.frames - 1) {
            frameIndexRef.current += 1;
          } else {
            progressRef.current = 0;
          }
        }
      }

      const crossfadeStart = 1 - CROSSFADE_RATIO;
      if (progressRef.current > crossfadeStart && progressRef.current < 1) {
        const nextFrame = actionConfig.loop
          ? (frameIndexRef.current + 1) % actionConfig.frames
          : Math.min(frameIndexRef.current + 1, actionConfig.frames - 1);

        if (nextFrame !== frameIndexRef.current) {
          const blendAlpha = (progressRef.current - crossfadeStart) / CROSSFADE_RATIO;
          drawBlended(ctx, frameIndexRef.current, nextFrame, blendAlpha, canvas.width, canvas.height);
        } else {
          drawBlended(ctx, frameIndexRef.current, frameIndexRef.current, 0, canvas.width, canvas.height);
        }
      } else {
        drawBlended(ctx, frameIndexRef.current, frameIndexRef.current, 0, canvas.width, canvas.height);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [petState, isPaused, drawBlended]);

  const { width, height } = PET_CONFIG.displaySize;

  if (imgError) {
    return (
      <div
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onRightClick}
        onMouseDown={onMouseDown}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          userSelect: 'none',
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          borderRadius: '50%',
          fontSize: '32px',
          boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
        }}
      >
        ⚡
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onRightClick}
      onMouseDown={onMouseDown}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: isPaused ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    />
  );
};
