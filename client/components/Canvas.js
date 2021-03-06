import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ColorPicker from './ColorPicker';
import ArtboardList from './ArtboardList';
let canvas, ctx;

const Canvas = () => {
  const [pixelSize, setPixelSize] = useState(24);
  const [factor, setFactor] = useState(3);
  const [mappedGrid, setMappedGrid] = useState({});
  const [color, setColor] = useState('');
  const [tool, setTool] = useState(true);
  const [gridName, setGridName] = useState('');
  const [user, setUser] = useState({});

  const canvasRef = useRef();

  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
    createGrid(ctx, pixelSize, mappedGrid);
  }, []);

  // --------- CREATE GRID --------- //

  function createGrid(ctx, pixelSize, mappedGrid) {
    let y = 0;
    let rows = 48;
    for (let i = 0; i < rows; i++) {
      let x = 0;
      let array = [];
      for (let j = 0; j < rows; j++) {
        array.push(null);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(x, y, pixelSize, pixelSize);
        x += pixelSize;
      }

      // Add each array to the mappedGrid
      mappedGrid[i] = array;
      y += pixelSize;
    }
  }

  // ---------  SAVE GRID --------- //
  async function saveCanvas(name) {
    let body;

    if (name) {
      body = {
        name: `${name}`,
        mappedGrid,
      };
      setGridName(name);
      resetCanvas();
      createGrid(ctx, pixelSize, mappedGrid);
    } else {
      body = {
        name: `${gridName}`,
        mappedGrid,
      };
    }

    await axios.put(`/api/user/artboards`, body);
  }

  // --------- RENDER SAVED GRID --------- //
  function renderSaved(savedGrid) {
    let pixelSize = 8;

    ctx.clearRect(0, 0, 16 * 24, 16 * 24);
    for (let key in savedGrid) {
      // key = id = index of row array
      let pixelRow = savedGrid[key];
      for (let i = 0; i < pixelRow.length; i++) {
        if (pixelRow[i] !== null) {
          // These are the actual coordinates to render on the grid
          let coordinateX = i * pixelSize;
          let coordinateY = key * pixelSize;

          // Render each original pixel from the saved grid
          ctx.fillStyle = pixelRow[i];
          ctx.fillRect(coordinateX, coordinateY, pixelSize, pixelSize);
        }
      }
    }

    setMappedGrid(savedGrid);
  }

  // --------- RESET CANVAS --------- //
  function resetCanvas() {
    ctx.clearRect(0, 0, 16 * 24, 16 * 24);
    createGrid(ctx, pixelSize, mappedGrid);
  }

  // --------- DELETE PIXEL --------- //
  function deletePixel(defaultX, defaultY) {
    const canvasRect = canvas.getBoundingClientRect();
    // These are not the actual coordinates but correspond to the place on the grid
    let x =
      defaultX ?? Math.floor((window.event.clientX - canvasRect.x) / pixelSize);
    let y =
      defaultY ?? Math.floor((window.event.clientY - canvasRect.y) / pixelSize);

    // MAP color to proper place on mappedGrid
    for (let i = 0; i < factor; i++) {
      for (let j = 0; j < factor; j++) {
        mappedGrid[y * factor + i][x * factor + j] = null;
      }
    }
    // These are the actual coordinates to properly place the pixel
    let actualCoordinatesX = x * pixelSize;
    let actualCoordinatesY = y * pixelSize;
    ctx.clearRect(actualCoordinatesX, actualCoordinatesY, pixelSize, pixelSize);
  }

  // --------- FILL PIXEL --------- //
  function fillPixel(defaultX, defaultY) {
    const canvasRect = canvas.getBoundingClientRect();

    // These are not the actual coordinates but correspond to the place on the grid
    let x =
      defaultX ?? Math.floor((window.event.clientX - canvasRect.x) / pixelSize);
    let y =
      defaultY ?? Math.floor((window.event.clientY - canvasRect.y) / pixelSize);

    // MAP color to proper place on mappedGrid
    for (let i = 0; i < factor; i++) {
      for (let j = 0; j < factor; j++) {
        mappedGrid[y * factor + i][x * factor + j] = color;
      }
    }

    // These are the actual coordinates to properly place the pixel
    let actualCoordinatesX = x * pixelSize;
    let actualCoordinatesY = y * pixelSize;

    ctx.fillStyle = color;

    ctx.fillRect(actualCoordinatesX, actualCoordinatesY, pixelSize, pixelSize);

    localStorage.setItem(`${gridName}`, JSON.stringify(mappedGrid));
  }

  // --------- HANDLE FILL/DELETE--------- //
  function handleMouseDown() {
    if (tool) {
      fillPixel();
    } else {
      deletePixel();
    }
  }

  // --------- CONTINUOUS FILL PIXEL --------- //
  function continuousFill() {
    canvas.addEventListener('mousemove', handleMouseDown, true);
    window.addEventListener('mouseup', (secondEvent) => {
      canvas.removeEventListener('mousemove', handleMouseDown, true);
    });
  }

  //--------- SET PIXEL SIZE --------- //
  function selectPixelSize(event) {
    let factor;
    let pixels = parseInt(event.target.value);
    if (pixels === 24) {
      factor = 3;
    } else if (pixels === 16) {
      factor = 2;
    } else if (pixels === 8) {
      factor = 1;
    }

    setPixelSize(pixels);
    setFactor(factor);
  }

  return (
    <div>
      <div className='main-container container'>
        {userInfo ? (
          <ArtboardList
            saveCanvas={saveCanvas}
            renderGrid={renderSaved}
            currentGrid={setGridName}
          />
        ) : (
          <div></div>
        )}

        {/* Canvas */}
        <div className='canvas-container'>
          <div className='canvas'>
            <canvas
              className='real-canvas'
              width={16 * 24}
              height={16 * 24}
              ref={canvasRef}
              onClick={() => handleMouseDown()}
              onMouseDown={() => continuousFill()}
            />
            <img
              className='checkered-background'
              src='checkeredBackground.png'
              width={16 * 24}
              height={16 * 24}
            />
            <canvas width={16 * 24} height={16 * 24} />
          </div>
        </div>

        <div className='canvas-buttons'>
          {userInfo ? (
            <div className='canvas-buttons'>
              <button onClick={resetCanvas} className='btn btn-session'>
                Reset Canvas
              </button>
              <button onClick={() => saveCanvas()} className='btn btn-session'>
                Save Canvas
              </button>
            </div>
          ) : (
            <button onClick={resetCanvas} className='btn btn-session'>
              Reset Canvas
            </button>
          )}

          {/* Color Picker */}

          <ColorPicker currentColor={setColor} />

          {/* Draw/Erase Buttons */}
          <div className='tools'>
            <button
              onClick={() => setTool(!tool)}
              className={`btn ${
                tool ? 'btn-tool btn-tool-active' : 'btn-tool'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => setTool(!tool)}
              className={`btn ${
                tool ? 'btn-tool' : 'btn-tool btn-tool-active'
              }`}
            >
              Erase
            </button>
          </div>

          {/* Pixel Buttons */}
          <div className='pixel-buttons tools'>
            <button
              onClick={selectPixelSize}
              className={`btn ${
                factor === 1 ? 'btn-pixel btn-pixel-active' : 'btn-pixel'
              }`}
              value={8}
            >
              8px
            </button>
            <button
              onClick={selectPixelSize}
              className={`btn ${
                factor === 2 ? 'btn-pixel btn-pixel-active' : 'btn-pixel'
              }`}
              value={16}
            >
              16px
            </button>
            <button
              onClick={selectPixelSize}
              className={`btn ${
                factor === 3 ? 'btn-pixel btn-pixel-active' : 'btn-pixel'
              }`}
              value={24}
            >
              24px
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
