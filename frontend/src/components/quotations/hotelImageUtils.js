export const MAX_HOTEL_IMAGE_BYTES = 500 * 1024;

export function formatImageSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function readHotelImageFile(file, maxBytes = MAX_HOTEL_IMAGE_BYTES) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }
    if (!file.type?.startsWith('image/')) {
      reject(new Error('Please upload a JPG, PNG or WebP image'));
      return;
    }
    if (file.size > maxBytes) {
      reject(
        new Error(`Image is ${formatImageSize(file.size)}. Maximum allowed size is 500 KB`)
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}
