/**
 * Utility functions for validating and compressing candidate passport photos.
 * Requirement: Photo size MUST be strictly less than 50KB (51,200 bytes) and saved to backend disk storage.
 */

export const MAX_PHOTO_BYTES = 50 * 1024; // 50 KB = 51,200 bytes

/**
 * Calculates the exact byte size of a base64 data URL string or regular URL string.
 */
export function getPhotoByteSize(photoUrl: string): number {
  if (!photoUrl) return 0;
  if (!photoUrl.startsWith('data:image/')) {
    // If it's a server URL or relative path
    return 0;
  }
  const base64Data = photoUrl.replace(/^data:image\/\w+;base64,/, '');
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.round((base64Data.length * 3) / 4) - padding;
}

/**
 * Returns human-readable KB string for base64 photo data.
 */
export function getPhotoSizeKB(photoUrl: string): string {
  const bytes = getPhotoByteSize(photoUrl);
  if (bytes === 0) return 'Server Stored';
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Compresses an image file or base64 string using Canvas to guarantee file size is strictly LESS THAN 50KB.
 */
export function compressPhotoUnder50KB(
  input: File | string,
  maxWidth = 320,
  maxHeight = 380
): Promise<{ dataUrl: string; sizeKB: number; byteSize: number }> {
  return new Promise((resolve, reject) => {
    const processImg = (img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      let width = img.width || maxWidth;
      let height = img.height || maxHeight;

      // Scale to passport aspect ratio while keeping dimensions compact
      const aspectRatio = width / height;
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context for photo processing'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Try descending JPEG qualities until size <= 50KB (51,200 bytes)
      const qualities = [0.85, 0.75, 0.65, 0.5, 0.4, 0.3, 0.2, 0.1];
      let bestDataUrl = '';
      let bestByteSize = Infinity;

      for (const q of qualities) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        const bytes = getPhotoByteSize(dataUrl);

        if (bytes < bestByteSize) {
          bestByteSize = bytes;
          bestDataUrl = dataUrl;
        }

        if (bytes <= MAX_PHOTO_BYTES) {
          // Success! Under 50KB
          resolve({
            dataUrl,
            sizeKB: Number((bytes / 1024).toFixed(1)),
            byteSize: bytes,
          });
          return;
        }
      }

      // Fallback: further reduce dimensions to 220x260 px
      const compactCanvas = document.createElement('canvas');
      compactCanvas.width = 220;
      compactCanvas.height = Math.round(220 / aspectRatio);
      const ctx2 = compactCanvas.getContext('2d');
      if (ctx2) {
        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillRect(0, 0, compactCanvas.width, compactCanvas.height);
        ctx2.drawImage(img, 0, 0, compactCanvas.width, compactCanvas.height);

        for (const q of [0.6, 0.4, 0.25, 0.1]) {
          const dataUrl = compactCanvas.toDataURL('image/jpeg', q);
          const bytes = getPhotoByteSize(dataUrl);
          if (bytes <= MAX_PHOTO_BYTES) {
            resolve({
              dataUrl,
              sizeKB: Number((bytes / 1024).toFixed(1)),
              byteSize: bytes,
            });
            return;
          }
        }
      }

      if (bestByteSize <= MAX_PHOTO_BYTES) {
        resolve({
          dataUrl: bestDataUrl,
          sizeKB: Number((bestByteSize / 1024).toFixed(1)),
          byteSize: bestByteSize,
        });
      } else {
        reject(
          new Error(
            `Could not compress photo file under 50KB limit (Smallest achieved: ${(bestByteSize / 1024).toFixed(
              1
            )}KB). Please upload a smaller photo.`
          )
        );
      }
    };

    if (typeof input === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processImg(img);
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImg(img);
        img.onerror = () => reject(new Error('Failed to parse photo file image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read photo file from disk'));
      reader.readAsDataURL(input);
    }
  });
}
