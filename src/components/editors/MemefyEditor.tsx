import ImageInput from '../ImageInput';

interface Data {
  imageUrl: string;
}

interface Props {
  data: Partial<Data>;
  onChange: (d: Partial<Data>) => void;
}

export default function MemefyEditor({ data, onChange }: Props) {
  return (
    <div className="editor-section">
      <div className="editor-hint-box">
        <p>😂 <strong>Memefy</strong></p>
        <p>Players write funny captions for this image on their whiteboards. The host picks the funniest — that player gets the points!</p>
      </div>
      <label className="field-label">Meme Template Image</label>
      <ImageInput
        value={data.imageUrl ?? ''}
        onChange={imageUrl => onChange({ imageUrl })}
        placeholder="https://example.com/meme-template.jpg"
      />
    </div>
  );
}
