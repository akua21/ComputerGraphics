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

  // var vPosition = gl.getAttribLocation(program, "a_Position");
  // gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(vPosition);





  // Colors
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

  var m = mat4();   // model matrix
  var v = mat4();   // view matrix
  var p = mat4();    // projection matrix

  var fovy = 45.0; // angle between the top and bottom planes of the clipping volume
  var aspect = 1.0; // aspect ratio
  var near = 0.1; // distance from the viewer to the near clipping plane
  var far = 10.0; // distance from the viewer to the far clipping plane

  p = perspective(fovy, aspect, near, far);



  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mLoc = gl.getUniformLocation(program, "m"); // get location of model matrix in shader
  vLoc = gl.getUniformLocation(program, "v"); // get location of view matrix in shader

  ctmLoc = gl.getUniformLocation(program, "ctm");


  // Isometric view
  var eye = vec3(0.0, 0.0, 3.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 0.2, 0.0);


  v = lookAt(eye, at, up);
  //
  //
  // var t_x = -2.0;
  // var t_y = 0.0;
  // var t_z = 0.0;
  //
  // var s_x = 0.4;
  // var s_y = 0.4;
  // var s_z = 0.4;
  //
  // m = mult(m, scalem(s_x, s_y, s_z)); // scale
  // m = mult(m, translate(t_x, t_y, t_z)); // translation
  //
  //
  gl.uniformMatrix4fv(mLoc, false, flatten(m)); // copy m to uniform value in shader
  gl.uniformMatrix4fv(vLoc, false, flatten(v)); // copy v to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader




  function render()
  {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
  // window.requestAnimFrame(render, canvas);

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.enableVertexAttribArray(vPosition);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0); // change to 4

  var matrices = [
    mat4(),
    mat4(),
    mat4(),
  ];

  var tx = 0.0;
  var ty = 0.0;
  var tz = 0.0;

  var tx2 = 0.0;
  var ty2 = 2.0;
  var tz2 = 0.0;

  var tx3 = 0.0;
  var ty3 = -2.0;
  var tz3 = 0.0;

  var sx = 0.5;
  var sy = 0.5;
  var sz = 0.5;

  var sx2 = 0.4;
  var sy2 = 0.4;
  var sz2 = 0.4;

  var sx3 = 0.4;
  var sy3 = 0.4;
  var sz3 = 0.4;

  var rx = 0.0;
  var ry = 0.0;
  var rz = 0.0;

  var rx2 = -12.0;
  var ry2 = -60.0;
  var rz2 = 0.0;

  var rx3 = 0.0;
  var ry3 = -50.0;
  var rz3 = 0.0;

  var s = [vec3(sx, sy, sz), vec3(sx2, sy2, sz2), vec3(sx3, sy3, sz3)]; // scale factors
  var t = [vec3(tx, ty, tz), vec3(tx2, ty2, tz2), vec3(tx3, ty3, tz3)]; // translation vector
  var r = [vec3(rx, ry, rz), vec3(rx2, ry2, rz2), vec3(rx3, ry3, rz3)]; // rotation vector


  matrices.forEach((mat, ndx) => {
    mat = mult(mat, scalem(s[ndx]));
    mat = mult(mat, rotateX(r[ndx][0]));
    mat = mult(mat, rotateY(r[ndx][1]));
    mat = mult(mat, translate(t[ndx]));
    gl.uniformMatrix4fv(ctmLoc, false, flatten(mat));

    gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);


    // mat = mult(mat, scalem(s)); // scale
    // // mat = mult(mat, rotateX(r[0])); // rotate
    // mat = mult(mat, translate(t[0], t[1] -2.0 + ndx*2.0, t[2])); // translate
    // gl.uniformMatrix4fv(ctmLoc, false, flatten(mat));
    //
    // gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);matrices[ndx]
  });
















  // matrices.forEach((mat, ndx) => {
  //   mat = mult(mat, scalem(s)); // scale
  //   // mat = mult(mat, rotateX(r[0])); // rotate
  //   mat = mult(mat, translate(t[0], t[1] -2.0 + ndx*2.0, t[2])); // translate
  //   gl.uniformMatrix4fv(ctmLoc, false, flatten(mat));
  //
  //   gl.drawElements(gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0);
  // });

  window.requestAnimFrame(render, canvas);

  }

  render();

}
