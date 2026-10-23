/**
 * Resolves root-relative art paths against Vite's base, so art works when hosted
 * under a subpath. Paths that already include the base are returned unchanged.
 */
export function artUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/' || path.startsWith(base)) return path;
  return base.replace(/\/$/, '') + path;
}
