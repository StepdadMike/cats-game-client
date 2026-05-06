interface Data {
  audioUrl: string;
  correctAnswer: string;
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function GuessAudioEditor({ data, onChange }: Props) {
  return (
    <div className="editor-section">
      <label className="field-label">
        Audio URL
        <input
          className="input"
          value={data.audioUrl ?? ''}
          onChange={e => onChange({ audioUrl: e.target.value })}
          placeholder="https://example.com/audio.mp3"
        />
      </label>
      {data.audioUrl && (
        <audio controls src={data.audioUrl} className="editor-audio-preview" />
      )}
      <label className="field-label">
        Correct Answer (shown to host only)
        <input
          className="input"
          value={data.correctAnswer ?? ''}
          onChange={e => onChange({ correctAnswer: e.target.value })}
          placeholder="Expected answer…"
        />
      </label>
    </div>
  );
}
