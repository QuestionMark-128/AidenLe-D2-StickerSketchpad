import "./style.css";

const title = document.createElement("h1");
title.textContent = "You ain't Van Gogh";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
