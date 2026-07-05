/** Wait for all images inside an element to load (or fail). */
export function waitForImages(root, timeoutMs = 8000) {
  if (!root) return Promise.resolve();
  const imgs = [...root.querySelectorAll('img')];
  if (!imgs.length) return Promise.resolve();

  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, timeoutMs);
        })
    )
  );
}

/** Fetch image as data URL (for print when canvas is tainted). */
async function urlToDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Convert a loaded img element to a data URL for reliable print/PDF. */
export function imgElementToDataUrl(img, maxEdge = 480, quality = 0.5) {
  if (!img?.naturalWidth) return null;
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const longest = Math.max(w, h);
    const ratio = longest > maxEdge ? maxEdge / longest : 1;
    const tw = Math.max(1, Math.round(w * ratio));
    const th = Math.max(1, Math.round(h * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(img, 0, 0, tw, th);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return null;
  }
}

/** Clone quotation DOM and inline image data URLs so print/PDF always shows photos. */
export async function cloneWithEmbeddedImages(contentEl) {
  if (!contentEl) return null;

  await waitForImages(contentEl);

  const clone = contentEl.cloneNode(true);
  const srcImgs = contentEl.querySelectorAll('img');
  const cloneImgs = clone.querySelectorAll('img');

  for (let i = 0; i < cloneImgs.length; i += 1) {
    const srcImg = srcImgs[i];
    const cloneImg = cloneImgs[i];
    let dataUrl = imgElementToDataUrl(srcImg);
    if (!dataUrl && srcImg?.src && !srcImg.src.startsWith('data:')) {
      dataUrl = await urlToDataUrl(srcImg.src);
    }
    if (dataUrl) {
      cloneImg.src = dataUrl;
      cloneImg.removeAttribute('srcset');
      continue;
    }

    // Never leave remote URLs in print/PDF — they render as visible link text when broken.
    const placeholder = document.createElement('div');
    placeholder.className = `${cloneImg.className || ''} qp-img-placeholder`.trim();
    placeholder.setAttribute('aria-hidden', 'true');
    cloneImg.replaceWith(placeholder);
  }

  return clone;
}
