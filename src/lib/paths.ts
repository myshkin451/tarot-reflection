export function sitePath(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.replace(/^\/+/, "");

  return cleanPath ? `${normalizedBase}${cleanPath}` : normalizedBase;
}
