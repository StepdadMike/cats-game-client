interface Props {
  seconds: number;
  maxSeconds: number;
  size?: number;
}

export default function Timer({ seconds, maxSeconds, size = 120 }: Props) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = maxSeconds > 0 ? Math.max(0, seconds / maxSeconds) : 0;
  const offset = circumference * (1 - progress);

  const urgent = seconds <= 5 && seconds > 0;
  const warning = seconds <= 10 && seconds > 5;

  const color = urgent ? '#ff4455' : warning ? '#ffd700' : '#00d4ff';

  return (
    <div className={`timer ${urgent ? 'timer--urgent' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={8}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="timer__number" style={{ color }}>
        {Math.max(0, seconds)}
      </div>
    </div>
  );
}
