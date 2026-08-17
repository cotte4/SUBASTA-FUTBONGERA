/**
 * Fotos subidas desde el dispositivo.
 *
 * Sin backend, la unica forma de guardar una imagen es meterla como data URL
 * dentro de localStorage, que tiene ~5MB para TODO el origen (plantel y
 * partidas guardadas incluidas). Una foto de celular cruda se come esa cuota
 * sola, asi que antes de guardar se reduce y se recomprime a JPEG.
 *
 * 320px de lado y calidad 0.72 dan entre 15 y 40 KB por jugador: alcanza de
 * sobra para un avatar y entran decenas sin acercarse al limite.
 */

const MAX_SIDE = 320;
const QUALITY = 0.72;
const MAX_BYTES = 200 * 1024;

export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif';

export type ImageResult = { ok: true; dataUrl: string; bytes: number } | { ok: false; error: string };

export async function fileToAvatarDataUrl(file: File): Promise<ImageResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Ese archivo no es una imagen.' };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: 'No pude leer esa imagen. Probá con un JPG o PNG.' };
  }

  // Recorte cuadrado centrado hacia arriba: los avatares se muestran con
  // object-top, asi que conviene conservar la cabeza y no el centro exacto.
  const side = Math.min(bitmap.width, bitmap.height);
  const sourceX = (bitmap.width - side) / 2;
  const sourceY = Math.min((bitmap.height - side) / 2, bitmap.height * 0.1);

  const canvas = document.createElement('canvas');
  canvas.width = MAX_SIDE;
  canvas.height = MAX_SIDE;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return { ok: false, error: 'Este navegador no puede procesar la imagen.' };
  }

  context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, MAX_SIDE, MAX_SIDE);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  const bytes = Math.ceil((dataUrl.length * 3) / 4);

  if (bytes > MAX_BYTES) {
    return { ok: false, error: 'La imagen quedó demasiado pesada. Probá con uno más chico.' };
  }

  return { ok: true, dataUrl, bytes };
}

export function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}
