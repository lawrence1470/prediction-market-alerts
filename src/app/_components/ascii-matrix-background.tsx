"use client";

import { useEffect, useRef } from "react";

interface AsciiMatrixBackgroundProps {
  className?: string;
}

export function AsciiMatrixBackground({ className = "" }: AsciiMatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Character set for the matrix effect
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()+=[]{}|;:,.<>?~`";

    // The main text lines to display
    const textLines = [
      "REAL-TIME ALERTS",
      "MAXIMIZE PROFITS",
      "STAY AHEAD",
    ];

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const fontSize = 14;
    const charWidth = fontSize * 0.6;
    const charHeight = fontSize * 1.2;

    let cols = Math.floor(width / charWidth);
    let rows = Math.floor(height / charHeight);

    // Grid state
    let grid: { char: string; opacity: number; targetOpacity: number; color: string; isText: boolean }[][] = [];

    const initGrid = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      cols = Math.floor(width / charWidth);
      rows = Math.floor(height / charHeight);

      grid = [];
      for (let y = 0; y < rows; y++) {
        const row: typeof grid[0] = [];
        for (let x = 0; x < cols; x++) {
          row.push({
            char: chars[Math.floor(Math.random() * chars.length)] ?? "+",
            opacity: Math.random() * 0.3,
            targetOpacity: Math.random() * 0.3,
            color: getRandomColor(),
            isText: false,
          });
        }
        grid.push(row);
      }

      // Embed the text in the center
      embedText();
    };

    const getRandomColor = () => {
      const colors = [
        "rgba(139, 92, 246, OPACITY)", // Purple
        "rgba(99, 102, 241, OPACITY)",  // Indigo
        "rgba(59, 130, 246, OPACITY)",  // Blue
        "rgba(205, 255, 0, OPACITY)",   // Lime (brand color)
      ];
      return colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!;
    };

    const embedText = () => {
      const totalTextHeight = textLines.length;
      const startY = Math.floor((rows - totalTextHeight * 3) / 2);

      textLines.forEach((line, lineIndex) => {
        const startX = Math.floor((cols - line.length) / 2);
        const y = startY + lineIndex * 3;

        if (y >= 0 && y < rows) {
          for (let i = 0; i < line.length; i++) {
            const x = startX + i;
            const cell = grid[y]?.[x];
            if (x >= 0 && x < cols && cell) {
              cell.char = line[i] ?? " ";
              cell.isText = true;
              cell.targetOpacity = 0.9;
              cell.color = "rgba(205, 255, 0, OPACITY)"; // Lime for text
            }
          }
        }
      });
    };

    let time = 0;

    const animate = () => {
      time += 0.016;

      // Clear canvas
      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, width, height);

      ctx.font = `${fontSize}px "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace`;
      ctx.textBaseline = "top";

      // Update and draw grid
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y]?.[x];
          if (!cell) continue;

          // Animate opacity
          const opacityDiff = cell.targetOpacity - cell.opacity;
          cell.opacity += opacityDiff * 0.05;

          // Randomly change target opacity and character for non-text cells
          if (!cell.isText && Math.random() < 0.01) {
            cell.targetOpacity = Math.random() * 0.4;
            if (Math.random() < 0.3) {
              cell.char = chars[Math.floor(Math.random() * chars.length)] ?? "+";
            }
            if (Math.random() < 0.1) {
              cell.color = getRandomColor();
            }
          }

          // Pulse effect for text
          if (cell.isText) {
            const pulse = Math.sin(time * 2 + x * 0.1 + y * 0.1) * 0.1;
            cell.opacity = Math.max(0.7, Math.min(1, cell.targetOpacity + pulse));
          }

          // Draw character
          const colorWithOpacity = cell.color.replace("OPACITY", cell.opacity.toString());
          ctx.fillStyle = colorWithOpacity;
          ctx.fillText(cell.char, x * charWidth, y * charHeight);
        }
      }

      // Wave effect - highlight random columns
      const waveX = Math.floor((Math.sin(time * 0.5) + 1) * 0.5 * cols);
      for (let y = 0; y < rows; y++) {
        const cell = grid[y]?.[waveX];
        if (cell && !cell.isText) {
          cell.targetOpacity = 0.6;
        }
      }

      // Random highlight bursts
      if (Math.random() < 0.05) {
        const burstX = Math.floor(Math.random() * cols);
        const burstY = Math.floor(Math.random() * rows);
        const radius = 3;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const cell = grid[burstY + dy]?.[burstX + dx];
            if (cell && !cell.isText) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= radius) {
                cell.targetOpacity = 0.5 * (1 - dist / radius);
                cell.color = "rgba(205, 255, 0, OPACITY)"; // Lime burst
              }
            }
          }
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    initGrid();
    animate();

    const handleResize = () => {
      initGrid();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ background: "transparent" }}
    />
  );
}
