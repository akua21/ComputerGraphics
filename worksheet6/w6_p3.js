var gl;
var canvas;

// Vertex positions of the tetrahedron
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

// Light
var lightDirection = vec3(0.0, 0.0, -1.0);
var lightEmission = vec3(1.0, 1.0, 1.0);

var materialAmbient = vec4(0.2, 0.2, 0.2, 0.2);
// var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);


// Matrix

var m = mat4();   // model matrix
var v = mat4();   // view matrix
var p = mat4();    // projection matrix


var fovy = 45.0; // angle between the top and bottom planes of the clipping volume
var aspect = 1.0; // aspect ratio
var near = 0.1; // distance from the viewer to the near clipping plane
var far = 10.0; // distance from the viewer to the far clipping plane


var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 0.2, 0.0);

var alpha = 0.0;
var radius = 4.0;
var dr = 0.3 * Math.PI/180.0;

var numSubdivs = 5;
var index = 0;
var pointsArray = [];
var normalsArray = [];


function triangle(a, b, c){
  pointsArray.push(a);
  pointsArray.push(b);
  pointsArray.push(c);

  normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
  normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
  normalsArray.push(vec4(c[0], c[1], c[2], 0.0));

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

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);



  var ambientProduct = mult(vec4(lightEmission, 1.0), materialAmbient);
  // var diffuseProduct = mult(lightEmission, materialDiffuse);

  tetrahedron(va, vb, vc, vd, numSubdivs);


  // Normals
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "v_Normal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);



  // Vertices
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);


  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mLoc = gl.getUniformLocation(program, "m"); // get location of model matrix in shader
  vLoc = gl.getUniformLocation(program, "v"); // get location of view matrix in shader


  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
  // gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));
  gl.uniform3fv(gl.getUniformLocation(program, "lightDirection"), normalize(lightDirection)); // dir
  gl.uniform3fv(gl.getUniformLocation(program, "lightEmission"), lightEmission); // emission

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);



  // Texture
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);


  var image = document.createElement('img');
  image.crossorigin = 'anonymous';
  image.onload = function () {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = '../assets/earth.jpg';


  render();
}


function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  alpha += dr;

  eye = vec3(radius*Math.sin(alpha), 0, radius*Math.cos(alpha));

  v = lookAt(eye, at, up);
  p = perspective(fovy, aspect, near, far);


  gl.uniformMatrix4fv(mLoc, false, flatten(m)); // copy m to uniform value in shader
  gl.uniformMatrix4fv(vLoc, false, flatten(v)); // copy v to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader


  for (var i = 0; i < index; i += 3) {
    gl.drawArrays(gl.TRIANGLES, i, 3);
  }

  window.requestAnimFrame(render);
}
