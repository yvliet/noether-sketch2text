import React from 'react';
import { useSketch2TextStore } from '../store/sketch2TextStore';

export interface Sketch2TextButtonProps {
  app?: any;
}

export const Sketch2TextButton: React.FC<Sketch2TextButtonProps> = React.memo(({ app }) => {
  const isPenToTextActive = useSketch2TextStore((s) => s.isPenToTextActive);
  const isSketchEnabled = useSketch2TextStore((s) => s.isSketchEnabled);
  const togglePenToText = useSketch2TextStore((s) => s.togglePenToText);

  if (!isSketchEnabled) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePenToText();
    const nextState = !isPenToTextActive;
    if (app?.workspace?.showToast) {
      app.workspace.showToast(
        nextState
          ? 'Pen-to-Text: ON (handwriting will convert to text)'
          : 'Pen-to-Text: OFF (normal drawing mode)',
        'info'
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        isPenToTextActive
          ? 'Pen-to-Text: ON (click to switch back to normal drawing)'
          : 'Pen-to-Text: OFF (click to convert handwriting into typed text)'
      }
      style={{
        backgroundColor: isPenToTextActive ? '#2563eb' : '#141414',
        color: isPenToTextActive ? '#ffffff' : '#888888',
      }}
      className={`p-1.5 rounded flex items-center gap-1.5 select-none border border-[#2e2e2e] ${
        isPenToTextActive
          ? 'font-medium'
          : 'hover:text-[#dcddde] hover:bg-[#202020]'
      }`}
    >
      {/* Icon: Stylus */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
      <span className="text-[11px] font-semibold leading-none tracking-tight">
        A
      </span>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isPenToTextActive ? 'bg-white' : 'bg-[#555]'
        }`}
      />
    </button>
  );
});

