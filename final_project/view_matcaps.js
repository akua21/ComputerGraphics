var gl;
var canvas;

// Matrix
var world = mat4();
var view = mat4();
var projection = mat4();

var fovy = 45.0; // angle between the top and bottom planes of the clipping volume
var aspect = 1.0; // aspect ratio
var near = 0.1; // distance from the viewer to the near clipping plane
var far = 500.0; // distance from the viewer to the far clipping plane
var eye = vec3(0.0, 0.0, 5.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 0.2, 0.0);

var alpha = 0.0;
var radius = 5.0;
var dr = 0.8 * Math.PI/180.0;


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

  gl.clearColor(0.89, 0.8, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);


  // Events
  // MatCaps
  var matcap_folder = "./matcaps/";
  var matcaps_names = ["green_gel.png", "darker_red.jpg", "blue_sky.jpg"];
  var matcap_path = matcap_folder + matcaps_names[0];

  function updateMatcap(src) {
    image.src = src;
  }

  var matcapsMenu = document.getElementById("matcapsMenu");
  matcapsMenu.addEventListener("click", function (ev){
    matcap_path = matcap_folder + matcaps_names[matcapsMenu.selectedIndex];
    updateMatcap(matcap_path);
  });

  matcapsMenu.selectedIndex = 0;


  document.getElementById('myMatcap').onchange = function(evt) {
     var tgt = evt.target || window.event.srcElement, files = tgt.files;
     // FileReader support
     if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => showImage(fr);
        fr.readAsDataURL(files[0]);
     }
  }

  function showImage(fileReader) {
     var img = document.getElementById("myImgMatcap");
     img.src = fileReader.result;
     updateMatcap(img.src);
  }


  // Objects 3D
  var object_folder = "./objects_3d/";
  var objects_names = ["Lamp.obj", "Mjolnir.obj", "monkey.obj"];
  var object_path = object_folder + objects_names[0];

  function updateObject(src) {
    g_objDoc = null;
    g_drawingInfo = null;
    readOBJFile(src, gl, model, 1, true);
    interval = setInterval(function(){render(model)},1000);
  }

  var objectsMenu = document.getElementById("objectsMenu");
  objectsMenu.addEventListener("click", function (ev){
    object_path = object_folder + objects_names[objectsMenu.selectedIndex];
    updateObject(object_path);
  });

  objectsMenu.selectedIndex = 0;


  document.getElementById('myObj').onchange = function(evt) {
     var tgt = evt.target || window.event.srcElement, files = tgt.files;
     // FileReader support
     if (FileReader && files && files.length) {
        var fr = new FileReader();
        // fr.onload = () => showImage(fr);
        fr.onload = () => updateObject(fr.result);
        fr.readAsDataURL(files[0]);
     }
  }





  worldLoc = gl.getUniformLocation(program, "world");
  gl.uniformMatrix4fv(worldLoc, false, flatten(world));

  program.position = gl.getAttribLocation(program, 'position');
  program.normal = gl.getAttribLocation(program, 'normal');

  v = lookAt(eye, at, up);
  p = perspective(fovy, aspect, near, far);

  projLoc = gl.getUniformLocation(program, "projection");
  gl.uniformMatrix4fv(projLoc, false, flatten(p));

  viewLoc = gl.getUniformLocation(program, "view");
  gl.uniformMatrix4fv(viewLoc, false, flatten(v));

  gl.uniform1i(gl.getUniformLocation(program, "matcapTexture"), 0);


  // Texture
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var image = document.createElement('img');
  image.crossorigin = 'anonymous';
  image.onload = function () {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    gl.generateMipmap(gl.TEXTURE_2D);
  };
  updateMatcap(matcap_path);


  // OBJ
  var g_objDoc = null;      // The information of OBJ file
  var g_drawingInfo = null; // The information for drawing 3D model

  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  var model = initVertexBuffers(gl, program);

  // Start reading the OBJ file
  updateObject(object_path);  // inside this function readOBJFile is called

  var interval;


  // Functions OBJ
  // Create a buffer object and perform the initial configuration
  function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.normal, 3, gl.FLOAT);
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
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    return drawingInfo;
  }


  // Render
  function render(model) {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
     // OBJ and all MTLs are available
     g_drawingInfo = onReadComplete(gl, model, g_objDoc);

    }
    if (!g_drawingInfo) return;

    clearInterval(interval);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    alpha += dr;
    eye = vec3(radius*Math.sin(alpha), 0, radius*Math.cos(alpha));

    v = lookAt(eye, at, up);
    p = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(projLoc, false, flatten(p));
    gl.uniformMatrix4fv(viewLoc, false, flatten(v));

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimFrame(render);
  }
}
