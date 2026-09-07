/**
 * Geometric character and gesture prototypes for the $P handwriting recognizer.
 * Provides pre-normalized templates for uppercase letters, lowercase letters,
 * digits, and common editing gestures.
 */

import { CharacterTemplate, RecognizerPoint } from './types';
import { normalizePointCloud } from './pointCloud';

function line(x1: number, y1: number, x2: number, y2: number, steps = 8, strokeIdx = 0): RecognizerPoint[] {
  const pts: RecognizerPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
      strokeIndex: strokeIdx,
    });
  }
  return pts;
}

function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngleDeg: number,
  endAngleDeg: number,
  steps = 14,
  strokeIdx = 0
): RecognizerPoint[] {
  const pts: RecognizerPoint[] = [];
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startRad + t * (endRad - startRad);
    pts.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      strokeIndex: strokeIdx,
    });
  }
  return pts;
}

function makeTemplate(name: string, rawPoints: RecognizerPoint[], strokeCount = 1): CharacterTemplate {
  return {
    name,
    points: normalizePointCloud(rawPoints),
    strokeCount,
  };
}

/**
 * Creates canonical character templates.
 */
export function createCharacterTemplates(): CharacterTemplate[] {
  const templates: CharacterTemplate[] = [
    // ── Gestures ──
    makeTemplate('Space', line(0, 50, 100, 50, 12, 0)),
    makeTemplate('Backspace', line(100, 50, 0, 50, 12, 0)),
    makeTemplate('Enter', [
      ...line(100, 20, 100, 80, 8, 0),
      ...line(100, 80, 20, 80, 8, 0),
      ...line(20, 80, 40, 60, 4, 0),
    ]),
    makeTemplate('Period', [
      { x: 50, y: 50, strokeIndex: 0 },
      { x: 51, y: 51, strokeIndex: 0 },
      { x: 49, y: 50, strokeIndex: 0 },
    ]),
    makeTemplate('Comma', [
      ...line(50, 40, 50, 55, 4, 0),
      ...arc(40, 55, 10, 15, 0, 90, 6, 0),
    ]),

    // ── Digits ──
    makeTemplate('0', arc(50, 50, 30, 45, 0, 360, 20, 0)),
    makeTemplate('1', [
      ...line(35, 25, 50, 10, 4, 0),
      ...line(50, 10, 50, 90, 12, 0),
      ...line(30, 90, 70, 90, 6, 0),
    ]),
    makeTemplate('2', [
      ...arc(50, 32, 22, 22, 180, 0, 10, 0),
      ...line(72, 32, 28, 88, 10, 0),
      ...line(28, 88, 75, 88, 8, 0),
    ]),
    makeTemplate('3', [
      ...arc(50, 30, 22, 20, 200, -20, 10, 0),
      ...arc(50, 70, 24, 20, -20, 160, 10, 0),
    ]),
    makeTemplate('4', [
      ...line(65, 90, 65, 10, 10, 0),
      ...line(65, 10, 20, 65, 8, 0),
      ...line(20, 65, 80, 65, 8, 0),
    ]),
    makeTemplate('5', [
      ...line(70, 15, 35, 15, 6, 0),
      ...line(35, 15, 32, 45, 6, 0),
      ...arc(50, 65, 25, 22, -90, 120, 12, 0),
    ]),
    makeTemplate('6', [
      ...arc(50, 65, 24, 25, 0, 360, 14, 0),
      ...arc(65, 40, 24, 30, 90, 180, 8, 0),
    ]),
    makeTemplate('7', [
      ...line(20, 15, 80, 15, 8, 0),
      ...line(80, 15, 40, 90, 12, 0),
    ]),
    makeTemplate('8', [
      ...arc(50, 32, 18, 18, 0, 360, 14, 0),
      ...arc(50, 68, 22, 22, 0, 360, 16, 0),
    ]),
    makeTemplate('9', [
      ...arc(50, 35, 24, 25, 0, 360, 14, 0),
      ...line(74, 35, 74, 90, 10, 0),
    ]),

    // ── Uppercase Alphabet ──
    makeTemplate('A', [
      ...line(20, 90, 50, 10, 10, 0),
      ...line(50, 10, 80, 90, 10, 0),
      ...line(35, 55, 65, 55, 6, 1),
    ], 2),
    makeTemplate('B', [
      ...line(25, 10, 25, 90, 10, 0),
      ...arc(25, 30, 25, 20, -90, 90, 10, 1),
      ...arc(25, 70, 28, 20, -90, 90, 10, 1),
    ], 2),
    makeTemplate('C', arc(55, 50, 30, 40, 45, 315, 18, 0)),
    makeTemplate('D', [
      ...line(25, 10, 25, 90, 10, 0),
      ...arc(25, 50, 38, 40, -90, 90, 14, 1),
    ], 2),
    makeTemplate('E', [
      ...line(25, 10, 25, 90, 10, 0),
      ...line(25, 10, 75, 10, 6, 1),
      ...line(25, 50, 65, 50, 5, 2),
      ...line(25, 90, 75, 90, 6, 3),
    ], 2),
    makeTemplate('F', [
      ...line(25, 10, 25, 90, 10, 0),
      ...line(25, 10, 75, 10, 6, 1),
      ...line(25, 50, 65, 50, 5, 2),
    ], 2),
    makeTemplate('G', [
      ...arc(55, 50, 32, 40, 45, 330, 16, 0),
      ...line(75, 50, 55, 50, 6, 0),
      ...line(75, 50, 75, 75, 6, 0),
    ]),
    makeTemplate('H', [
      ...line(25, 10, 25, 90, 10, 0),
      ...line(75, 10, 75, 90, 10, 1),
      ...line(25, 50, 75, 50, 8, 2),
    ], 2),
    makeTemplate('I', [
      ...line(30, 10, 70, 10, 6, 0),
      ...line(50, 10, 50, 90, 10, 1),
      ...line(30, 90, 70, 90, 6, 2),
    ], 1),
    makeTemplate('J', [
      ...line(65, 10, 65, 75, 10, 0),
      ...arc(45, 75, 20, 15, 0, 180, 8, 0),
    ]),
    makeTemplate('K', [
      ...line(25, 10, 25, 90, 10, 0),
      ...line(75, 15, 25, 50, 8, 1),
      ...line(25, 50, 75, 90, 8, 2),
    ], 2),
    makeTemplate('L', [
      ...line(25, 10, 25, 90, 10, 0),
      ...line(25, 90, 75, 90, 8, 0),
    ]),
    makeTemplate('M', [
      ...line(20, 90, 20, 10, 10, 0),
      ...line(20, 10, 50, 60, 8, 0),
      ...line(50, 60, 80, 10, 8, 0),
      ...line(80, 10, 80, 90, 10, 0),
    ]),
    makeTemplate('N', [
      ...line(25, 90, 25, 10, 10, 0),
      ...line(25, 10, 75, 90, 10, 0),
      ...line(75, 90, 75, 10, 10, 0),
    ]),
    makeTemplate('O', arc(50, 50, 32, 42, 0, 360, 22, 0)),
    makeTemplate('P', [
      ...line(25, 10, 25, 90, 10, 0),
      ...arc(25, 32, 28, 22, -90, 90, 12, 1),
    ], 2),
    makeTemplate('Q', [
      ...arc(50, 48, 30, 38, 0, 360, 20, 0),
      ...line(55, 65, 80, 90, 6, 1),
    ], 2),
    makeTemplate('R', [
      ...line(25, 10, 25, 90, 10, 0),
      ...arc(25, 32, 28, 22, -90, 90, 12, 1),
      ...line(45, 54, 75, 90, 8, 2),
    ], 2),
    makeTemplate('S', [
      ...arc(50, 30, 20, 18, 45, 260, 10, 0),
      ...arc(50, 70, 22, 20, -90, 120, 10, 0),
    ]),
    makeTemplate('T', [
      ...line(15, 15, 85, 15, 10, 0),
      ...line(50, 15, 50, 90, 10, 1),
    ], 2),
    makeTemplate('U', [
      ...line(25, 15, 25, 65, 8, 0),
      ...arc(50, 65, 25, 25, 180, 360, 10, 0),
      ...line(75, 65, 75, 15, 8, 0),
    ]),
    makeTemplate('V', [
      ...line(20, 15, 50, 90, 10, 0),
      ...line(50, 90, 80, 15, 10, 0),
    ]),
    makeTemplate('W', [
      ...line(15, 15, 32, 90, 8, 0),
      ...line(32, 90, 50, 35, 6, 0),
      ...line(50, 35, 68, 90, 6, 0),
      ...line(68, 90, 85, 15, 8, 0),
    ]),
    makeTemplate('X', [
      ...line(20, 15, 80, 90, 10, 0),
      ...line(80, 15, 20, 90, 10, 1),
    ], 2),
    makeTemplate('Y', [
      ...line(20, 15, 50, 50, 6, 0),
      ...line(80, 15, 50, 50, 6, 1),
      ...line(50, 50, 50, 90, 8, 0),
    ], 2),
    makeTemplate('Z', [
      ...line(20, 15, 80, 15, 8, 0),
      ...line(80, 15, 20, 90, 10, 0),
      ...line(20, 90, 80, 90, 8, 0),
    ]),

    // ── Lowercase Alphabet ──
    makeTemplate('a', [
      ...arc(48, 55, 22, 22, 0, 360, 14, 0),
      ...line(70, 33, 70, 85, 8, 0),
    ]),
    makeTemplate('b', [
      ...line(25, 10, 25, 85, 12, 0),
      ...arc(48, 58, 23, 27, 0, 360, 14, 0),
    ]),
    makeTemplate('c', arc(50, 60, 20, 25, 45, 315, 14, 0)),
    makeTemplate('d', [
      ...arc(45, 60, 22, 25, 0, 360, 14, 0),
      ...line(67, 10, 67, 85, 12, 0),
    ]),
    makeTemplate('e', [
      ...line(25, 58, 70, 58, 6, 0),
      ...arc(48, 58, 24, 25, 0, -290, 14, 0),
    ]),
    makeTemplate('h', [
      ...line(25, 10, 25, 85, 12, 0),
      ...arc(50, 60, 25, 25, 180, 360, 10, 0),
      ...line(75, 60, 75, 85, 6, 0),
    ]),
    makeTemplate('i', [
      ...line(50, 40, 50, 85, 8, 0),
      { x: 50, y: 22, strokeIndex: 1 },
      { x: 50, y: 24, strokeIndex: 1 },
    ], 2),
    makeTemplate('l', line(50, 10, 50, 85, 12, 0)),
    makeTemplate('o', arc(50, 60, 22, 25, 0, 360, 16, 0)),
    makeTemplate('t', [
      ...line(50, 20, 50, 85, 10, 0),
      ...line(30, 42, 70, 42, 6, 1),
    ], 2),
    makeTemplate('u', [
      ...line(25, 40, 25, 75, 6, 0),
      ...arc(50, 75, 25, 18, 180, 360, 8, 0),
      ...line(75, 75, 75, 40, 6, 0),
    ]),
  ];

  return templates;
}
