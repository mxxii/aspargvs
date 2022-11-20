export function ciEquals (a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}

export function ciIncludes (as: string[], b: string): boolean {
  return as.some((a) => ciEquals(a, b));
}

export function ciGetProperty<T> (obj: Record<string, T>, key: string): T | undefined {
  for (const k of Object.keys(obj)) {
    if (ciEquals(k, key)) {
      return obj[k];
    }
  }
  return undefined;
}
