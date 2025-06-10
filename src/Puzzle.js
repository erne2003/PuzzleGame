import React, { useState } from "react";
import "./Puzzle.css";

export default function Puzzle() {
  const N = 3;
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 300;

  const [tiles, setTiles] = useState([]);
  const [imgSize, setImgSize] = useState({ width: MAX_WIDTH, height: MAX_HEIGHT });
  const [solving, setSolving] = useState(false);

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => sliceImage(img);
    img.src = url;
  }

  function sliceImage(img) {
    const scale = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
    const displayW = img.width * scale;
    const displayH = img.height * scale;
    setImgSize({ width: displayW, height: displayH });

    const tileW = img.width / N;
    const tileH = img.height / N;
    const bigCanvas = document.createElement("canvas");
    bigCanvas.width = img.width;
    bigCanvas.height = img.height;
    const bigCtx = bigCanvas.getContext("2d");
    bigCtx.imageSmoothingEnabled = false;
    bigCtx.drawImage(img, 0, 0);

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
        const dataUrl = tileCanvas.toDataURL('image/png', 1.0);
        newTiles.push({ id, src: dataUrl });
      }
    }
    newTiles[newTiles.length - 1].src = null;
    setTiles(scramble(newTiles));
  }

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
    if (solving) return;
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

  function heuristic(state) {
    let dist = 0;
    for (let i = 0; i < state.length; i++) {
      const id = state[i];
      if (id === N * N - 1) continue;
      const curRow = Math.floor(i / N);
      const curCol = i % N;
      const goalRow = Math.floor(id / N);
      const goalCol = id % N;
      dist += Math.abs(curRow - goalRow) + Math.abs(curCol - goalCol);
    }
    return dist;
  }

  function getNeighbors(state) {
    const neighbors = [];
    const blankIdx = state.findIndex((id) => id === N * N - 1);
    const row = Math.floor(blankIdx / N);
    const col = blankIdx % N;
    const moves = [];
    if (row > 0) moves.push(blankIdx - N);
    if (row < N - 1) moves.push(blankIdx + N);
    if (col > 0) moves.push(blankIdx - 1);
    if (col < N - 1) moves.push(blankIdx + 1);
    for (const idx of moves) {
      const next = [...state];
      [next[blankIdx], next[idx]] = [next[idx], next[blankIdx]];
      neighbors.push(next);
    }
    return neighbors;
  }

  async function solvePuzzle() {
    if (tiles.length !== N * N) return;
    setSolving(true);
    const start = tiles.map((t) => t.id);
    const goal = Array.from({ length: N * N }, (_, i) => i);
    const startKey = start.join(",");
    const goalKey = goal.join(",");

    const openSet = [{ state: start, g: 0, f: heuristic(start) }];
    const cameFrom = Object.create(null);
    const gScore = { [startKey]: 0 };
    const visited = new Set();

    while (openSet.length) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const key = current.state.join(",");
      if (key === goalKey) break;
      if (visited.has(key)) continue;
      visited.add(key);
      for (const nb of getNeighbors(current.state)) {
        const nbKey = nb.join(",");
        const tentativeG = current.g + 1;
        if (tentativeG < (gScore[nbKey] ?? Infinity)) {
          cameFrom[nbKey] = key;
          gScore[nbKey] = tentativeG;
          openSet.push({ state: nb, g: tentativeG, f: tentativeG + heuristic(nb) });
        }
      }
    }

    // Reconstruct path
    const path = [goalKey];
    let key = goalKey;
    while (key !== startKey) {
      key = cameFrom[key];
      path.push(key);
    }
    path.reverse();

    const idToSrc = {};
    tiles.forEach((t) => { idToSrc[t.id] = t.src; });

    for (let i = 1; i < path.length; i++) {
      const stateArr = path[i].split(",").map(Number);
      const newTiles = stateArr.map((id) => ({ id, src: id === N * N - 1 ? null : idToSrc[id] }));
      setTiles(newTiles);
      await new Promise((r) => setTimeout(r, 300));
    }

    setSolving(false);
  }

  return (
    <div className="puzzle">
      <div className="puzzle-container">
        <input
          className="Input-Button"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={solving}
        />
        {tiles.length === N * N && (
          <>
            <button className="Input-Button" onClick={shuffleTiles} disabled={solving}>
              Shuffle
            </button>
            <button className="SolvePuzzle" style={{backgroundColor:"#61dafb"}} onClick={solvePuzzle} disabled={solving}>
            Solve
          </button>
          </>
        )}
      </div>

      {tiles.length === N * N && (
        <div
          className="grid-container"
          style={{ width: imgSize.width, height: imgSize.height }}
        >
          {tiles.map((tile, idx) => (
            <div
              key={idx}
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
