var gl;
var canvas;

// Vertex positions of the tetrahedron
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

// Light
var lightPosition = vec4(0.0, 0.0, -1.0, 0.0);
var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);

// var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
// var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);


// Matrix

var m = mat4();   // model matrix
var v = mat4();   // view matrix
var p = mat4();    // projection matrix

var mtex = mat4(); // texture matrix

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
var pointsArray = [];
var normalsArray = [];


function triangle(a, b, c){
  pointsArray.push(a);
  pointsArray.push(b);
  pointsArray.push(c);

  normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
  normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
  normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
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



// Texture
var g_tex_ready = 0;

function initTexture(gl, program){
  var cubemap = ['../assets/textures/cm_left.png', // POSITIVE_X
                 '../assets/textures/cm_right.png', // NEGATIVE_X
                 '../assets/textures/cm_top.png', // POSITIVE_Y
                 '../assets/textures/cm_bottom.png', // NEGATIVE_Y
                 '../assets/textures/cm_back.png', // POSITIVE_Z
                 '../assets/textures/cm_front.png']; // NEGATIVE_Z

  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  for (var i = 0; i < 6; ++i){
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

    image.onload = function(event) {
      var image = event.target;
      gl.activeTexture(gl.TEXTURE0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

      ++g_tex_ready;

      if (g_tex_ready >= 6) {
        render();
      }
    };
    image.src = cubemap[i];
 }
 gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
}





window.onload = function init(){

  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);


  // var ambientProduct = mult(lightEmission, materialAmbient);
  // var diffuseProduct = mult(lightEmission, materialDiffuse);

  tetrahedron(va, vb, vc, vd, numSubdivs);


  // Normals
  // var nBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  //
  // var vNormal = gl.getAttribLocation(program, "v_Normal");
  // gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(vNormal);


  // Vertices
  var vBuffer = gl.createBuffer();


  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mLoc = gl.getUniformLocation(program, "m"); // get location of model matrix in shader
  vLoc = gl.getUniformLocation(program, "v"); // get location of view matrix in shader

  mtexLoc = gl.getUniformLocation(program, "mtex"); // get location of texture matrix in shader
  eyeLoc = gl.getUniformLocation(program, "eye"); // get location of eye in shader
  reflectiveLoc = gl.getUniformLocation(program, "reflective"); // get location of reflective in shader

  // gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
  // gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));
  // gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));



  // Texture
  initTexture(gl, program);


  var quad_vertices = [
    vec4(-1, -1, 0.999, 1.0),
    vec4(1, -1, 0.999, 1.0),
    vec4(-1, 1, 0.999, 1.0),

    vec4(1, -1, 0.999, 1.0),
    vec4(1, 1, 0.999, 1.0),
    vec4(-1, 1, 0.999, 1.0)
  ];

  pointsArray = quad_vertices.concat(pointsArray);

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

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

  gl.uniform3fv(eyeLoc, flatten(eye)); // eye

  // quad
  mtex = mult(inverse4(v), inverse4(p));
  gl.uniformMatrix4fv(mtexLoc, false, flatten(mtex)); // copy mtex to uniform value in shader
  gl.uniform1i(reflectiveLoc, 0); // not reflective

  gl.drawArrays(gl.TRIANGLES, 0, 6);


  // sphere
  mtex = mat4();
  gl.uniformMatrix4fv(mtexLoc, false, flatten(mtex)); // copy mtex to uniform value in shader
  gl.uniform1i(reflectiveLoc, 1); // reflective

  gl.drawArrays(gl.TRIANGLES, 6, pointsArray.length-6);

  window.requestAnimFrame(render);
}
