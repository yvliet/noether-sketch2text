/**
 * High-performance geometric point-cloud processing for unistroke and multi-stroke recognition.
 * Implements the $P Point-Cloud algorithm principles for zero-latency, local-first character recognition.
 */

import { RecognizerPoint } from './types';

export const RESAMPLE_COUNT = 32;

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function euclideanDistance(p1: RecognizerPoint, p2: RecognizerPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

/**
 * Calculates total arc length of a sequential series of stroke points.
 */
export function calculatePathLength(points: RecognizerPoint[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += euclideanDistance(points[i - 1], points[i]);
  }
  return length;
}

/**
 * Resamples an irregular stroke sequence into N equidistant points along the trajectory.
 */
export function resample(points: RecognizerPoint[], targetCount = RESAMPLE_COUNT): RecognizerPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const totalLength = calculatePathLength(points);
  if (totalLength === 0) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const segmentInterval = totalLength / (targetCount - 1);
  const resampled: RecognizerPoint[] = [{ ...points[0] }];
  let accumulatedDist = 0;
  const workingPoints = [...points];

  for (let i = 1; i < workingPoints.length; i++) {
    const pPrev = workingPoints[i - 1];
    const pCurr = workingPoints[i];
    const dist = euclideanDistance(pPrev, pCurr);

    if (accumulatedDist + dist >= segmentInterval) {
      const ratio = (segmentInterval - accumulatedDist) / (dist || 1e-6);
      const newX = pPrev.x + ratio * (pCurr.x - pPrev.x);
      const newY = pPrev.y + ratio * (pCurr.y - pPrev.y);
      const newPt: RecognizerPoint = {
        x: newX,
        y: newY,
        strokeIndex: pCurr.strokeIndex ?? pPrev.strokeIndex,
      };

      resampled.push(newPt);
      workingPoints.splice(i, 0, newPt);
      accumulatedDist = 0;
    } else {
      accumulatedDist += dist;
    }
  }

  while (resampled.length < targetCount) {
    resampled.push({ ...points[points.length - 1] });
  }

  return resampled.slice(0, targetCount);
}

/**
 * Scales point cloud coordinates to fit within a unit bounding box [0, 1] while preserving aspect ratio.
 */
export function scaleToUnit(points: RecognizerPoint[]): RecognizerPoint[] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = Math.max(maxX - minX, 1e-4);
  const height = Math.max(maxY - minY, 1e-4);
  const scaleFactor = Math.max(width, height);

  return points.map((pt) => ({
    ...pt,
    x: (pt.x - minX) / scaleFactor,
    y: (pt.y - minY) / scaleFactor,
  }));
}

/**
 * Translates point cloud so its centroid sits exactly at (0, 0).
 */
export function translateToCentroid(points: RecognizerPoint[]): RecognizerPoint[] {
  if (points.length === 0) return [];
  let sumX = 0;
  let sumY = 0;

  for (const pt of points) {
    sumX += pt.x;
    sumY += pt.y;
  }

  const centerX = sumX / points.length;
  const centerY = sumY / points.length;

  return points.map((pt) => ({
    ...pt,
    x: pt.x - centerX,
    y: pt.y - centerY,
  }));
}

/**
 * Full normalization pipeline: resample -> scale -> translate.
 */
export function normalizePointCloud(points: RecognizerPoint[], targetCount = RESAMPLE_COUNT): RecognizerPoint[] {
  if (points.length === 0) return [];
  const resampled = resample(points, targetCount);
  const scaled = scaleToUnit(resampled);
  return translateToCentroid(scaled);
}

/**
 * Greedy minimum-distance point-cloud matching (Greedy Cloud Distance).
 * Computes bidirectional point correspondences between candidate gesture P and template Q.
 */
export function computeCloudDistance(
  pts1: RecognizerPoint[],
  pts2: RecognizerPoint[],
  startIndex = 0
): number {
  const n = pts1.length;
  const matched = new Array<boolean>(n).fill(false);
  let sum = 0;
  let i = startIndex;

  do {
    let minDistance = Infinity;
    let index = -1;

    for (let j = 0; j < n; j++) {
      if (!matched[j]) {
        const d = euclideanDistance(pts1[i], pts2[j]);
        if (d < minDistance) {
          minDistance = d;
          index = j;
        }
      }
    }

    if (index !== -1) {
      matched[index] = true;
      const weight = 1 - ((i - startIndex + n) % n) / (2 * n);
      sum += weight * minDistance;
    }

    i = (i + 1) % n;
  } while (i !== startIndex);

  return sum;
}

/**
 * Computes minimum bidirectional cloud distance across sampling orientations.
 */
export function matchPointClouds(candidate: RecognizerPoint[], template: RecognizerPoint[]): number {
  const n = candidate.length;
  const step = Math.floor(Math.pow(n, 0.5));
  let min = Infinity;

  for (let i = 0; i < n; i += step) {
    const d1 = computeCloudDistance(candidate, template, i);
    const d2 = computeCloudDistance(template, candidate, i);
    min = Math.min(min, d1, d2);
  }

  return min;
}
