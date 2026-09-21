/**
 * @module Sketch2TextSettingsTab
 * @description
 * Native settings interface for the Sketch2Text extension.
 * Adheres to Noether design standards with instant micro-interactions,
 * grouped setting cards, segmented button controls, and gesture reference tiles.
 */

import React from 'react';
import type { NoetherApp } from 'noether';
import {
  SettingCard,
  SettingItem,
  Button,
  Toggle,
  Slider,
  Select,
} from 'noether';
import {
  useSketch2TextStore,
  DEFAULT_SKETCH2TEXT_SETTINGS,
} from '../store/sketch2TextStore';
import {
  RotateCcwIcon,
  CheckIcon,
  PenIcon,
  SparklesIcon,
  KeyboardIcon,
  CornerDownLeftIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from './Icons';

export interface Sketch2TextSettingsTabProps {
  app?: NoetherApp;
}

function formatRecognizedChar(char: string): string {
  if (char === ' ') return '[Space]';
  if (char === '\b') return '[Backspace]';
  if (char === '\n') return '[Enter / Return]';
  return `"${char}"`;
}

export const Sketch2TextSettingsTab: React.FC<Sketch2TextSettingsTabProps> = ({ app }) => {
  const isPenToTextActive = useSketch2TextStore((s) => s.isPenToTextActive);
  const isSketchEnabled = useSketch2TextStore((s) => s.isSketchEnabled);
  const debounceMs = useSketch2TextStore((s) => s.debounceMs);
  const casingMode = useSketch2TextStore((s) => s.casingMode);
  const engineMode = useSketch2TextStore((s) => s.engineMode);
  const language = useSketch2TextStore((s) => s.language);
  const lastRecognized = useSketch2TextStore((s) => s.lastRecognized);

  const setPenToTextActive = useSketch2TextStore((s) => s.setPenToTextActive);
  const setDebounceMs = useSketch2TextStore((s) => s.setDebounceMs);
  const setCasingMode = useSketch2TextStore((s) => s.setCasingMode);
  const setEngineMode = useSketch2TextStore((s) => s.setEngineMode);
  const setLanguage = useSketch2TextStore((s) => s.setLanguage);
  const setLastRecognized = useSketch2TextStore((s) => s.setLastRecognized);
  const restoreDefaults = useSketch2TextStore((s) => s.restoreDefaults);

  const isDebounceModified = debounceMs !== DEFAULT_SKETCH2TEXT_SETTINGS.debounceMs;
  const isEngineModified = engineMode !== DEFAULT_SKETCH2TEXT_SETTINGS.engineMode;
  const isLanguageModified = language !== DEFAULT_SKETCH2TEXT_SETTINGS.language;
  const isCasingModified = casingMode !== DEFAULT_SKETCH2TEXT_SETTINGS.casingMode;

  const isAnyModified =
    isDebounceModified ||
    isEngineModified ||
    isLanguageModified ||
    isCasingModified;

  const handleRestoreDefaults = () => {
    restoreDefaults();
    app?.workspace?.showToast?.('Restored Sketch2Text defaults', 'info');
  };

  const handleEnableSketch = async () => {
    if (app?.extensions?.enableExtension) {
      await app.extensions.enableExtension('sketch');
      useSketch2TextStore.getState().setSketchEnabled(true);
      app.workspace?.showToast?.('Enabled Sketch extension', 'success');
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl pb-8 font-sans">
      {/* Overview Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-semibold text-[var(--noether-text-primary,#ffffff)] mb-0.5">
            Sketch2Text
          </h3>
          <p className="text-[11px] text-[var(--noether-text-muted,#777777)]">
            Real-time handwriting recognition and gesture transcription for the Sketch canvas.
          </p>
        </div>
        {isAnyModified && (
          <Button
            size="sm"
            onClick={handleRestoreDefaults}
            icon={<RotateCcwIcon size={12} />}
          >
            Restore defaults
          </Button>
        )}
      </div>

      {/* Card 1: Service Status & Integration */}
      <SettingCard
        title="Status & Canvas Integration"
        description="Core extension integration status, handwriting interception, and transcription telemetry."
      >
        <SettingItem
          name="Sketch Extension Integration"
          description={
            isSketchEnabled
              ? 'Prerequisite satisfied: Connected to Sketch vector drawing canvas.'
              : 'Prerequisite missing: Sketch extension is disabled. Pen strokes cannot be intercepted.'
          }
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#181818] border border-[#2a2a2a] text-xs">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isSketchEnabled ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs text-[#dcddde] font-medium">
                {isSketchEnabled ? 'Operational' : 'Disabled'}
              </span>
            </div>

            {!isSketchEnabled && app?.extensions && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnableSketch}
                icon={<CheckIcon size={12} />}
              >
                Enable Sketch
              </Button>
            )}
          </div>
        </SettingItem>

        <SettingItem
          name="Pen-to-Text Mode"
          description="When active, pen strokes drawn on the canvas are transcribed into text and typed into your active note."
        >
          <Toggle
            checked={isPenToTextActive}
            disabled={!isSketchEnabled}
            onChange={(checked) => {
              setPenToTextActive(checked);
              app?.workspace?.showToast?.(
                checked ? 'Pen-to-Text mode active' : 'Pen-to-Text mode paused',
                'info'
              );
            }}
          />
        </SettingItem>

        <SettingItem
          name="Telemetry & Diagnostics"
          description={
            lastRecognized
              ? 'Latest character or editing gesture recognized by the spatial classifier.'
              : 'Diagnostic monitor for the handwriting classification pipeline.'
          }
        >
          {lastRecognized ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-[5px] bg-[#181818] border border-[#2e2e2e] text-blue-400 font-medium select-all">
                {formatRecognizedChar(lastRecognized)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLastRecognized(null)}
              >
                Clear
              </Button>
            </div>
          ) : (
            <span className="text-xs text-[var(--noether-text-muted,#777777)] italic">
              Awaiting strokes
            </span>
          )}
        </SettingItem>
      </SettingCard>

      {/* Card 2: Recognition Engine & Transcription Settings */}
      <SettingCard
        title="Recognition Engine & Transcription"
        description="Configure handwriting models, character casing, and stroke grouping tolerances."
      >
        <SettingItem
          name="Recognition Engine"
          description="Online mode recognizes continuous cursive words and sentences. Offline mode runs local character matching."
          isModified={isEngineModified}
          onReset={() => setEngineMode(DEFAULT_SKETCH2TEXT_SETTINGS.engineMode)}
          resetTitle="Restore default engine (Online)"
        >
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'online', label: 'Online (Continuous Cursive)' },
                { id: 'offline', label: 'Offline (Local Character)' },
              ] as const
            ).map((opt) => {
              const isSelected = engineMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEngineMode(opt.id)}
                  className={`px-3 py-1 text-xs rounded-[5px] border select-none ${
                    isSelected
                      ? 'bg-[var(--noether-accent,#ea580c)] border-transparent text-white font-medium shadow-xs'
                      : 'bg-[#181818] border-[#333] text-[#888] hover:text-white hover:border-[#444]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingItem>

        <SettingItem
          name="Handwriting Language"
          description="Target language model and script dictionary for online cursive transcription."
          isModified={isLanguageModified}
          onReset={() => setLanguage(DEFAULT_SKETCH2TEXT_SETTINGS.language)}
          resetTitle="Restore default language (English)"
        >
          <div className="w-56">
            <Select
              value={language}
              options={[
                { value: 'en', label: 'English (en)' },
                { value: 'es', label: 'Spanish (es)' },
                { value: 'fr', label: 'French (fr)' },
                { value: 'de', label: 'German (de)' },
                { value: 'zh', label: 'Chinese (zh)' },
                { value: 'ja', label: 'Japanese (ja)' },
              ]}
              onChange={(val) => setLanguage(val)}
            />
          </div>
        </SettingItem>

        <SettingItem
          name="Letter Casing Preference"
          description="Control how recognized handwritten characters are capitalized when typed into the note."
          isModified={isCasingModified}
          onReset={() => setCasingMode(DEFAULT_SKETCH2TEXT_SETTINGS.casingMode)}
          resetTitle="Restore default casing (Auto)"
        >
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'auto', label: 'Auto (Match Ink)' },
                { id: 'upper', label: 'UPPERCASE' },
                { id: 'lower', label: 'lowercase' },
              ] as const
            ).map((opt) => {
              const isSelected = casingMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCasingMode(opt.id)}
                  className={`px-2.5 py-1 text-xs rounded-[5px] border select-none ${
                    isSelected
                      ? 'bg-[var(--noether-accent,#ea580c)] border-transparent text-white font-medium shadow-xs'
                      : 'bg-[#181818] border-[#333] text-[#888] hover:text-white hover:border-[#444]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingItem>

        <SettingItem
          name="Multi-Stroke Debounce Window"
          description={`Wait duration for subsequent strokes of a single letter or word (e.g. crossing a 't' or dotting an 'i') before committing.`}
          isModified={isDebounceModified}
          onReset={() => setDebounceMs(DEFAULT_SKETCH2TEXT_SETTINGS.debounceMs)}
          resetTitle={`Restore default debounce (${DEFAULT_SKETCH2TEXT_SETTINGS.debounceMs}ms)`}
        >
          <div className="w-52 flex items-center gap-3">
            <Slider
              min={200}
              max={1500}
              step={25}
              value={debounceMs}
              onChange={(val) => setDebounceMs(val)}
            />
            <span className="text-xs font-mono text-[#888] w-14 text-right select-none">
              {debounceMs}ms
            </span>
          </div>
        </SettingItem>
      </SettingCard>

      {/* Card 3: Supported Gestures & Keyboard Shortcuts Reference */}
      <SettingCard
        title="Supported Gestures & Shortcuts"
        description="Direct stroke gestures and hotkeys recognized by the handwriting parser."
      >
        <div className="p-3.5 bg-[#171717] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <KeyboardIcon size={13} className="text-[#888]" />
                <span>Toggle Pen-to-Text Mode</span>
              </span>
              <span className="text-[11px] text-[#777] mt-0.5">
                Activate or pause handwriting transcription.
              </span>
            </div>
            <kbd className="px-2 py-0.5 bg-[#252525] border border-[#333] rounded text-[11px] text-[#dcddde] font-mono shrink-0 select-none">
              Ctrl+Alt+T
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <ArrowRightIcon size={13} className="text-[#888]" />
                <span>Space Gesture</span>
              </span>
              <span className="text-[11px] text-[#777] mt-0.5">
                Quick horizontal flick from left to right.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#252525] border border-[#333] rounded text-[11px] text-[#dcddde] font-mono shrink-0 select-none">
              → Flick
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <ArrowLeftIcon size={13} className="text-[#888]" />
                <span>Backspace Gesture</span>
              </span>
              <span className="text-[11px] text-[#777] mt-0.5">
                Horizontal scratch stroke from right to left.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#252525] border border-[#333] rounded text-[11px] text-[#dcddde] font-mono shrink-0 select-none">
              ← Scratch
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <CornerDownLeftIcon size={13} className="text-[#888]" />
                <span>Enter / Newline Gesture</span>
              </span>
              <span className="text-[11px] text-[#777] mt-0.5">
                Downward vertical stroke with a sharp left return.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#252525] border border-[#333] rounded text-[11px] text-[#dcddde] font-mono shrink-0 select-none">
              ↵ Return
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <PenIcon size={13} className="text-[#888]" />
                <span>Punctuation Gestures</span>
              </span>
              <span className="text-[11px] text-[#777] mt-0.5">
                Tap dot for period (.), downward curved flick for comma (,).
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#252525] border border-[#333] rounded text-[11px] text-[#dcddde] font-mono shrink-0 select-none">
              Tap / Flick
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <SparklesIcon size={13} className="text-[#888]" />
                <span>Alphanumeric Handwriting</span>
              </span>
              <span className="text-[11px] text-[#777] mt-0.5">
                Latin alphabet (A-Z, a-z) & digits (0-9) with multi-stroke clustering.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#252525] border border-[#333] rounded text-[11px] text-[#dcddde] font-mono shrink-0 select-none">
              A-Z, 0-9
            </span>
          </div>
        </div>
      </SettingCard>
    </div>
  );
};
