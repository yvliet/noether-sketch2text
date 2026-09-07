/**
 * Online multi-stroke cursive handwriting recognition client.
 * Leverages Google Input Tools handwriting API for state-of-the-art
 * cursive word, phrase, and sentence transcription across Windows, macOS, and Linux.
 */

import { RecognizerPoint } from './types';

export interface StrokeInput {
  points: RecognizerPoint[];
}

export async function recognizeOnlineHandwriting(
  strokes: StrokeInput[],
  language = 'en'
): Promise<string | null> {
  if (strokes.length === 0) return null;

  // Compute bounding box dimensions to guide recognition scaling
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const s of strokes) {
    for (const pt of s.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  // Offset ink coordinates so they start relative to (20, 20) inside the writing area
  const offsetX = minX - 20;
  const offsetY = minY - 20;

  // Format ink coordinate arrays: [[x1, x2, ...], [y1, y2, ...], []]
  const ink = strokes.map((s) => [
    s.points.map((pt) => Math.round(pt.x - offsetX)),
    s.points.map((pt) => Math.round(pt.y - offsetY)),
    [],
  ]);

  const width = Math.max(100, Math.round(maxX - minX + 40));
  const height = Math.max(100, Math.round(maxY - minY + 40));

  const payload = {
    options: 'enable_pre_space',
    requests: [
      {
        writing_guide: {
          writing_area_width: width,
          writing_area_height: height,
        },
        ink,
        language,
      },
    ],
  };

  try {
    const res = await fetch(
      'https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && data[0] === 'SUCCESS' && Array.isArray(data[1]) && data[1][0]) {
      const candidates = data[1][0][1];
      if (Array.isArray(candidates) && candidates.length > 0) {
        return candidates[0];
      }
    }
  } catch (err) {
    console.warn('[Sketch2Text] Online handwriting request failed, falling back to local engine:', err);
  }

  return null;
}
