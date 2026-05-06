interface Props {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export default function OddOneOutEditor({ data, onChange }: Props) {
  const oddPrompt = data.oddPrompt ?? '';

  return (
    <div className="odd-one-out-editor">
      <p className="editor-description">
        One random player will receive the second question. After answers are revealed, players vote for who they think had the odd question.
      </p>

      <label className="field-label">
        Odd Question
        <textarea
          className="input editor-prompt"
          value={oddPrompt}
          onChange={e => onChange({ oddPrompt: e.target.value })}
          placeholder="Enter the odd question…"
          rows={3}
        />
      </label>
    </div>
  );
}
