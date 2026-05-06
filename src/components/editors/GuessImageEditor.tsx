import ImageInput from '../ImageInput';

interface Data {
  imageUrl: string;
  correctAnswer: string;
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function GuessImageEditor({ data, onChange }: Props) {
  return (
    <div className="editor-section">
      <label className="field-label">Image</label>
      <ImageInput
        value={data.imageUrl ?? ''}
        onChange={imageUrl => onChange({ imageUrl })}
        placeholder="https://example.com/image.jpg"
      />
      <label className="field-label" style={{ marginTop: 12 }}>
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
