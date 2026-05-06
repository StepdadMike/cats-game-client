import { v4 as uuidv4 } from 'uuid';
import type { TimelineEvent } from '../../types';

interface Data {
  events: TimelineEvent[];
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function TimelineEditor({ data, onChange }: Props) {
  const events: TimelineEvent[] = data.events ?? [];

  const addEvent = () => {
    onChange({ events: [...events, { id: uuidv4(), label: '' }] });
  };

  const updateLabel = (id: string, label: string) => {
    onChange({ events: events.map(e => e.id === id ? { ...e, label } : e) });
  };

  const remove = (id: string) => {
    onChange({ events: events.filter(e => e.id !== id) });
  };

  const move = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= events.length) return;
    const next = [...events];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    onChange({ events: next });
  };

  return (
    <div className="editor-section">
      <div className="editor-hint-box">
        <p>📅 <strong>Timeline</strong></p>
        <p>Add events in the correct chronological order. Players will see them shuffled and must arrange them correctly.</p>
      </div>
      <div className="timeline-editor-list">
        {events.map((event, i) => (
          <div key={event.id} className="timeline-editor-item">
            <span className="timeline-editor-num">{i + 1}</span>
            <input
              className="input"
              value={event.label}
              onChange={e => updateLabel(event.id, e.target.value)}
              placeholder={`Event ${i + 1}…`}
            />
            <div className="timeline-editor-controls">
              <button className="btn btn--ghost btn--sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="btn btn--ghost btn--sm" onClick={() => move(i, 1)} disabled={i === events.length - 1}>↓</button>
              <button className="btn btn--danger-ghost btn--sm" onClick={() => remove(event.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={addEvent}>
        + Add Event
      </button>
    </div>
  );
}
