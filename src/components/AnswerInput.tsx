import { useRef, useState, useEffect } from 'react';
import type { Question, AnswerValue, TimelineEvent } from '../types';
import Whiteboard, { WhiteboardHandle } from './Whiteboard';
import ImageInput from './ImageInput';

interface Props {
  question: Question;
  onSubmit: (answer: AnswerValue) => void;
}

export default function AnswerInput({ question, onSubmit }: Props) {
  switch (question.type) {
    case 'multiple-choice':
      return <MultipleChoiceInput options={question.options} onSubmit={onSubmit} />;
    case 'either-or':
      return <EitherOrInput optionA={question.optionA} optionB={question.optionB} onSubmit={onSubmit} />;
    case 'timeline':
      return <TimelineInput events={question.events} onSubmit={onSubmit} />;
    default:
      return <WhiteboardInput onSubmit={onSubmit} />;
  }
}

function MultipleChoiceInput({ options, onSubmit }: { options: string[]; onSubmit: (a: AnswerValue) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="answer-mc">
      {options.map((opt, i) => (
        <button
          key={i}
          className={`mc-choice-btn ${selected === i ? 'selected' : ''}`}
          onClick={() => setSelected(i)}
        >
          <span className="mc-letter">{String.fromCharCode(65 + i)}</span>
          {opt}
        </button>
      ))}
      <button
        className="btn btn--primary btn--lg"
        disabled={selected === null}
        onClick={() => selected !== null && onSubmit({ type: 'choice', value: selected })}
      >
        Submit Answer
      </button>
    </div>
  );
}

function EitherOrInput({ optionA, optionB, onSubmit }: {
  optionA: string; optionB: string; onSubmit: (a: AnswerValue) => void;
}) {
  return (
    <div className="answer-either-or">
      <button className="either-or-btn either-or-btn--a" onClick={() => onSubmit({ type: 'ab', value: 'A' })}>
        <span className="eo-label">A</span>{optionA}
      </button>
      <button className="either-or-btn either-or-btn--b" onClick={() => onSubmit({ type: 'ab', value: 'B' })}>
        <span className="eo-label">B</span>{optionB}
      </button>
    </div>
  );
}

type DrawMode = 'draw' | 'keyboard' | 'image';
type DrawTool = 'pen' | 'fill';

function WhiteboardInput({ onSubmit }: { onSubmit: (a: AnswerValue) => void }) {
  const wbRef = useRef<WhiteboardHandle>(null);
  const [mode, setMode] = useState<DrawMode>('draw');
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [imageUrl, setImageUrl] = useState('');
  const [keyboardText, setKeyboardText] = useState('');
  const [penColor, setPenColor] = useState('#1a1a2e');
  const [lineWidth, setLineWidth] = useState(4);

  // Re-render keyboard text onto canvas whenever text or mode changes
  useEffect(() => {
    if (mode !== 'keyboard') return;
    const canvas = (wbRef.current as any)?._canvas as HTMLCanvasElement | undefined;
    // We'll use a separate approach — render text via the Whiteboard's setImageData
    renderTextToCanvas(keyboardText, penColor, (dataUrl) => {
      wbRef.current?.setImageData(dataUrl);
    });
  }, [keyboardText, penColor, mode]);

  const handleSubmit = () => {
    if (mode === 'image') {
      if (!imageUrl.trim()) return;
      onSubmit({ type: 'image-url', value: imageUrl.trim() });
    } else if (mode === 'keyboard') {
      onSubmit({ type: 'text', value: keyboardText.trim() });
    } else {
      const data = wbRef.current?.getImageData() ?? '';
      onSubmit({ type: 'drawing', value: data });
    }
  };

  const canSubmit = mode === 'image' ? !!imageUrl.trim() : mode === 'keyboard' ? !!keyboardText.trim() : true;

  return (
    <div className="answer-whiteboard">
      {/* Mode tabs */}
      <div className="wb-mode-toggle">
        {(['draw', 'keyboard', 'image'] as DrawMode[]).map(m => (
          <button
            key={m}
            className={`btn btn--sm ${mode === m ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setMode(m)}
          >
            {m === 'draw' ? '✏️ Draw' : m === 'keyboard' ? '⌨️ Type' : '🖼️ Image'}
          </button>
        ))}
      </div>

      {mode === 'draw' && (
        <>
          <div className="wb-tools">
            <label>Color:</label>
            <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="color-picker" />
            <div className="wb-tool-btns">
              <button
                className={`btn btn--sm ${drawTool === 'pen' ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setDrawTool('pen')}
                title="Pen"
              >✏️</button>
              <button
                className={`btn btn--sm ${drawTool === 'fill' ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setDrawTool('fill')}
                title="Fill"
              >🪣</button>
            </div>
            {drawTool === 'pen' && (
              <>
                <label>Size:</label>
                <input type="range" min={1} max={20} value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className="line-width-slider" />
              </>
            )}
            <button className="btn btn--ghost btn--sm" onClick={() => wbRef.current?.clear()}>Clear</button>
          </div>
          <Whiteboard ref={wbRef} width={360} height={220} penColor={penColor} lineWidth={lineWidth} tool={drawTool} background="#f5f0e8" />
        </>
      )}

      {mode === 'keyboard' && (
        <div className="keyboard-answer">
          <div className="keyboard-wb-preview">
            <Whiteboard
              ref={wbRef}
              width={360}
              height={140}
              readOnly
              background="#f5f0e8"
            />
          </div>
          <textarea
            className="input keyboard-answer-input"
            placeholder="Type your answer here…"
            value={keyboardText}
            onChange={e => setKeyboardText(e.target.value)}
            rows={3}
            maxLength={200}
            autoFocus
          />
        </div>
      )}

      {mode === 'image' && (
        <ImageInput value={imageUrl} onChange={setImageUrl} />
      )}

      <button className="btn btn--success btn--lg" onClick={handleSubmit} disabled={!canSubmit}>
        Submit Answer
      </button>
    </div>
  );
}

function TimelineInput({ events, onSubmit }: { events: TimelineEvent[]; onSubmit: (a: AnswerValue) => void }) {
  const [order, setOrder] = useState<TimelineEvent[]>(() => {
    if (events.length <= 1) return [...events];
    const original = events.map(e => e.id).join(',');
    let arr: TimelineEvent[];
    let attempts = 0;
    do {
      arr = [...events];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      attempts++;
    } while (arr.map(e => e.id).join(',') === original && attempts < 10);
    return arr;
  });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  return (
    <div className="timeline-input">
      <p className="timeline-input-hint">Arrange in chronological order (oldest → newest):</p>
      <div className="timeline-input-list">
        {order.map((event, i) => (
          <div key={event.id} className="timeline-input-item">
            <span className="timeline-input-num">{i + 1}</span>
            <span className="timeline-input-label">{event.label}</span>
            <div className="timeline-input-controls">
              <button className="tl-btn" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="tl-btn" onClick={() => move(i, 1)} disabled={i === order.length - 1}>↓</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn--success btn--lg" onClick={() => onSubmit({ type: 'order', value: order.map(e => e.id) })}>
        Submit Order
      </button>
    </div>
  );
}

// Render text onto an offscreen canvas and return its data URL
function renderTextToCanvas(text: string, color: string, callback: (dataUrl: string) => void) {
  const W = 360, H = 140;
  const offscreen = document.createElement('canvas');
  offscreen.width = W;
  offscreen.height = H;
  const ctx = offscreen.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, W, H);

  if (!text.trim()) { callback(offscreen.toDataURL()); return; }

  // Word-wrap and draw
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = W - 32;
  const lines = wrapText(ctx, text, maxWidth, 28);
  const lineHeight = 36;
  const totalH = lines.length * lineHeight;
  const startY = (H - totalH) / 2 + lineHeight / 2;

  // Find font size that fits
  let fontSize = 28;
  while (fontSize > 10 && lines.length * lineHeight > H - 20) fontSize--;
  ctx.font = `bold ${fontSize}px Oswald, sans-serif`;

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });

  callback(offscreen.toDataURL());
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  ctx.font = `bold ${fontSize}px Oswald, sans-serif`;
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
