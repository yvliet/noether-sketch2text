/**
 * @module Sketch2TextExtension
 * @description
 * Community extension for Flint that turns handwritten pen strokes on the sketch canvas
 * directly into typed text in real time.
 *
 * Integrates via Flint's general-purpose 'sketch:toolbar' slot, critical EventBus stroke
 * interception, and local-first geometric point-cloud recognition.
 *
 * @author Yuliet Li
 * @since 1.0.0
 */

import React from 'react';
import { Extension, FlintApp, ExtensionManifest, McpToolResult, z } from 'flint';
import { useSketch2TextStore } from './store/sketch2TextStore';
import { StrokeBuffer } from './recognizer/recognizer';
import { RecognitionResult } from './recognizer/types';
import { Sketch2TextButton } from './components/Sketch2TextButton';
import { Sketch2TextSettingsTab } from './components/Sketch2TextSettingsTab';

export const SKETCH2TEXT_MANIFEST: ExtensionManifest = {
  id: 'sketch2text',
  name: 'Sketch2Text',
  version: '1.0.0',
  description: 'Converts handwritten pen strokes on the sketch canvas into typed text in real time.',
  author: 'Yuliet Li',
  authorUrl: 'https://github.com/yvliet',
  tags: ['sketch', 'handwriting', 'pen-to-text', 'ocr', 'drawing'],
  dependencies: ['sketch'],
};

export class Sketch2TextExtension extends Extension {
  private strokeBuffer: StrokeBuffer | null = null;

  constructor(app: FlintApp, manifest: ExtensionManifest = SKETCH2TEXT_MANIFEST) {
    super(app, manifest);
  }

  public async onload(): Promise<void> {
    // 1. Initial prerequisite check: ensure Sketch core extension is active
    const isSketchActive = this.app.extensions.isExtensionEnabled('sketch');
    useSketch2TextStore.getState().setSketchEnabled(isSketchActive);

    // 2. Dynamically synchronize with Sketch extension lifecycle
    this.onEvent('extension:enabled', ({ extensionId }) => {
      if (extensionId === 'sketch') {
        useSketch2TextStore.getState().setSketchEnabled(true);
      }
    });

    this.onEvent('extension:disabled', ({ extensionId }) => {
      if (extensionId === 'sketch') {
        useSketch2TextStore.getState().setSketchEnabled(false);
        useSketch2TextStore.getState().setPenToTextActive(false);
        if (this.strokeBuffer) {
          this.strokeBuffer.clear();
        }
      }
    });

    // 3. Initialize spatial-temporal multi-stroke buffer
    this.strokeBuffer = new StrokeBuffer(
      (result) => {
        if (!result) {
          this.app?.workspace?.showToast?.('Pen-to-Text: No text recognized', 'warning');
          return;
        }
        this.handleRecognizedCharacter(result);
      },
      useSketch2TextStore.getState().debounceMs
    );

    // 4. Register toolbar toggle into the floating Sketch HUD bar
    this.registerPortalSlot({
      id: 'sketch2text-hud-toggle',
      slot: 'sketch:toolbar',
      order: 10,
      predicate: () => useSketch2TextStore.getState().isSketchEnabled,
      render: () => React.createElement(Sketch2TextButton, { app: this.app }),
    });

    // 5. Intercept pen strokes when Pen-to-Text mode is active
    this.onEvent('sketch:stroke-finished', (e) => {
      const { isSketchEnabled, isPenToTextActive } = useSketch2TextStore.getState();
      if (!isSketchEnabled || !isPenToTextActive) {
        return;
      }

      // Only convert strokes drawn with the pen tool
      if (e.stroke.tool === 'pen' && e.stroke.points && e.stroke.points.length >= 1) {
        // Synchronously suppress permanent canvas drawing persistence
        e.preventDefault();

        if (this.strokeBuffer) {
          this.strokeBuffer.setDebounceMs(useSketch2TextStore.getState().debounceMs);
          this.strokeBuffer.addStroke(e.stroke.id, e.stroke.points);
        }
      }
    });

    // 6. Register Command Palette shortcut (Ctrl+Alt+T)
    this.addCommand({
      id: 'toggle-pen-to-text',
      title: 'Sketch2Text: Toggle Pen-to-Text Mode',
      hotkey: 'Ctrl+Alt+T',
      action: () => {
        if (!useSketch2TextStore.getState().isSketchEnabled) {
          this.app.workspace.showToast('Sketch extension is disabled. Please enable Sketch first.', 'warning');
          return;
        }
        useSketch2TextStore.getState().togglePenToText();
        const active = useSketch2TextStore.getState().isPenToTextActive;
        this.app.workspace.showToast(
          active ? 'Pen-to-Text mode enabled' : 'Pen-to-Text mode disabled',
          'info'
        );
      },
    });

    // 7. Register Extension Settings Tab
    this.registerSettingTab({
      id: 'sketch2text-settings',
      name: 'Sketch2Text',
      render: () => React.createElement(Sketch2TextSettingsTab, { app: this.app }),
    });

    // 7a. Register Omnibox Search Provider (Ctrl+P / Ctrl+K with 'sketch:')
    if (typeof (this as any).registerSearchProvider === 'function') {
      (this as any).registerSearchProvider({
        id: 'sketch-search',
        prefix: 'sketch:',
        placeholder: 'Search sketches or toggle Pen-to-Text...',
        search: async (query: string) => {
          const q = query.toLowerCase().trim();
          const items: any[] = [];
          const active = useSketch2TextStore.getState().isPenToTextActive;

          if (!q || 'toggle'.includes(q) || 'pen'.includes(q)) {
            items.push({
              id: 'sketch:toggle-pen',
              title: active ? 'Disable Pen-to-Text Mode' : 'Enable Pen-to-Text Mode',
              description: active ? 'Currently active: strokes convert to text' : 'Currently inactive',
              category: 'Sketch2Text',
              badge: active ? 'Active' : 'Inactive',
              onSelect: () => {
                useSketch2TextStore.getState().togglePenToText();
                this.app.workspace.showToast(
                  useSketch2TextStore.getState().isPenToTextActive ? 'Pen-to-Text mode enabled' : 'Pen-to-Text mode disabled',
                  'info'
                );
              },
            });
          }

          const docs = this.app.hearth.documents;
          for (const doc of docs) {
            if (doc.doc_type === 'sketch' || doc.title.toLowerCase().endsWith('.sketch')) {
              if (!q || doc.title.toLowerCase().includes(q)) {
                items.push({
                  id: `sketch:doc:${doc.id}`,
                  title: doc.title,
                  description: 'Open handwritten sketch note',
                  category: 'Sketch Canvas',
                  badge: 'Sketch',
                  onSelect: () => {
                    this.app.workspace.openTab(doc.id);
                  },
                });
              }
            }
          }

          return items;
        },
      });
    }

    // 7b. Register Tab Context Menu Action
    if (typeof (this as any).registerTabContextMenuAction === 'function') {
      (this as any).registerTabContextMenuAction({
        id: 'sketch2text:toggle-pen-mode',
        title: 'Toggle Pen-to-Text Mode',
        order: 55,
        action: () => {
          useSketch2TextStore.getState().togglePenToText();
          this.app.workspace.showToast(
            useSketch2TextStore.getState().isPenToTextActive ? 'Pen-to-Text mode enabled' : 'Pen-to-Text mode disabled',
            'info'
          );
        },
      });
    }

    // 7c. Register Universal Document Title Decorator (Pen-to-Text status badge)
    if (typeof (this as any).registerDocumentTitleDecorator === 'function') {
      (this as any).registerDocumentTitleDecorator({
        id: 'sketch2text:title-pill',
        order: 45,
        render: () => {
          const { isPenToTextActive } = useSketch2TextStore.getState();
          if (!isPenToTextActive) return null;
          return React.createElement(
            'span',
            {
              className: 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer select-none bg-purple-500/20 text-purple-300 border border-purple-500/40',
              title: 'Pen-to-Text Mode Active',
              onClick: () => {
                useSketch2TextStore.getState().togglePenToText();
              },
            },
            React.createElement('span', { className: 'w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse' }),
            React.createElement('span', null, 'Pen-to-Text')
          );
        },
      });
    }

    // 7d. Register Custom Canvas Card Renderer via EventBus
    this.app.events.emit('canvas:register-card-renderer', {
      id: 'sketch-ocr-card',
      match: (doc: any) => doc?.title?.toLowerCase?.().endsWith('.sketch') || doc?.doc_type === 'sketch',
      render: (props: any) => {
        return React.createElement(
          'div',
          {
            className: 'w-full h-full p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs font-sans select-none flex flex-col justify-between',
          },
          React.createElement(
            'div',
            { className: 'font-semibold text-purple-300 flex items-center gap-1.5' },
            React.createElement('span', { className: 'w-2 h-2 rounded-full bg-purple-400' }),
            props.doc?.title || 'Sketch Note'
          ),
          React.createElement(
            'div',
            { className: 'text-[10px] text-[var(--noether-text-muted,#888)]' },
            'Interactive Handwriting & Sketch'
          )
        );
      },
    });

    // 8. Mandatory MCP AI Tool Registrations
    this.registerTool({
      name: 'get_status',
      description: 'Retrieves active status, debounce parameters, and prerequisite state for Sketch2Text',
      category: 'sketch',
      schema: z.object({}),
      handler: async (): Promise<McpToolResult> => {
        const state = useSketch2TextStore.getState();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                isSketchEnabled: state.isSketchEnabled,
                isPenToTextActive: state.isPenToTextActive,
                debounceMs: state.debounceMs,
                casingMode: state.casingMode,
                lastRecognized: state.lastRecognized,
              }),
            },
          ],
        };
      },
    });

    this.registerTool({
      name: 'toggle_mode',
      description: 'Toggles or explicitly sets whether handwritten pen strokes convert to text',
      category: 'sketch',
      schema: z.object({
        active: z.boolean().optional().describe('Target active state. Toggles current state if omitted.'),
      }),
      handler: async ({ active }): Promise<McpToolResult> => {
        const store = useSketch2TextStore.getState();
        if (!store.isSketchEnabled) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: 'Cannot activate Pen-to-Text: prerequisite Sketch extension is disabled.',
                }),
              },
            ],
            isError: true,
          };
        }

        const nextActive = typeof active === 'boolean' ? active : !store.isPenToTextActive;
        store.setPenToTextActive(nextActive);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                isPenToTextActive: nextActive,
                message: nextActive
                  ? 'Pen-to-Text mode is now active.'
                  : 'Pen-to-Text mode is now inactive.',
              }),
            },
          ],
        };
      },
    });
  }

  public onunload(): void {
    if (this.strokeBuffer) {
      this.strokeBuffer.clear();
      this.strokeBuffer = null;
    }
  }

  /**
   * Types the classified character or editing gesture into the active editor.
   */
  private handleRecognizedCharacter(result: RecognitionResult): void {
    const { casingMode } = useSketch2TextStore.getState();
    let text = result.character;

    // Apply casing transformation
    if (casingMode === 'upper') {
      text = text.toUpperCase();
    } else if (casingMode === 'lower') {
      text = text.toLowerCase();
    }

    useSketch2TextStore.getState().setLastRecognized(text);

    // Retrieve active TipTap editor instance from EditorRegistry (with window fallback)
    let editor = this.app.editor.getActiveEditor();
    if (!editor && typeof window !== 'undefined' && (window as any).__flintEditor) {
      editor = (window as any).__flintEditor;
    }
    if (!editor) {
      console.warn('[Sketch2Text] No active editor found to insert recognized text');
      return;
    }

    try {
      if (text === '\b') {
        // Backspace: delete character or active selection
        const { from, to, empty } = editor.state.selection;
        if (!empty) {
          editor.commands.deleteRange({ from, to });
        } else if (from > 1) {
          editor.commands.deleteRange({ from: from - 1, to: from });
        }
      } else if (text === '\n') {
        // Enter: insert newline / split block
        editor.commands.enter();
      } else if (text === ' ') {
        // Space
        editor.commands.insertContent(' ');
      } else {
        // Alphanumeric word, phrase, character or punctuation
        const insertText = text.length > 1 ? `${text} ` : text;
        const inserted = editor.commands.insertContent(insertText);
        if (!inserted) {
          try {
            editor.commands.insertContentAt(editor.state.doc.content.size - 1, insertText);
          } catch (err) {
            console.warn('[Sketch2Text] Fallback insertion error:', err);
          }
        }
        if (this.app?.workspace?.showToast) {
          this.app.workspace.showToast(`Transcribed: "${text}"`, 'info');
        }
      }

      // Proactively dismiss soft virtual keyboard if summoned by tablet digitizer
      if (typeof navigator !== 'undefined' && 'virtualKeyboard' in navigator) {
        try {
          (navigator as any).virtualKeyboard.hide?.();
        } catch {}
      }
    } catch (err) {
      console.error('[Sketch2Text] Error typing recognized character into editor:', err);
    }
  }
}

export default Sketch2TextExtension;

