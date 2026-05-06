interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ImageInput({ value, onChange, placeholder }: Props) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="image-input">
      <div className="image-input-row">
        <input
          className="input"
          value={value.startsWith('data:') ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Paste image URL…'}
        />
        <label className="btn btn--ghost btn--sm image-upload-label">
          📁 Upload
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
      {value && (
        <div className="image-input-preview">
          <img src={value} alt="preview" onError={e => (e.currentTarget.style.display = 'none')} />
        </div>
      )}
    </div>
  );
}
