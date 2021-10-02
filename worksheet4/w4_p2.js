var gl;
var canvas;

// Vertex positions of the tetrahedron
var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);


var c1 = vec4(0.0, 0.0, 0.0, 1.0); //black
var c2 = vec4(1.0, 0.0, 0.0, 1.0); // red
var c3 = vec4(1.0, 1.0, 0.0, 1.0); // yellow
var c4 = vec4(0.0, 1.0, 0.0, 1.0); // green
var c5 = vec4(0.0, 0.0, 1.0, 1.0); // blue
var c6 = vec4(1.0, 0.0, 1.0, 1.0); // magenta
var c7 = vec4(1.0, 1.0, 1.0, 1.0); // white
var c8 = vec4(0.0, 1.0, 1.0, 1.0); // cyan


var numSubdivs = 5;
var index = 0;
var pointsArray = [];


function triangle(a, b, c){
  pointsArray.push(a);
  pointsArray.push(b);
  pointsArray.push(c);

  index += 3;
}


function divideTriangle(a, b, c, count){
  if (count > 0){
    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);

    divideTriangle(a, ab, ac, count-1);
    divideTriangle(ab, b, bc, count-1);
    divideTriangle(bc, c, ac, count-1);
    divideTriangle(ab, bc, ac, count-1);
  }
  else{
    triangle(a, b, c);
  }
}


function tetrahedron(a, b, c, d, n){
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}





window.onload = function init(){

  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Shaders
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  tetrahedron(va, vb, vc, vd, numSubdivs);


  // Vertices
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);


  // Colors
  // var cBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
  //
  // var vColor = gl.getAttribLocation(program, "a_Color");
  // gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(vColor);




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


  var eye = vec3(0.0, 0.0, 3.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 0.2, 0.0);

  v = lookAt(eye, at, up);

  var t_x = -2.0;
  var t_y = 0.0;
  var t_z = 0.0;

  var s_x = 0.4;
  var s_y = 0.4;
  var s_z = 0.4;

  //m = mult(m, scalem(s_x, s_y, s_z)); // scale
  //m = mult(m, translate(t_x, t_y, t_z)); // translation


  gl.uniformMatrix4fv(mLoc, false, flatten(m)); // copy m to uniform value in shader
  gl.uniformMatrix4fv(vLoc, false, flatten(v)); // copy v to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader



  // Events
  document.getElementById("incrementSubdivsButton").onclick = function(){
    numSubdivs += 1;
    index = 0;
    pointsArray = [];
    init();
  };

  document.getElementById("decrementSubdivsButton").onclick = function(){
    if(numSubdivs){
      numSubdivs -= 1;
    }
    index = 0;
    pointsArray = [];
    init();
  };


  render();
}


function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (var i = 0; i < index; i += 3) {
    gl.drawArrays(gl.TRIANGLES, i, 3);
  }

  window.requestAnimFrame(render);
}
