# Sketch2Text

Converts handwritten pen strokes on the sketch canvas into clean typed text in real time.

---

> [!WARNING]
> **RETIRED & ARCHIVED**: Following the retirement of the native Sketch extension in Noether Core, Sketch2Text has been retired and this repository is now archived as read-only.

## 1. Overview & Historical Context

Stylus input on tablets and touchscreens offers natural spatial expression, but notes are most useful when searchable and machine-readable.

**Sketch2Text** historically bridged handwriting and typed notes for Noether. When enabled in the floating Sketch HUD, words or characters handwritten with a stylus or mouse were recognized and converted into clean typed Markdown text at the cursor position in real time.

## 2. Architecture & SDK Blueprint (Reference Archive)

Sketch2Text demonstrated how to intercept freehand vector ink paths from another extension's event stream and dispatch typed text transactions via the Noether SDK.

### SDK Extension Points Used
- `this.onEvent('sketch:stroke-completed')`: Listened to completed vector strokes.
- `this.app.editor.insertText()`: Dispatched recognized text into the active editor buffer.

### SDK Implementation Pattern

`	ypescript
import { Extension, NoetherApp } from 'noether';

export default class Sketch2TextExtension extends Extension {
  async onload(): Promise<void> {
    this.app.events.on('sketch:stroke-completed', async (stroke) => {
      const recognized = await this.recognizeInk(stroke);
      if (recognized) {
        this.app.editor.insertText(recognized);
      }
    });
  }
}
`

## 3. MCP Tools Reference (Historical)

### 1. sketch2text_recognize
- **Description**: Evaluates vector stroke arrays and returns recognized text string.
- **Parameters**:
  - strokes (array, required): Array of vector coordinate points.

## 4. License

MIT (c) [Yuliet Li](https://github.com/yvliet)
