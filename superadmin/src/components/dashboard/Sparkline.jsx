export default function Sparkline({ data = [], color = '#6366f1', width = 72, height = 28 }) {
  const points = data.length > 1 ? data : [3, 5, 4, 7, 6, 8, 9];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}
