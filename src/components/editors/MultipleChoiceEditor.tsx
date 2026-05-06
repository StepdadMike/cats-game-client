import ImageInput from '../ImageInput';

interface Data {
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function MultipleChoiceEditor({ data, onChange }: Props) {
  const options = data.options ?? ['', '', '', ''];
  const correct = data.correctAnswer ?? 0;

  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    onChange({ options: next });
  };

  const addOption = () => onChange({ options: [...options, ''] });
  const removeOption = (i: number) => {
    const next = options.filter((_, idx) => idx !== i);
    onChange({ options: next, correctAnswer: correct >= next.length ? 0 : correct });
  };

  return (
    <div className="editor-section">
      <h4 className="editor-section-title">Question Image (optional)</h4>
      <ImageInput
        value={data.imageUrl ?? ''}
        onChange={imageUrl => onChange({ imageUrl })}
        placeholder="Paste image URL or upload…"
      />

      <h4 className="editor-section-title" style={{ marginTop: 16 }}>Answer Options</h4>
      {options.map((opt, i) => (
        <div key={i} className="mc-option-row">
          <input
            type="radio"
            name="correct"
            checked={correct === i}
            onChange={() => onChange({ correctAnswer: i })}
            className="correct-radio"
            title="Mark as correct"
          />
          <span className="option-letter">{String.fromCharCode(65 + i)}</span>
          <input
            className="input"
            value={opt}
            onChange={e => updateOption(i, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
          />
          {options.length > 2 && (
            <button className="btn btn--danger-ghost btn--sm" onClick={() => removeOption(i)}>✕</button>
          )}
        </div>
      ))}
      {options.length < 8 && (
        <button className="btn btn--ghost btn--sm" onClick={addOption}>+ Add Option</button>
      )}
      <p className="editor-hint">Select the radio button next to the correct answer.</p>
    </div>
  );
}
