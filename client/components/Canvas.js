import React from 'react';
import socket from '../socket.js';
import AnimateSprite from './AnimateSprite';

let frames = [];
let counter = 0;

class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.saveCanvas = this.saveCanvas.bind(this);
    this.getCanvas = this.getCanvas.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.fillPixel = this.fillPixel.bind(this);
    //just inserted
    this.getFrames = this.getFrames.bind(this);
    this.animate = this.animate.bind(this);
    this.renderSaved = this.renderSaved.bind(this);
    // this.fillPixelFromSocket = this.fillPixelFromSocket.bind(this)
    this.resetCanvas = this.resetCanvas.bind(this);
    this.newFrame = this.newFrame.bind(this);
    //this.changeFramesHandler = this.changeFramesHandler.bind(this)
    this.state = {
      canvasName: '',
      pixelSize: 24,
      gridSize: 16,
      framesArray: ['frame 1'],
      mappedGrid: {},
      pngArray: [],
      frameCounter: 2,
      currentFrame: 'frame 1',
    };
  }

  componentDidMount() {
    this.ctx = this.canvas.current.getContext('2d');
    this.createGrid(this.state.gridSize, this.state.pixelSize);
    socket.on('fill', (x, y, color) => {
      this.fillPixel(x, y, color);
    });
  }

  createGrid(rows, pixelSize) {
    let y = 0;
    for (let i = 0; i < rows; i++) {
      let x = 0;
      let array = [];
      for (let j = 0; j < rows; j++) {
        array.push(null);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        this.ctx.fillRect(x, y, pixelSize, pixelSize);
        x += pixelSize;
      }

      // Add each array to the mappedGrid
      this.state.mappedGrid[i] = array;
      y += pixelSize;
    }
  }

  getFrames() {
    for (let key in localStorage) {
      if (key !== 'currentColor' &&
        typeof localStorage[key] === 'string'
      ) {
        frames.push(key)
      }
    }
    this.setState({
      framesArray: [...this.state.framesArray]
    });
  }

  newFrame() {
    localStorage.setItem(
      `frame ${this.state.frameCounter}`,
      JSON.stringify(this.state.mappedGrid)
    );

    this.setState({
      framesArray: [...this.state.framesArray, `frame ${this.state.frameCounter}`],
      frameCounter: this.state.frameCounter + 1
      //`frame ${counter}`: '',
    });

  }

  //saves canvas, adds it to array of canvases
  saveCanvas(canvasName) {

    // let imageURI = this.canvas.current.toDataURL();

    // localStorage.setItem(
    //   `${canvasName} png`, this.state.pngArray
    // );

    localStorage.setItem(
      `${canvasName}`,
      JSON.stringify(this.state.mappedGrid)
    );

    this.setState({
      framesArray: [...this.state.framesArray, canvasName],
      canvasName: '',
    });
  }

  getCanvas(canvasName) {

    this.resetCanvas();
    let item = JSON.parse(localStorage.getItem(canvasName));
    this.renderSaved(item);
    this.setState({
      currentFrame: canvasName
    });

  }

  handleChange(event) {
    event.preventDefault();
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  // clear canvas, then render a saved canvas based on colors/coords
  renderSaved(savedGrid) {
    this.resetCanvas()
    for (let key in savedGrid) {
      let pixelRow = savedGrid[key];
      for (let i = 0; i < pixelRow.length; i++) {
        if (pixelRow[i] !== null) {
          // These are the actual coordinates to render on the grid
          let coordinateX = i * this.state.pixelSize;
          let coordinateY = key * this.state.pixelSize;

          // Render each original pixel from the saved grid
          this.ctx.fillStyle = pixelRow[i];
          this.ctx.fillRect(
            coordinateX,
            coordinateY,
            this.state.pixelSize,
            this.state.pixelSize
          );
        }
      }
    }
  }

  animate(arrayOfFrames) {
    console.log('animate!!!', arrayOfFrames)
    let len = arrayOfFrames.length;
    let interval = 0;
    for (let i = 0; i < len; i++) {
      setTimeout(() => {
        this.getCanvas(frames[i])
      }, interval)
      counter++
      interval += 500;
    }
  }

  resetCanvas() {
    this.ctx.clearRect(
      0,
      0,
      this.state.gridSize * this.state.pixelSize,
      this.state.gridSize * this.state.pixelSize
    );
    this.createGrid(this.state.gridSize, this.state.pixelSize);
  }

  fillPixel(defaultX, defaultY, color = this.props.color) {
    //need to add a color value to the parameters
    const canvas = this.canvas.current.getBoundingClientRect();

    // These are not the actual coordinates but correspond to the place on the grid
    let x =
      defaultX ??
        Math.floor((window.event.clientX - canvas.x) / this.state.pixelSize);
    let y =
      defaultY ??
        Math.floor((window.event.clientY - canvas.y) / this.state.pixelSize);

    if (defaultX === undefined && defaultY === undefined) {
      socket.emit('fill', x, y, color);
    }

    // MAP color to proper place on mappedGrid
    this.state.mappedGrid[y][x] = color;

    // These are the actual coordinates to properly place the pixel
    let actualCoordinatesX = x * this.state.pixelSize;
    let actualCoordinatesY = y * this.state.pixelSize;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      actualCoordinatesX,
      actualCoordinatesY,
      this.state.pixelSize,
      this.state.pixelSize
    );
  }
  /*
    async changeFramesHandler(e) {
      let frame = e.target.value;
      await this.setState({
        currentFrame: frame
      });
      this.getCanvas(this.state.currentFrame);
    }
  */

  render() {
    return (
      <div className='canvas-container'>
        <div className='container canvas-frames'>
          <div>
            <h3>CURRENT CANVAS {this.state.currentFrame}</h3>
          </div>
          <div className='canvas'>
            <canvas
              className='real-canvas'
              width={this.state.gridSize * this.state.pixelSize}
              height={this.state.gridSize * this.state.pixelSize}
              ref={this.canvas}
              onClick={() => this.fillPixel()} //made this into an anonomous function so that we can pass in values at a different location
            />
            <img
              className='checkered-background'
              src='checkeredBackground.png'
              width={this.state.gridSize * this.state.pixelSize}
              height={this.state.gridSize * this.state.pixelSize}
            />
            <canvas
              width={this.state.gridSize * this.state.pixelSize}
              height={this.state.gridSize * this.state.pixelSize}
            />
          </div>

          <div className='frames-container'>

            <ul>CHOOSE FRAME
            <div>
                {
                  Array.isArray(frames) ?
                    frames.map((frame, index) => {
                      return (
                        <li onClick={() => this.getCanvas(frame)} key={index}>
                          Frame {index + 1}: {frame}
                        </li>
                      );
                    }) : "Placeholder for frames on localStorage"
                }
              </div>
              {this.state.framesArray.map((frame, index) => {


                return (


                  <li onClick={() =>
                    this.getCanvas(frame)
                  } key={index}>

                    Frame {index + 1 + frames.length}: {frame}
                  </li>

                );
              })}
            </ul>
          </div>
        </div>
        <div className='options-container'>
          <label htmlFor='canvasName'></label>
          <input
            type='text'
            name='canvasName'
            value={this.state.canvasName}
            placeholder='Enter your name'
            onChange={this.handleChange}
          />
          <button
            onClick={() => this.saveCanvas(this.state.currentFrame)}
            className='btn'
          >
            Save Canvas
          </button>
          <button onClick={this.resetCanvas} className='btn'>
            {' '}
            Reset Canvas
          </button>
          <button onClick={this.newFrame} className='btn'>
            {' '}
            New Frame
        </button>
          <div>
            <button
              onClick={() => this.getFrames()}
              className='btn'
            >
              Load Frames
        </button>
          </div>

          <button
            onClick={() => this.animate(frames)}
            className='btn'
          >
            Animate!
        </button>


          {/* <div>
            <AnimateSprite />
          </div>
          <div>
            <ToggleAnimationEditModes />
          </div> */}
        </div>
      </div>
    );
  }
}

export default Canvas;
