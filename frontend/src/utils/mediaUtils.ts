/**
 * Resolves static media and upload URLs from the backend server.
 * Handles both absolute URLs (Cloudinary, S3, data URIs) and relative `/api/uploads` paths.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5011';
  const cleanBackend = backend.replace(/\/$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBackend}${cleanPath}`;
};
