export default function Avatar({ name, size = 'md', className = '' }) {
  const safeName =
    typeof name === 'string'
      ? name
      : typeof name === 'number'
        ? String(name)
        : name && typeof name === 'object'
          ? String(name.name || name.label || '')
          : '';

  const initials = safeName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const colors = [
    'bg-blue-600',
    'bg-violet-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
  ];
  const colorIndex = (safeName.charCodeAt(0) || 0) % colors.length;

  return (
    <div
      className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
