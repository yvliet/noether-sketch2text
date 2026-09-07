/**
 * Real-time character recognition orchestrator and stroke buffering pipeline.
 */

import { RecognizerPoint, RecognitionResult, CharacterTemplate } from './types';
import { normalizePointCloud, matchPointClouds } from './pointCloud';
import { createCharacterTemplates } from './templates';
import { recognizeOnlineHandwriting } from './onlineRecognizer';
import { useSketch2TextStore } from '../store/sketch2TextStore';

export class HandwritingRecognizer {
  private templates: CharacterTemplate[];

  constructor() {
    this.templates = createCharacterTemplates();
  }

  /**
   * Classifies a collection of raw stroke points against the geometric template catalog.
   */
  public recognize(rawPoints: RecognizerPoint[]): RecognitionResult | null {
    if (rawPoints.length < 2) {
      return null;
    }

    const normalizedCandidate = normalizePointCloud(rawPoints);
    let bestScore = -Infinity;
    let bestTemplate: CharacterTemplate | null = null;

    for (const tmpl of this.templates) {
      const distance = matchPointClouds(normalizedCandidate, tmpl.points);
      // Normalized similarity score: 1.0 is exact match, 0 is complete mismatch
      const score = Math.max(0, 1 - distance / 2.0);

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = tmpl;
      }
    }

    if (!bestTemplate) {
      return null;
    }

    let character = bestTemplate.name;
    if (character === 'Space') character = ' ';
    else if (character === 'Backspace') character = '\b';
    else if (character === 'Enter') character = '\n';
    else if (character === 'Period') character = '.';
    else if (character === 'Comma') character = ',';

    return {
      character,
      score: bestScore,
      templateName: bestTemplate.name,
    };
  }
}

export interface BufferedStroke {
  id: string;
  points: RecognizerPoint[];
  timestamp: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Manages spatial-temporal bundling for multi-stroke characters (such as crossing a 'T' or dotting an 'i').
 */
export class StrokeBuffer {
  private recognizer: HandwritingRecognizer;
  private pendingStrokes: BufferedStroke[] = [];
  private debounceTimer: any = null;
  private debounceMs = 350;
  private onRecognized: (result: RecognitionResult | null) => void;

  constructor(onRecognized: (result: RecognitionResult | null) => void, debounceMs = 350) {
    this.recognizer = new HandwritingRecognizer();
    this.onRecognized = onRecognized;
    this.debounceMs = debounceMs;
  }

  public setDebounceMs(ms: number): void {
    this.debounceMs = Math.max(100, Math.min(1200, ms));
  }

  public addStroke(strokeId: string, rawPoints: RecognizerPoint[]): void {
    if (rawPoints.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const pt of rawPoints) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }

    const stroke: BufferedStroke = {
      id: strokeId,
      points: rawPoints,
      timestamp: Date.now(),
      boundingBox: { minX, minY, maxX, maxY },
    };

    const { engineMode } = useSketch2TextStore.getState();

    // In offline ($P template) mode, flush previous letter when moving right/down to next letter position
    if (engineMode === 'offline' && this.pendingStrokes.length > 0) {
      const prev = this.pendingStrokes[this.pendingStrokes.length - 1];
      const movedRight = stroke.boundingBox.minX > prev.boundingBox.maxX + 14;
      const movedDown = stroke.boundingBox.minY > prev.boundingBox.maxY + 22;
      const distance = Math.hypot(
        (stroke.boundingBox.minX + stroke.boundingBox.maxX) / 2 - (prev.boundingBox.minX + prev.boundingBox.maxX) / 2,
        (stroke.boundingBox.minY + stroke.boundingBox.maxY) / 2 - (prev.boundingBox.minY + prev.boundingBox.maxY) / 2
      );

      // Flush previous letter if the user clearly moved to the next character position
      if (movedRight || movedDown || distance > 80) {
        this.flush();
      }
    }

    this.pendingStrokes.push(stroke);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  public async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.pendingStrokes.length === 0) return;

    const strokesToProcess = [...this.pendingStrokes];
    this.pendingStrokes = [];

    const { engineMode, language } = useSketch2TextStore.getState();

    // 1. Online Recognition: recognizes full words, continuous cursive, and sentences
    if (engineMode === 'online') {
      try {
        const text = await recognizeOnlineHandwriting(strokesToProcess, language);
        if (text && text.trim().length > 0) {
          this.onRecognized({
            character: text,
            score: 1.0,
            templateName: 'online',
          });
          return;
        }
      } catch (err) {
        console.warn('[Sketch2Text] Online recognition error, falling back to local:', err);
      }
    }

    // 2. Offline Fallback: Local Dollar-$P geometric point cloud matching
    const allPoints: RecognizerPoint[] = [];
    strokesToProcess.forEach((s, idx) => {
      s.points.forEach((pt) => {
        allPoints.push({
          ...pt,
          strokeIndex: idx,
        });
      });
    });

    const result = this.recognizer.recognize(allPoints);
    if (result) {
      this.onRecognized(result);
    } else {
      this.onRecognized(null);
    }
  }

  public clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingStrokes = [];
  }
}
