// Environment overrides may specify either the host or the complete /IN base.
export function intownApiBaseUrl(value: string): string {
  return `${value.trim().replace(/\/+$/, '').replace(/(?:\/IN)+$/i, '')}/IN`;
}
