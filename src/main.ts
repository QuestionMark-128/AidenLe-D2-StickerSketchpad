import "./style.css";

const title = document.createElement("h1");
title.textContent = "You ain't Van Gogh";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
document.body.append(canvas);
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const buttonContainer = document.createElement("div");
document.body.append(buttonContainer);

const thinBrush = document.createElement("button");
thinBrush.textContent = "Thin Brush";
buttonContainer.append(thinBrush);

const thickBrush = document.createElement("button");
thickBrush.textContent = "Thick Brush";
buttonContainer.append(thickBrush);

const stickerContainer = document.createElement("div");
document.body.append(stickerContainer);

const stickerButton = document.createElement("button");
stickerButton.textContent = "Add Sticker";
document.body.append(stickerButton);

const clear = document.createElement("button");
clear.textContent = "Clear";
document.body.append(clear);

const undo = document.createElement("button");
undo.textContent = "Undo";
document.body.append(undo);

const redo = document.createElement("button");
redo.textContent = "Redo";
document.body.append(redo);

const stickers: string[] = ["👻", "🗡️", "💥"];

let selectedSticker: string | null = null;
type Point = { x: number; y: number };
let lineWidth = 2;
const cursor = { active: false };

function stickerButtons() {
  stickerContainer.innerHTML = "";
  for (const s of stickers) {
    const b = document.createElement("button");
    b.textContent = s;
    b.addEventListener("click", () => {
      selectedSticker = s;
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stickerContainer.append(b);
  }
}
stickerButtons();

stickerButton.addEventListener("click", () => {
  const text = prompt("Add a sticker", "");
  if (text && text.trim().length > 0) {
    stickers.push(text);
    stickerButtons();
  }
});

thinBrush.addEventListener("click", () => {
  lineWidth = 2;
  thinBrush.classList.add("selectedBrush");
  thickBrush.classList.remove("selectedBrush");
  selectedSticker = null;
});

thickBrush.addEventListener("click", () => {
  lineWidth = 6;
  thinBrush.classList.remove("selectedBrush");
  thickBrush.classList.add("selectedBrush");
  selectedSticker = null;
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

class StickerCommand implements Command {
  point: Point;
  sticker: string;

  constructor(point: Point, sticker: string) {
    this.point = point;
    this.sticker = sticker;
  }

  drag(point: Point) {
    this.point = point;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "32px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.point.x, this.point.y);
    ctx.restore();
  }
}

class ToolPreview implements Command {
  point: Point;
  width: number;
  color: string;

  constructor(point: Point, width = 2, color = "dark gray") {
    this.point = point;
    this.width = width;
    this.color = color;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.point.x, this.point.y, this.width / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class StickerPreview implements Command {
  point: Point;
  sticker: string;

  constructor(point: Point, sticker: string) {
    this.point = point;
    this.sticker = sticker;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "32px sans-serif";
    ctx.fillText(this.sticker, this.point.x, this.point.y);
    ctx.restore();
  }
}

const commands: Command[] = [];
const redoCommands: Command[] = [];
let currentCommand: LineCommand | null = null;
let previewCommand: Command | null = null;

function updatePreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) {
    cmd.display(ctx);
  }
  if (previewCommand && !cursor.active) {
    previewCommand.display(ctx);
  }
}

canvas.addEventListener("drawing-changed", updatePreview);
canvas.addEventListener("tool-moved", updatePreview);

canvas.addEventListener("mousedown", (e) => {
  const start = { x: e.offsetX, y: e.offsetY };

  if (selectedSticker) {
    commands.push(new StickerCommand(start, selectedSticker));
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    cursor.active = true;
    currentCommand = new LineCommand(start, lineWidth);
    commands.push(currentCommand);
    redoCommands.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (e) => {
  const point = { x: e.offsetX, y: e.offsetY };

  if (cursor.active && currentCommand) {
    currentCommand.drag(point);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    if (selectedSticker) {
      previewCommand = new StickerPreview(point, selectedSticker);
    } else {
      previewCommand = new ToolPreview(point, lineWidth);
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentCommand = null;
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
  previewCommand = null;
  canvas.dispatchEvent(new Event("tool-moved"));
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

canvas.dispatchEvent(new Event("drawing-changed"));
