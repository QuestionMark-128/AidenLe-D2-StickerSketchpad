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

const undo = document.createElement("button");
undo.textContent = "Undo";
document.body.append(undo);

const redo = document.createElement("button");
redo.textContent = "Redo";
document.body.append(redo);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const cursor = { active: false, x: 0, y: 0 };

type Point = { x: number; y: number };
const lines: Point[][] = [];
const relines: Point[][] = [];
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

  relines.length = 0;

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

undo.addEventListener("click", () => {
  if (lines.length > 0) {
    relines.push(lines.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redo.addEventListener("click", () => {
  if (relines.length > 0) {
    lines.push(relines.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
