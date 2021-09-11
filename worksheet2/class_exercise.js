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

  var translation_vec = [0.0, 0.01];
  // var step_dir = 0.01;
  var translation_vec_Loc = gl.getUniformLocation(program, "translation_vec");
  gl.uniform1f(translation_vec_Loc, translation_vec);


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



  var w = 0.01;
  var w_Loc = gl.getUniformLocation(program, "w");
  gl.uniform1f(w_Loc, w);

  function render()
  {
    setTimeout(function() {
      requestAnimationFrame(render);
      gl.clear(gl.COLOR_BUFFER_BIT);


      w += sgn(1 - 0.4 - translation_vec_Loc.length())*w

      // // up
      // if (step >= 0.6) {
      //   step_dir = -0.01;
      // }
      // // down
      // if (step <= -0.6) {
      //   step_dir = 0.01;
      // }
      //
      // step += step_dir;


      gl.uniform1f(translation_vec_Loc, translation_vec);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);

    }, 20);
  }

  render();
}
