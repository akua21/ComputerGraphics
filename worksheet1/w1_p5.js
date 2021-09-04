window.onload = function init ()
{

  var canvas = document.getElementById("gl-canvas");
  var gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var step = 0.0;
  var step_dir = 0.01;
  var stepLoc = gl.getUniformLocation(program, "step");
  gl.uniform1f(stepLoc, step);


  // VERTEX
  var vertices = [0.0, 0.0];
  var stops = 100;

  for (i=0; i < stops; i++){
    vertices.push(Math.cos(i*2*Math.PI/(stops-1))*.4);
    vertices.push(Math.sin(i*2*Math.PI/(stops-1))*.4);
  }

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);



  function render()
  {
    setTimeout(function() {
      requestAnimFrame(render);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // up
      if (step >= 0.6) {
        step_dir = -0.01;
      }
      if (step <= -0.6) {
        step_dir = 0.01;
      }

      step += step_dir;


      gl.uniform1f(stepLoc, step);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);

    }, 20);
  }

  // // down
  // if (vPosition.y + .4 >= 512) {
  //   vPosition.y = 512 - .4;
  // }
  // // up
  // else if (vPosition.y - .4 >= 1) {
  //   vPosition.y = .4;
  //   step -0.001;
  // }


  render();
}
