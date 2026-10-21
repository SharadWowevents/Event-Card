/**
 * Resolves static media and upload URLs from the backend server.
 * Handles both absolute URLs (Cloudinary, S3, data URIs) and relative `/api/uploads` paths.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';

  // Base backend URL (e.g. "http://localhost:5011/api" or "http://localhost:5011" or "/api")
  const backend = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5011').replace(/\/$/, '');
  // Base origin without trailing /api
  const backendOrigin = backend.replace(/\/api$/, '');

  // Normalize legacy localhost:5000 URLs saved in previous database versions
  if (url.includes('localhost:5000')) {
    url = url.replace('http://localhost:5000', backendOrigin);
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  // If path already starts with /api/, mount directly onto backendOrigin to prevent /api/api/...
  if (cleanPath.startsWith('/api/')) {
    return `${backendOrigin}${cleanPath}`;
  }

  // If path starts with /uploads/, redirect to /api/uploads/
  if (cleanPath.startsWith('/uploads/')) {
    return `${backendOrigin}/api${cleanPath}`;
  }

  // Default fallback
  return `${backend}${cleanPath}`;
};

