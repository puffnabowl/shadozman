/** Resolves root-relative art paths against Vite's base, so art works when hosted under a subpath. */
export function artUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/$/, '') + path;
}
