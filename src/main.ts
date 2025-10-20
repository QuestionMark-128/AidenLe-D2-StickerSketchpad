import "./style.css";

const title = document.createElement("h1");
title.textContent = "You ain't Van Gogh";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const buttonContainer = document.createElement("div");

const thinBrush = document.createElement("button");
thinBrush.textContent = "Thin Brush";
buttonContainer.append(thinBrush);

const thickBrush = document.createElement("button");
thickBrush.textContent = "Thick Brush";
buttonContainer.append(thickBrush);

const clear = document.createElement("button");
clear.textContent = "Clear";
document.body.append(clear);

const undo = document.createElement("button");
undo.textContent = "Undo";
document.body.append(undo);

const redo = document.createElement("button");
redo.textContent = "Redo";
document.body.append(redo);

document.body.append(buttonContainer);

const cursor = { active: false, x: 0, y: 0 };
type Point = { x: number; y: number };
let lineWidth = 2;

thinBrush.addEventListener("click", () => {
  lineWidth = 2;
  thinBrush.classList.add("selectedBrush");
  thickBrush.classList.remove("selectedBrush");
});

thickBrush.addEventListener("click", () => {
  lineWidth = 6;
  thinBrush.classList.remove("selectedBrush");
  thickBrush.classList.add("selectedBrush");
});

type Command = {
  display(ctx: CanvasRenderingContext2D): void;
};

class LineCommand implements Command {
  points: Point[] = [];
  color: string;
  width: number;

  constructor(start: Point, width = 2, color = "black") {
    this.points.push(start);
    this.width = width;
    this.color = color;
  }

  drag(point: Point) {
    this.points.push(point);
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (const p of this.points) {
      ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
    ctx.restore();
  }
}

const commands: Command[] = [];
const redoCommands: Command[] = [];
let currentCommand: LineCommand | null = null;

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cmd of commands) {
    cmd.display(ctx);
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  const start = { x: e.offsetX, y: e.offsetY };
  currentCommand = new LineCommand(start, lineWidth);
  commands.push(currentCommand);
  redoCommands.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentCommand) return;
  const point = { x: e.offsetX, y: e.offsetY };
  currentCommand.drag(point);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentCommand = null;
});

clear.addEventListener("click", () => {
  commands.length = 0;
  redoCommands.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undo.addEventListener("click", () => {
  if (commands.length > 0) {
    redoCommands.push(commands.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redo.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    commands.push(redoCommands.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
