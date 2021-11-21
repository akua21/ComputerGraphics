window.onload = function init (){

  var canvas = document.getElementById("gl-canvas");
  var gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  var teapot_program = initShaders(gl, "teapot-vertex-shader", "teapot-fragment-shader");
  var ground_program = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");

  gl.teapot_program = teapot_program;
  gl.ground_program = ground_program;
  // gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);


  // Light
  var starting_light_pos = vec4(0.0, 2.0, -2.0, 1.0); // !!!! other?
  var light_pos = vec4(starting_light_pos);
  var radius = 2.0;
  var alpha = 0.0;
  var dr = 0.3 * Math.PI/180.0;
  var static = true;

  var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
  var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
  var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
  var materialShininess = 100.0;

  var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);

  var ambientProduct = mult(lightEmission, materialAmbient);
  var diffuseProduct = mult(lightEmission, materialDiffuse);
  var specularProduct = mult(lightEmission, materialSpecular);


  // Vertices
  var vertices = [
    // Ground
    vec3(-2, -1, -1),
    vec3(-2, -1, -5),
    vec3(2, -1, -5),
    vec3(2, -1, -1)
  ];

  var vBuffer = gl.createBuffer();
  vBuffer.num = 3;
  vBuffer.type = gl.FLOAT;
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(ground_program, "a_Position");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);


  // Textures
  // Ground texture
  var image = document.createElement("img");
  image.crossorigin = "anonymous";
  image.onload = function(event) {
      var texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    image.src = "../assets/textures/xamp23.png";

  var tex_coordinates = [
    vec2(0.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0)
  ];

   // Texture buffer
   var tBuffer = gl.createBuffer();
   tBuffer.num = 2;
   tBuffer.type = gl.FLOAT;
   gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coordinates), gl.STATIC_DRAW);

   var vTexCoord = gl.getAttribLocation(ground_program, "texCoord");
   gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(vTexCoord);


  // Matrix
  var mG = mat4();   // model matrix
  var vG = mat4();   // view matrix
  var pG = mat4();    // projection matrix

  var mT = mat4();   // model matrix
  var vT = mat4();   // view matrix
  var pT = mat4();    // projection matrix


  var mshadow = mat4(); // shadow model matrix
  var d = -(light_pos[1] - (-1));
  mshadow[3][1] = 1.0 / d;
  mshadow[3][3] = 0.0;


  var mtranslate = mat4();
  var tx = 0.0;
  var ty = -1.0;
  var tz = -3.0;
  mtranslate = mult(mtranslate, translate(vec3(tx, ty, tz)));


  var fovy = 45.0; // angle between the top and bottom planes of the clipping volume
  var aspect = 1.0; // aspect ratio
  var near = 0.1; // distance from the viewer to the near clipping plane
  var far = 500.0; // distance from the viewer to the far clipping plane

  var offset = 0.0001;

  var eye = vec3(0.0, 0.0, 1.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 0.2, 0.0);


  pGLoc = gl.getUniformLocation(ground_program, "p");
  mGLoc = gl.getUniformLocation(ground_program, "m");
  vGLoc = gl.getUniformLocation(ground_program, "v");

  pTLoc = gl.getUniformLocation(teapot_program, "p");
  mTLoc = gl.getUniformLocation(teapot_program, "m");
  vTLoc = gl.getUniformLocation(teapot_program, "v");

  lightPosLoc = gl.getUniformLocation(teapot_program, "lightPosition");

  shadowLoc = gl.getUniformLocation(teapot_program, "shadow");

  ctmLoc = gl.getUniformLocation(teapot_program, "ctm");


  gl.useProgram(teapot_program);

  gl.uniform4fv(gl.getUniformLocation(teapot_program, "ambientProduct"),flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(teapot_program, "diffuseProduct"),flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(teapot_program, "specularProduct"),flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(teapot_program, "lightPosition"),flatten(light_pos));
  gl.uniform1f(gl.getUniformLocation(teapot_program, "shininess"), materialShininess);




  // Events
  var circulatingLight = document.getElementById("circulatingLight");
  circulatingLight.addEventListener("click", function (ev) {
    static = !static;
  });



  // OBJ
  var g_objDoc = null;      // The information of OBJ file
  var g_drawingInfo = null; // The information for drawing 3D model

  gl.teapot_program.a_Position = gl.getAttribLocation(teapot_program, 'a_Position');
  gl.teapot_program.a_Normal = gl.getAttribLocation(teapot_program, 'a_Normal');
  // gl.teapot_program.a_Color = gl.getAttribLocation(teapot_program, 'a_Color');

  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  var model = initVertexBuffers(gl, gl.teapot_program);

  // Start reading the OBJ file
  readOBJFile('../assets/teapot.obj', gl, model, 0.25, true); // !!!!! probar 1.0 en vez de 60
  // draw(gl, gl.program, currentAngle, viewProjMatrix, model);
  // render(gl, model);
  var interval = setInterval(function(){render(gl, model)},1000);




  // Functions
  // Create a buffer object and perform the initial configuration
  function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.vertexBuffer.num = 3;
    o.vertexBuffer.type = gl.FLOAT;

    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.normalBuffer.num = 3;
    o.normalBuffer.type = gl.FLOAT;
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
    // gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    return drawingInfo;
  }


  function initAttributeVariable(gl, attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
  }



  // gl.useProgram(teapot_program);
  function render(){
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
     // OBJ and all MTLs are available
     g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if (!g_drawingInfo) return;


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BI);

    if (!static) {
      alpha += dr;
    }

    light_pos = vec4(starting_light_pos);

    light_pos[0] = starting_light_pos[0] + radius * Math.sin(alpha);
    light_pos[2] = starting_light_pos[2] + radius * Math.cos(alpha);

    // Ground
    gl.useProgram(ground_program);

    vG = lookAt(eye, at, up);
    pG = perspective(fovy, aspect, near, far);

    initAttributeVariable(gl, vPosition, vBuffer);
    initAttributeVariable(gl, vTexCoord, tBuffer);

    gl.uniformMatrix4fv(mGLoc, false, flatten(mG)); // copy m to uniform value in shader
    gl.uniformMatrix4fv(vGLoc, false, flatten(vG)); // copy v to uniform value in shader
    gl.uniformMatrix4fv(pGLoc, false, flatten(pG)); // copy p to uniform value in shader

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);


    // Teapot
    gl.useProgram(teapot_program);

    vT = lookAt(eye, at, up);
    pT = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(ctmLoc, false, flatten(mtranslate));


    initAttributeVariable(gl, gl.teapot_program.a_Position, model.vertexBuffer);
    initAttributeVariable(gl, gl.teapot_program.a_Normal, model.normalBuffer);


    // Shadow
    gl.depthFunc(gl.GREATER);
    gl.uniform1i(gl.getUniformLocation(teapot_program, "shadow"), 1);


    vT = mult(vT, translate(vec3(light_pos[0], light_pos[1] - offset, light_pos[2])));
    vT = mult(vT, mshadow);
    vT = mult(vT, translate(vec3(-light_pos[0], -light_pos[1] - offset, -light_pos[2])));

    gl.uniformMatrix4fv(vTLoc, false, flatten(vT));
    gl.uniformMatrix4fv(mTLoc, false, flatten(mT));
    gl.uniformMatrix4fv(pTLoc, false, flatten(pT));

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length,                   gl.UNSIGNED_SHORT, 0);



    gl.depthFunc(gl.LESS);
    // reset view ¿?
    vT = lookAt(eye, at, up);
    pT = perspective(fovy, aspect, near, far);

    gl.uniform1i(gl.getUniformLocation(teapot_program, "shadow"), 0);
    gl.uniformMatrix4fv(vTLoc, false, flatten(vT));
    gl.uniformMatrix4fv(mTLoc, false, flatten(mT));
    gl.uniformMatrix4fv(pTLoc, false, flatten(pT));
    gl.uniform4fv(lightPosLoc, light_pos);


    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length,                   gl.UNSIGNED_SHORT, 0);


    // window.requestAnimFrame(render);
  }

  render();
}
