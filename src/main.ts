import "./style.css";

const title = document.createElement("h1");
title.textContent = "You ain't Van Gogh";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const clear = document.createElement("button");
clear.textContent = "Clear";
document.body.append(clear);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const cursor = { active: false, x: 0, y: 0 };

type Point = { x: number; y: number };
const lines: Point[][] = [];
let currentLine: Point[] | null = null;

canvas.addEventListener("drawing-changed", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);

  lines.forEach((line) => {
    if (line.length > 0) {
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (const lin of line) {
        ctx.lineTo(lin.x, lin.y);
      }
      ctx.stroke();
    }
  });
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentLine = [];

  currentLine.push({ x: cursor.x, y: cursor.y });
  lines.push(currentLine);

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentLine) return;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentLine.push({ x: cursor.x, y: cursor.y });
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

clear.addEventListener("click", () => {
  lines.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});
