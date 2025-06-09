import React, { useState } from "react";
import "./Puzzle.css";

function Puzzle() {
  const N = 3;
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 300;
  const [tiles, setTiles] = useState([]);
  const [imgSize, setImgSize] = useState({ width: MAX_WIDTH, height: MAX_HEIGHT });

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => sliceImage(img);
    img.src = url;
  }

  function sliceImage(img) {
    // Compute display size without upscaling
    const scale = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
    const displayW = img.width * scale;
    const displayH = img.height * scale;
    setImgSize({ width: displayW, height: displayH });

    // Full-resolution slicing
    const tileW = img.width / N;
    const tileH = img.height / N;
    const bigCanvas = document.createElement("canvas");
    bigCanvas.width = img.width;
    bigCanvas.height = img.height;
    const bigCtx = bigCanvas.getContext("2d");
    bigCtx.imageSmoothingEnabled = false;
    bigCtx.drawImage(img, 0, 0);

    // Build tile array
    const newTiles = [];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        const id = row * N + col;
        const x = col * tileW;
        const y = row * tileH;
        const tileCanvas = document.createElement("canvas");
        tileCanvas.width = tileW;
        tileCanvas.height = tileH;
        const tileCtx = tileCanvas.getContext("2d");
        tileCtx.imageSmoothingEnabled = false;
        tileCtx.drawImage(
          bigCanvas,
          x, y, tileW, tileH,
          0, 0, tileW, tileH
        );
        const dataUrl = tileCanvas.toDataURL('image/png',1.0);
        newTiles.push({ id, src: dataUrl });
      }
    }
    // Blank tile
    newTiles[newTiles.length - 1].src = null;

    // Shuffle right away
    setTiles(scramble(newTiles));
  }

  // Random legal-move shuffle
  function scramble(arr) {
    const shuffled = [...arr];
    let blankIdx = shuffled.findIndex((t) => t.src === null);
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(blankIdx / N);
      const col = blankIdx % N;
      const moves = [];
      if (row > 0) moves.push(blankIdx - N);
      if (row < N - 1) moves.push(blankIdx + N);
      if (col > 0) moves.push(blankIdx - 1);
      if (col < N - 1) moves.push(blankIdx + 1);
      const rand = moves[Math.floor(Math.random() * moves.length)];
      [shuffled[blankIdx], shuffled[rand]] = [shuffled[rand], shuffled[blankIdx]];
      blankIdx = rand;
    }
    return shuffled;
  }

  function handleTileClick(idx) {
    const blankIdx = tiles.findIndex((t) => t.src === null);
    const row = Math.floor(blankIdx / N);
    const col = blankIdx % N;
    const moves = [];
    if (row > 0) moves.push(blankIdx - N);
    if (row < N - 1) moves.push(blankIdx + N);
    if (col > 0) moves.push(blankIdx - 1);
    if (col < N - 1) moves.push(blankIdx + 1);
    if (!moves.includes(idx)) return;
    const updated = [...tiles];
    [updated[blankIdx], updated[idx]] = [updated[idx], updated[blankIdx]];
    setTiles(updated);
  }

  function shuffleTiles() {
    if (tiles.length === N * N) {
      setTiles(scramble(tiles));
    }
  }

  return (
    <div className="puzzle">
      <div className="puzzle-container">
        <input
          className="Input-Button"
          type="file"
          accept="image/*"
          onChange={handleUpload}
        />
        {tiles.length === N * N && (
          <button className="Input-Button" onClick={shuffleTiles} style={{ paddingRight: "10px" }}>
            Shuffle
          </button>
        )}
      </div>

      {tiles.length === N * N && (
        <div
          className="grid-container"
          style={{ width: imgSize.width, height: imgSize.height }}
        >
          {tiles.map((tile, idx) => (
            <div
              key={tile.id}
              className="image-container"
              onClick={() => handleTileClick(idx)}
              style={{
                backgroundImage: tile.src ? `url(${tile.src})` : "none",
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Puzzle;
