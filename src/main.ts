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

const colors = ["black", "red", "blue", "yellow"];
let brushColor = "black";
const colorContainer = document.createElement("div");
document.body.append(colorContainer);

colors.forEach((c) => {
  const colorButton = document.createElement("button");
  colorButton.textContent = c;
  colorButton.style.backgroundColor = c;
  colorButton.style.color = c === "black" ? "white" : "black";
  colorButton.addEventListener("click", () => {
    brushColor = c;
    selectedSticker = null;
  });
  colorContainer.append(colorButton);
});

const stickerContainer = document.createElement("div");
document.body.append(stickerContainer);

const stickerButton = document.createElement("button");
stickerButton.textContent = "Add Sticker";
document.body.append(stickerButton);

const exportButton = document.createElement("button");
exportButton.textContent = "Export";
document.body.append(exportButton);

const clear = document.createElement("button");
clear.textContent = "Clear";
document.body.append(clear);

const undo = document.createElement("button");
undo.textContent = "Undo";
document.body.append(undo);

const redo = document.createElement("button");
redo.textContent = "Redo";
document.body.append(redo);

const rotationSlider = document.createElement("input");
rotationSlider.type = "range";
rotationSlider.min = "0";
rotationSlider.max = "360";
rotationSlider.value = "0";
document.body.append(rotationSlider);

let stickerRotation = 0;
rotationSlider.addEventListener("input", () => {
  stickerRotation = parseInt(rotationSlider.value);
});

const stickers: string[] = ["👻", "🗡️", "💥"];

let selectedSticker: string | null = null;
type Point = { x: number; y: number };
let lineWidth = 3;
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
  lineWidth = 3;
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
  rotation: number;

  constructor(point: Point, sticker: string, rotation = 0) {
    this.point = point;
    this.sticker = sticker;
    this.rotation = rotation;
  }

  drag(point: Point) {
    this.point = point;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.point.x, this.point.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const isEmoji = /\p{Emoji}/u.test(this.sticker);
    ctx.font = isEmoji
      ? `32px "Segoe UI","Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
      : `32px Arial`;
    ctx.fillStyle = "black";
    ctx.fillText(this.sticker, 0, 0);
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
  rotation: number;

  constructor(point: Point, sticker: string, rotation = 0) {
    this.point = point;
    this.sticker = sticker;
    this.rotation = rotation;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.point.x, this.point.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const isEmoji = /\p{Emoji}/u.test(this.sticker);
    ctx.font = isEmoji
      ? `32px "Segoe UI","Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
      : `32px Arial`;
    ctx.fillStyle = "black";
    ctx.fillText(this.sticker, 0, 0);
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
    commands.push(new StickerCommand(start, selectedSticker, stickerRotation));
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    cursor.active = true;
    currentCommand = new LineCommand(start, lineWidth, brushColor);
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
      previewCommand = new StickerPreview(
        point,
        selectedSticker,
        stickerRotation,
      );
    } else {
      previewCommand = new ToolPreview(point, lineWidth, brushColor);
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

exportButton.addEventListener("click", () => {
  const exportWidth = 1024;
  const exportHeight = 1024;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportWidth;
  exportCanvas.height = exportHeight;
  const exportCtx = exportCanvas.getContext("2d") as CanvasRenderingContext2D;
  exportCtx.fillStyle = "white";
  exportCtx.fillRect(0, 0, exportWidth, exportHeight);

  const scaleX = exportWidth / canvas.width;
  const scaleY = exportHeight / canvas.height;

  exportCtx.save();
  exportCtx.scale(scaleX, scaleY);

  for (const cmd of commands) {
    cmd.display(exportCtx);
  }
  exportCtx.restore();

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
});

canvas.dispatchEvent(new Event("drawing-changed"));
