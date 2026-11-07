/** Compact Indian number labels for narrow dashboard cards. */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const magnitude = Math.abs(value);
  const units = [{ size: 10000000, suffix: 'Cr' }, { size: 100000, suffix: 'L' }, { size: 1000, suffix: 'K' }];
  const unit = units.find(({ size }) => magnitude >= size);
  if (!unit) return Math.round(value).toLocaleString('en-IN');
  const scaled = Math.round((value / unit.size) * 10) / 10;
  const larger = units.find(({ size }) => size > unit.size && Math.abs(scaled * unit.size) >= size);
  if (larger) return `${Math.round((value / larger.size) * 10) / 10}${larger.suffix}`;
  return `${scaled}${unit.suffix}`;
}
