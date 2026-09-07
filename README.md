# Sketch2Text

Handwritten pen stroke-to-text recognition extension for Flint.

---

## 1. Overview
---

Sketch2Text turns handwritten strokes drawn on your note canvas into clean typed text in real time. When enabled via the toggle in the floating Sketch HUD bar, writing characters with your stylus or mouse automatically transcribes them into your document, clearing the ink from your vector drawing layer as you write.

Because Sketch2Text directly hooks into the freehand drawing overlay, it operates as a companion extension to Flint's built-in **Sketch** core extension.

---

## 2. Key Capabilities
---

- **HUD Toolbar Toggle**: Mounts directly into the floating Sketch bar so you can switch between drawing illustrations and writing text with a single click.
- **Real-Time Handwriting Transcription**: Recognizes uppercase letters (`A-Z`), lowercase letters (`a-z`), digits (`0-9`), and basic punctuation.
- **Smart Stroke Grouping**: Uses a configurable multi-stroke buffer (default 350ms) to group multi-stroke letters such as crossing a `t`, dotting an `i`, or finishing an `A`.
- **Gesture Shortcuts**:
  - Horizontal swipe to the right (`→`) inserts a space.
  - Quick horizontal scratch to the left (`←`) deletes the preceding character (Backspace).
  - Down-and-left return stroke inserts a newline (Enter).
- **100% Offline & Local-First**: Powered by an in-memory geometric point-cloud recognizer running on the client thread with sub-2ms latency. Zero cloud dependencies, zero external model files, and zero data leakage.
- **Graceful Dependency Management**: Automatically checks for the Sketch extension. If Sketch is disabled, Sketch2Text enters a quiet standby mode and warns you in Settings.

---

## 3. Keyboard Shortcuts & Commands
---

| Action | Shortcut | Description |
| :--- | :--- | :--- |
| **Toggle Pen-to-Text** | `Ctrl+Alt+T` | Switches between vector ink drawing and handwriting transcription |
| **Space** | Horizontal right flick | Inserts a space character at the cursor |
| **Backspace** | Horizontal left flick | Deletes the character before the cursor |
| **Enter** | Down-and-left stroke | Starts a new paragraph |

---

## 4. Configuration Options
---

Open **Settings** (`Ctrl+,`) → **Community Extensions** → **Sketch2Text**:

- **Pen-to-Text Mode**: Toggles handwriting recognition on or off globally.
- **Multi-Stroke Debounce Window**: Adjusts the temporal window (150ms to 800ms) waited before finalizing a letter. Faster writers can reduce this value to 250ms; deliberate writers can increase it to 450ms.
- **Letter Casing Preference**: Choose between handwritten case (Auto), forced uppercase, or forced lowercase.
- **Prerequisite Status**: Real-time diagnostic badge displaying whether the parent Sketch extension is active.

---

## 5. Development & Building
---

To compile the standalone distribution bundle:

```bash
cd community-extensions/sketch2text
npm install
npm run build
```

Or from the Flint monorepo root:

```bash
npm run extensions:build
```
