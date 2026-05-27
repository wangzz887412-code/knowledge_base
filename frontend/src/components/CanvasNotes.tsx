import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CanvasNotesProps {
  fileId: number | null;
  savedNotes: string;
  onSave: (data: string) => void;
}

const COLORS = ['#000000', '#333333', '#666666', '#D32F2F', '#1976D2', '#388E3C', '#F57C00', '#7B1FA2'];
const BRUSH_SIZES = [2, 4, 6, 10, 16];

export const CanvasNotes: React.FC<CanvasNotesProps> = ({ fileId, savedNotes, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [zoom, setZoom] = useState(100);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 1600;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (savedNotes && savedNotes.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedNotes;
    }
  }, [fileId]);

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [tool, color, brushSize, getCanvasPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }

    lastPos.current = pos;
    setHasUnsaved(true);
  }, [isDrawing, tool, color, brushSize, getCanvasPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
      setHasUnsaved(false);
      setSaving(false);
    }, 100);
  }, [onSave]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasUnsaved(true);
  }, []);

  const zoomIn = () => setZoom(z => Math.min(200, z + 20));
  const zoomOut = () => setZoom(z => Math.max(40, z - 20));
  const zoomReset = () => setZoom(100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setTool('pen')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              tool === 'pen' ? 'bg-[#10A37F] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
            </svg>
            笔
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              tool === 'eraser' ? 'bg-[#10A37F] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
              <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8l8.6-8.6c.8-.8 2-.8 2.8 0L20 10.2c.8.8.8 2 0 2.8L14.8 18.2"></path>
              <line x1="6" y1="14" x2="14" y2="22"></line>
            </svg>
            橡皮
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setTool('pen'); setColor(c); }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c && tool === 'pen' ? 'border-[#10A37F] scale-110 shadow-sm' : 'border-gray-300 hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-1">
          {BRUSH_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                brushSize === s ? 'bg-gray-100 border border-[#10A37F]' : 'hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div
                className="rounded-full bg-gray-700"
                style={{ width: Math.min(s, 8), height: Math.min(s, 8) }}
              />
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          <button onClick={zoomOut} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 text-sm" title="缩小">−</button>
          <span className="text-xs text-gray-500 min-w-[40px] text-center">{zoom}%</span>
          <button onClick={zoomIn} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 text-sm" title="放大">+</button>
          <button onClick={zoomReset} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-400 text-xs" title="重置">↺</button>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleClear}
          className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          清空
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-1 rounded-lg text-xs font-medium transition-all ${
            hasUnsaved
              ? 'bg-[#10A37F] text-white hover:bg-[#0E8F6E]'
              : 'bg-gray-200 text-gray-500'
          } ${saving ? 'opacity-50' : ''}`}
        >
          {saving ? '保存中...' : hasUnsaved ? '💾 保存' : '已保存'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 rounded-lg border border-gray-200"
        style={{ minHeight: '400px' }}
      >
        <div
          className="flex items-center justify-center p-4"
          style={{ minWidth: `${1200 * (zoom / 100)}px`, minHeight: `${1600 * (zoom / 100)}px` }}
        >
          <canvas
            ref={canvasRef}
            width={1200}
            height={1600}
            className="bg-white shadow-lg cursor-crosshair"
            style={{
              width: `${1200 * (zoom / 100)}px`,
              height: `${1600 * (zoom / 100)}px`,
              maxWidth: 'none'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};