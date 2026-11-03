const COLORS = ['#15803D', '#2563EB', '#7C3AED', '#BE185D', '#0F766E', '#B45309', '#C2410C'];

export function categoryChipColor(category: string): string {
  let hash = 0;
  for (const character of category.trim().toLowerCase()) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}
