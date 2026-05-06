import {
  useRef, useEffect, forwardRef, useImperativeHandle,
  MouseEvent, TouchEvent,
} from 'react';

interface Props {
  width?: number;
  height?: number;
  penColor?: string;
  background?: string;
  lineWidth?: number;
  tool?: 'pen' | 'fill';
  readOnly?: boolean;
  imageData?: string; // pre-fill canvas with data URL
  onDraw?: (dataUrl: string) => void;
}

export interface WhiteboardHandle {
  getImageData: () => string;
  clear: () => void;
  setImageData: (data: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function floodFillCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  startX: number,
  startY: number,
  fillHex: string,
) {
  const fillRgb = hexToRgb(fillHex);
  if (!fillRgb) return;

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const si = (startY * canvasWidth + startX) * 4;
  const targetR = data[si];
  const targetG = data[si + 1];
  const targetB = data[si + 2];
  const targetA = data[si + 3];

  // Already this colour — nothing to do
  if (targetR === fillRgb.r && targetG === fillRgb.g && targetB === fillRgb.b && targetA === 255) return;

  const TOLERANCE = 32;
  const matches = (i: number) =>
    Math.abs(data[i]     - targetR) <= TOLERANCE &&
    Math.abs(data[i + 1] - targetG) <= TOLERANCE &&
    Math.abs(data[i + 2] - targetB) <= TOLERANCE &&
    Math.abs(data[i + 3] - targetA) <= TOLERANCE;

  const setPixel = (i: number) => {
    data[i]     = fillRgb.r;
    data[i + 1] = fillRgb.g;
    data[i + 2] = fillRgb.b;
    data[i + 3] = 255;
  };

  // Scanline stack fill — much faster than naive BFS for large areas
  const visited = new Uint8Array(canvasWidth * canvasHeight);
  const stack: number[] = [startY * canvasWidth + startX];

  while (stack.length > 0) {
    let pos = stack.pop()!;
    const y = Math.floor(pos / canvasWidth);
    let x = pos % canvasWidth;

    // Walk left to find leftmost pixel in this span
    while (x > 0 && matches((y * canvasWidth + (x - 1)) * 4)) x--;

    let spanAbove = false;
    let spanBelow = false;

    while (x < canvasWidth) {
      const idx = y * canvasWidth + x;
      if (!matches(idx * 4)) break;

      setPixel(idx * 4);
      visited[idx] = 1;

      if (y > 0) {
        const aboveIdx = (y - 1) * canvasWidth + x;
        if (matches(aboveIdx * 4) && !visited[aboveIdx]) {
          if (!spanAbove) { stack.push(aboveIdx); spanAbove = true; }
        } else {
          spanAbove = false;
        }
      }

      if (y < canvasHeight - 1) {
        const belowIdx = (y + 1) * canvasWidth + x;
        if (matches(belowIdx * 4) && !visited[belowIdx]) {
          if (!spanBelow) { stack.push(belowIdx); spanBelow = true; }
        } else {
          spanBelow = false;
        }
      }

      x++;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

const Whiteboard = forwardRef<WhiteboardHandle, Props>(function Whiteboard(
  {
    width = 320,
    height = 200,
    penColor = '#1a1a2e',
    background = '#f5f0e8',
    lineWidth = 3,
    tool = 'pen',
    readOnly = false,
    imageData,
    onDraw,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const clear = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  };

  const getImageData = () => canvasRef.current?.toDataURL('image/png') ?? '';

  const setImageData = (data: string) => {
    const ctx = getCtx();
    if (!ctx || !data) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = data;
  };

  useImperativeHandle(ref, () => ({ getImageData, clear, setImageData }));

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    if (imageData) setImageData(imageData);
  }, []);

  useEffect(() => {
    if (imageData) setImageData(imageData);
  }, [imageData]);

  const getPos = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: MouseEvent | TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();

    if (tool === 'fill') {
      const pos = getPos(e);
      if (!pos) return;
      const ctx = getCtx();
      if (!ctx) return;
      floodFillCanvas(ctx, width, height, Math.round(pos.x), Math.round(pos.y), penColor);
      onDraw?.(getImageData());
      return;
    }

    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!drawing.current || readOnly || tool === 'fill') return;
    e.preventDefault();
    const ctx = getCtx();
    const pos = getPos(e);
    if (!ctx || !pos || !lastPos.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    onDraw?.(getImageData());
  };

  const endDraw = () => {
    drawing.current = false;
    lastPos.current = null;
    if (!readOnly && tool !== 'fill') onDraw?.(getImageData());
  };

  const cursor = readOnly ? 'default' : tool === 'fill' ? 'cell' : 'crosshair';

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="whiteboard-canvas"
      style={{ cursor, touchAction: 'none' }}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={draw}
      onTouchEnd={endDraw}
    />
  );
});

export default Whiteboard;
