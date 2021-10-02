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

  gl.enable(gl.DEPTH_TEST);



  // Vertices
  var index = 0;

  var vertices = [
    vec3(-0.5, -0.5, 0.5),
    vec3(-0.5, 0.5, 0.5),
    vec3(0.5, 0.5, 0.5),
    vec3(0.5, -0.5, 0.5),
    vec3(-0.5, -0.5, -0.5),
    vec3(-0.5, 0.5, -0.5),
    vec3(0.5, 0.5, -0.5),
    vec3(0.5, -0.5, -0.5)
  ];


  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);




  // Colors
  // var numVertices = 36; // Vertices for cube using TRIANGLES
  var numVertices = 46;

  var vertexColors = [
    [0.0, 0.0, 0.0, 1.0], //black
    [1.0, 0.0, 0.0, 1.0], // red
    [1.0, 1.0, 0.0, 1.0], // yellow
    [0.0, 1.0, 0.0, 1.0], // green
    [0.0, 0.0, 1.0, 1.0], // blue
    [1.0, 0.0, 1.0, 1.0], // magenta
    [1.0, 1.0, 1.0, 1.0], // white
    [0.0, 1.0, 1.0, 1.0]  // cyan
  ];



  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "a_Color");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // Indices for cube using TRIANGLES
  // var indices = [
  //   1, 0, 3,
  //   3, 2, 1,
  //   2, 3, 7,
  //   7, 6, 2,
  //   3, 0, 4,
  //   4, 7, 3,
  //   6, 5, 1,
  //   1, 2, 6,
  //   4, 5, 6,
  //   6, 7, 4,
  //   5, 4, 0,
  //   0, 1, 5
  // ];

  var indices = [
    1, 0,
    0, 3,
    3, 2,
    2, 1,
    2, 6,
    6, 5,
    5, 1,
    1, 2,
    2, 3,
    3, 7,
    7, 6,
    6, 2,
    6, 7,
    7, 4,
    4, 5,
    5, 6,
    5, 4,
    4, 0,
    0, 1,
    1, 5,
    0, 4,
    4, 7,
    7, 3,
    3, 0
  ];

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);




  // Matrix

  var mv = mat4();   // modelview matrix
  var p = mat4();    // projection matrix

  var t_x = 0.5;
  var t_y = 0.5;
  var t_z = 0.5;

  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mvLoc = gl.getUniformLocation(program, "mv"); // // get location of modelview matrix in shader


  // Isometric view
  var eye = vec3(0.4, 0.4, 0.8);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 0.2, 0.0);

  mv = lookAt(eye, at, up);

  mv = mult(mv, translate(t_x, t_y, t_z)); // translation

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv)); // copy mv to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader




  function render()
  {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0); // For cube using TRIANGLES
  gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
  window.requestAnimFrame(render, canvas);
  }

  render();

}
