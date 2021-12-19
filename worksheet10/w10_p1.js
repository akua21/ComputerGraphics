var gl;
var canvas;

// Rotate
var currentAngle = [0.0, 0.0];


// Light
var lightPosition = vec4(4.0, 1.0, 5.0, 0.0);
var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 100.0;


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

  // Rotate event handler
  initEventHandlers(canvas, currentAngle);

  function initEventHandlers(canvas, currentAngle) {
    var dragging = false; // Dragging or not
    var lastX = -1, lastY = -1; // Last position of the mouse

    canvas.onmousedown = function(ev) { // Mouse is pressed
      var x = ev.clientX, y = ev.clientY;
      // Start dragging if a mouse is in  <canvas>
      var rect = ev.target.getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        lastX = x;
        lastY = y;
        dragging = true;
      }
    };
    // Mouse is released
    canvas.onmouseup = function(ev) { dragging = false; };

    canvas.onmousemove  = function(ev) { // Mouse is moved
      var x = ev.clientX, y = ev.clientY;
      if (dragging) {
        var factor = 100/canvas.height; // The rotation ratio
        var dx = factor * (x - lastX);
        var dy = factor * (y - lastY);
        // Limit x-axis rotation angle to -90 to 90 degrees
        currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
        currentAngle[1] = currentAngle[1] + dx;
    }
      lastX = x, lastY = y;
    };
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  // program.a_Color = gl.getAttribLocation(program, 'a_Color');


  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mLoc = gl.getUniformLocation(program, "m"); // get location of model matrix in shader
  vLoc = gl.getUniformLocation(program, "v"); // get location of view matrix in shader


  ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
  diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
  specularProductLoc = gl.getUniformLocation(program, "specularProduct");
  lightPosLoc = gl.getUniformLocation(program, "lightPosition");
  shininessLoc = gl.getUniformLocation(program, "shininess");


  var ambientProduct = mult(lightEmission, scale(0.5, materialAmbient));
  var diffuseProduct = mult(lightEmission, scale(0.5, materialDiffuse));
  var specularProduct = mult(lightEmission, scale(0.5, materialSpecular));

  gl.uniform4fv(ambientProductLoc,flatten(ambientProduct));
  gl.uniform4fv(diffuseProductLoc,flatten(diffuseProduct));
  gl.uniform4fv(specularProductLoc,flatten(specularProduct));
  gl.uniform4fv(lightPosLoc,flatten(lightPosition));
  gl.uniform1f(shininessLoc, materialShininess);

  // OBJ
  var g_objDoc = null;      // The information of OBJ file
  var g_drawingInfo = null; // The information for drawing 3D model

  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  var model = initVertexBuffers(gl, program);

  // Start reading the OBJ file
  readOBJFile('../assets/monkey.obj', gl, model, 60, true);

  var interval = setInterval(function(){render(gl, model)},1000);


  // Functions
  // Create a buffer object and perform the initial configuration
  function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    // o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
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
    // gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    return drawingInfo;
  }



  function render() {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
     // OBJ and all MTLs are available
     g_drawingInfo = onReadComplete(gl, model, g_objDoc);

    }
    if (!g_drawingInfo) return;

    clearInterval(interval);


    v = lookAt(eye, at, up);
    p = perspective(fovy, aspect, near, far);

    v = mult(v, rotate(currentAngle[0], vec3(1.0, 0.0, 0.0)));  // x-axis
    v = mult(v, rotate(currentAngle[1], vec3(0.0, 1.0, 0.0))); // y-axis

    gl.uniformMatrix4fv(mLoc, false, flatten(m)); // copy m to uniform value in shader
    gl.uniformMatrix4fv(vLoc, false, flatten(v)); // copy v to uniform value in shader
    gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader

    ambientProduct = mult(lightEmission, scale(0.5, materialAmbient));
    diffuseProduct = mult(lightEmission, scale(0.5, materialDiffuse));
    specularProduct = mult(lightEmission, scale(0.5, materialSpecular));

    gl.uniform4fv(ambientProductLoc,flatten(ambientProduct));
    gl.uniform4fv(diffuseProductLoc,flatten(diffuseProduct));
    gl.uniform4fv(specularProductLoc,flatten(specularProduct));
    gl.uniform1f(shininessLoc, materialShininess);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimFrame(render);
  }
}
