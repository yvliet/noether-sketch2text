/**
 * Geometric types for handwriting point cloud recognition.
 */

export interface RecognizerPoint {
  x: number;
  y: number;
  strokeIndex?: number;
  pressure?: number;
}

export interface CharacterTemplate {
  name: string;
  points: RecognizerPoint[];
  strokeCount?: number;
}

export interface RecognitionResult {
  character: string;
  score: number;
  templateName: string;
}
