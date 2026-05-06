import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { WaveHint, HintType } from '../../types';
import Whiteboard, { WhiteboardHandle } from '../Whiteboard';
import ImageInput from '../ImageInput';

interface Data {
  hints: WaveHint[];
  correctAnswer: string;
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function GuessWavesEditor({ data, onChange }: Props) {
  const hints = data.hints ?? [];

  const addHint = (type: HintType) => {
    onChange({ hints: [...hints, { id: uuidv4(), type, content: '' }] });
  };

  const updateHint = (id: string, content: string) => {
    onChange({ hints: hints.map(h => h.id === id ? { ...h, content } : h) });
  };

  const removeHint = (id: string) => {
    onChange({ hints: hints.filter(h => h.id !== id) });
  };

  return (
    <div className="editor-section">
      <h4 className="editor-section-title">Hint Waves</h4>
      <p className="editor-hint">Add hints in order. Players will see them one wave at a time.</p>

      {hints.map((hint, i) => (
        <div key={hint.id} className="wave-hint-editor">
          <div className="wave-hint-header">
            <span className="wave-number">Wave {i + 1} — {hint.type}</span>
            <button className="btn btn--danger-ghost btn--sm" onClick={() => removeHint(hint.id)}>Remove</button>
          </div>
          {hint.type === 'image' && (
            <ImageInput
              value={hint.content}
              onChange={content => updateHint(hint.id, content)}
              placeholder="Paste image URL…"
            />
          )}
          {hint.type === 'audio' && (
            <input
              className="input"
              value={hint.content}
              onChange={e => updateHint(hint.id, e.target.value)}
              placeholder="Audio URL…"
            />
          )}
          {hint.type === 'drawing' && (
            <DrawingHint
              content={hint.content}
              onDraw={data => updateHint(hint.id, data)}
            />
          )}
        </div>
      ))}

      <div className="wave-add-btns">
        <button className="btn btn--ghost btn--sm" onClick={() => addHint('image')}>+ Image hint</button>
        <button className="btn btn--ghost btn--sm" onClick={() => addHint('audio')}>+ Audio hint</button>
        <button className="btn btn--ghost btn--sm" onClick={() => addHint('drawing')}>+ Drawing hint</button>
      </div>

      <label className="field-label" style={{ marginTop: 16 }}>
        Correct Answer (shown to host only)
        <input
          className="input"
          value={data.correctAnswer ?? ''}
          onChange={e => onChange({ correctAnswer: e.target.value })}
          placeholder="The answer…"
        />
      </label>
    </div>
  );
}

function DrawingHint({ content, onDraw }: { content: string; onDraw: (d: string) => void }) {
  const ref = useRef<WhiteboardHandle>(null);
  return (
    <div>
      <Whiteboard ref={ref} width={320} height={180} onDraw={onDraw} imageData={content} />
      <button className="btn btn--ghost btn--sm" onClick={() => ref.current?.clear()}>Clear</button>
    </div>
  );
}
