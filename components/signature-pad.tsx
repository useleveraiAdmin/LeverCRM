"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export type SignaturePadHandle = {
  getDataUrl: () => string | null;
  clear: () => void;
};

// Freehand canvas signature capture. Deliberately hand-rolled (no signature_pad
// dependency) — same drawing approach already used in DocumentsSection, lifted
// into a reusable component for the waiver signing flow.
export const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(
  function SignaturePad({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasDrawn = useRef(false);

    function pos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
      const rect = canvas.getBoundingClientRect();
      const point = "touches" in e ? e.touches[0] : e;
      return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    }

    function startDraw(e: React.MouseEvent | React.TouchEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawing.current = true;
      const ctx = canvas.getContext("2d")!;
      const { x, y } = pos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    function draw(e: React.MouseEvent | React.TouchEvent) {
      const canvas = canvasRef.current;
      if (!canvas || !drawing.current) return;
      const ctx = canvas.getContext("2d")!;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineCap = "round";
      const { x, y } = pos(e, canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
      hasDrawn.current = true;
    }
    function endDraw() {
      drawing.current = false;
    }
    function clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn.current = false;
    }

    useImperativeHandle(ref, () => ({
      getDataUrl: () => (hasDrawn.current && canvasRef.current ? canvasRef.current.toDataURL("image/png") : null),
      clear,
    }));

    return (
      <div>
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className={className ?? "w-full touch-none rounded border bg-white"}
          style={{ borderColor: "var(--border)" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <button type="button" className="btn btn-outline mt-2 text-xs" onClick={clear}>
          Clear signature
        </button>
      </div>
    );
  }
);
