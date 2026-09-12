# Sketch2Text

Converts handwritten pen strokes on the sketch canvas into clean typed text in real time.

---

## 1. Overview & User Experience

Stylus input on tablets and touchscreens offers natural spatial expression, but notes are most useful when searchable and machine-readable.

**Sketch2Text** bridges handwriting and typed notes. When enabled in the floating Sketch HUD, any words or characters you handwrite with your stylus or mouse are automatically recognized and converted into clean typed Markdown text at your cursor position in real time.

### Where It Lives in Noether
- **Floating Sketch HUD**: A dedicated handwriting toggle switch appears right in the Sketch drawing toolbar.
- **Settings Window**: Configure recognition languages and debounce delay under **Settings** (`Ctrl+,`) → **Sketch2Text**.

## 2. Features & Step-by-Step Guide

### 1. Writing by Hand to Text
1. Open the Sketch overlay by pressing `Ctrl+Shift+S`.
2. Toggle the **Handwriting Recognition** switch in the toolbar.
3. Write words naturally on the canvas.
4. When you pause writing, Sketch2Text recognizes the ink stroke trajectory and inserts the recognized words into your Markdown document.

## 3. Architecture & SDK Blueprint (For Extension Builders)

Sketch2Text demonstrates how to intercept freehand vector ink paths from another extension's event stream and dispatch typed text transactions via the Noether SDK.

### SDK Extension Points Used
- `this.onEvent('sketch:stroke-completed')`: Listens to completed vector strokes.
- `this.app.editor.insertText()`: Dispatches recognized text into the active editor buffer.

### Real SDK Implementation Pattern

```typescript
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
```

## 4. MCP Tools Reference

### 1. `sketch2text_recognize`
- **Description**: Evaluates vector stroke arrays and returns recognized text string.
- **Parameters**:
  - `strokes` (array, required): Array of vector coordinate points.

## 5. Development & Local Building

To build and test this community extension locally:

```bash
git clone https://github.com/yvliet/noether-sketch2text.git
cd noether-sketch2text
npm install
npm run build
```

Copy the compiled bundle `dist/main.js` and `manifest.json` into your vault's `.noether/extensions/noether-sketch2text/` directory and reload Noether.

## 6. License

MIT © [Yuliet Li](https://github.com/yvliet)
