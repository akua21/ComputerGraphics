var gl;
var canvas;

// Matrix
var m = mat4();   // model matrix
var v = mat4();   // view matrix
var p = mat4();    // projection matrix

var fovy = 45.0; // angle between the top and bottom planes of the clipping volume
var aspect = 1.0; // aspect ratio
var near = 0.1; // distance from the viewer to the near clipping plane
var far = 500.0; // distance from the viewer to the far clipping plane

var eye = vec3(0.0, 20.0, 300.0);
var at = vec3(0.0, 20.0, 0.0);
var up = vec3(0.0, 0.2, 0.0);


window.onload = function main() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    console.log("WebGL is not available");
  }

  if (!initShaders(gl, "vertex-shader", "fragment-shader")) {
    console.log('Failed to initialize shaders.');
    return;
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Get the storage locations of attribute and uniform variables
  // var program = gl.program;
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); // !!!! review, something wrong
  program.a_Color = gl.getAttribLocation(program, 'a_Color');


  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mLoc = gl.getUniformLocation(program, "m"); // get location of model matrix in shader
  vLoc = gl.getUniformLocation(program, "v"); // get location of view matrix in shader


  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  var model = initVertexBuffers(gl, program);

  // Start reading the OBJ file
  readOBJFile('../assets/monkey.obj', gl, model, 60, true);
  // draw(gl, gl.program, currentAngle, viewProjMatrix, model);
  // render(gl, model);
  var interval = setInterval(function(){render(gl, model)},1000);
}


// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
  var o = new Object();
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT); //3
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();

  return o;
}


 // Create a buffer object, assign it to attribute variables, and enable the assigment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
   var buffer =  gl.createBuffer();  // Create a buffer object
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
   gl.enableVertexAttribArray(a_attribute);  // Enable the assignment
   return buffer;
}


// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
    }
  }
  request.open('GET', fileName, true); // Create a request to get file
  request.send();                      // Send the request
}

var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model


// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
  var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
  var result  = objDoc.parse(fileString, scale, reverse);
  if (!result) {
    g_objDoc = null; g_drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  g_objDoc = objDoc;
}


// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
  return drawingInfo;
}




function render(gl, model) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  v = lookAt(eye, at, up);
  p = perspective(fovy, aspect, near, far);


  gl.uniformMatrix4fv(mLoc, false, flatten(m)); // copy m to uniform value in shader
  gl.uniformMatrix4fv(vLoc, false, flatten(v)); // copy v to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader


  if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
   // OBJ and all MTLs are available
   g_drawingInfo = onReadComplete(gl, model, g_objDoc);
  }
  if (!g_drawingInfo) return;
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length,                   gl.UNSIGNED_SHORT, 0);
  // window.requestAnimFrame(render);
}
