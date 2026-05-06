interface Data {
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function EitherOrEditor({ data, onChange }: Props) {
  return (
    <div className="editor-section">
      <div className="either-or-row">
        <label className="field-label">
          Option A
          <input
            className="input"
            value={data.optionA ?? ''}
            onChange={e => onChange({ optionA: e.target.value })}
            placeholder="First option…"
          />
        </label>
        <label className="field-label">
          Option B
          <input
            className="input"
            value={data.optionB ?? ''}
            onChange={e => onChange({ optionB: e.target.value })}
            placeholder="Second option…"
          />
        </label>
      </div>

      <label className="field-label">
        Correct Answer
        <div className="correct-choice-btns">
          <button
            className={`btn ${data.correctAnswer === 'A' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => onChange({ correctAnswer: 'A' })}
          >
            A is correct
          </button>
          <button
            className={`btn ${data.correctAnswer === 'B' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => onChange({ correctAnswer: 'B' })}
          >
            B is correct
          </button>
        </div>
      </label>
    </div>
  );
}
