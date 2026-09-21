import { AttendeeBadgeData, EventItem } from '../types';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const renderBadgeToCanvas = async (
  canvas: HTMLCanvasElement,
  badge: AttendeeBadgeData,
  event: EventItem,
  avatarImg: HTMLImageElement | null
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const WIDTH = 1080;
  const HEIGHT = 1080;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // 1. Draw Background
  if (badge.customFrameUrl) {
    try {
      const frameImg = await loadImage(badge.customFrameUrl);
      
      // Calculate "object-fit: cover" math to completely fill the 1080x1080 canvas
      const scale = Math.max(WIDTH / frameImg.width, HEIGHT / frameImg.height);
      const scaledWidth = frameImg.width * scale;
      const scaledHeight = frameImg.height * scale;
      
      // Center the image
      const x = (WIDTH - scaledWidth) / 2;
      const y = (HEIGHT - scaledHeight) / 2;
      
      ctx.drawImage(frameImg, x, y, scaledWidth, scaledHeight);
    } catch (err) {
      console.error("Failed to load custom frame", err);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  } else {
    // Fallback Gradient if no frame exists
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9');
    grad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // 2. Draw Selfie with Pan and Zoom Math
  if (avatarImg) {
    ctx.save();
    
    // Position of the circle in the canvas
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2 - 40; 
    const radius = 260; // Size of the selfie circle

    // Create the circle clipping mask
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Grab slider values, falling back to defaults
    const scale = badge.scale || 1;
    const panX = badge.panX || 0;
    const panY = badge.panY || 0;

    // Draw the image scaled and shifted
    const baseImgSize = radius * 2 * scale;
    const drawX = centerX - (baseImgSize / 2) + panX;
    const drawY = centerY - (baseImgSize / 2) + panY;

    // Object-fit cover logic for the selfie inside the circle
    const imgAspect = avatarImg.width / avatarImg.height;
    let finalWidth = baseImgSize;
    let finalHeight = baseImgSize;
    
    if (imgAspect > 1) {
      finalWidth = baseImgSize * imgAspect;
    } else {
      finalHeight = baseImgSize / imgAspect;
    }

    ctx.drawImage(avatarImg, drawX - (finalWidth - baseImgSize)/2, drawY - (finalHeight - baseImgSize)/2, finalWidth, finalHeight);
    
    ctx.restore();

    // Draw a nice subtle ring around the selfie
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
  }

  // 3. Draw Dynamic Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 76px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(badge.name || 'Your Name', WIDTH / 2, HEIGHT - 180);

  ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  
  const roleText = badge.role ? badge.role.charAt(0).toUpperCase() + badge.role.slice(1) : '';
  const subText = [roleText, badge.title, badge.company].filter(Boolean).join(' • ');
  
  ctx.fillText(subText || 'Event Attendee', WIDTH / 2, HEIGHT - 110);
};

export const exportCanvasToPng = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
};