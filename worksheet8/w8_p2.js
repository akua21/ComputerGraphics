window.onload = function init (){

  var canvas = document.getElementById("gl-canvas");
  var gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  // gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.CULL_FACE);
  // gl.cullFace(gl.FRONT);

  // Light
  var starting_light_pos = vec3(0.0, 2.0, -2.0);
  var light_pos = vec3(starting_light_pos);
  var radius = 2.0;
  var alpha = 0.0;
  var dr = 0.3 * Math.PI/180.0;
  var static = true;


  // Vertices
  var vertices = [
    // Ground
    vec3(-2, -1, -1),
    vec3(-2, -1, -5),
    vec3(2, -1, -5),
    vec3(2, -1, -1),
    // y=-1
    vec3(0.25, -0.5, -1.25),
    vec3(0.25, -0.5, -1.75),
    vec3(0.75, -0.5, -1.75),
    vec3(0.75, -0.5, -1.25),
    // x=-1
    vec3(-1.0, -1.0, -2.5),
    vec3(-1.0, 0.0, -2.5),
    vec3(-1.0, 0.0, -3.0),
    vec3(-1.0, -1.0, -3.0)
  ];

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_Position");
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

  // Red colour texture
  var red = new Uint8Array([255, 0, 0, 0]);
  var texSize = 1;

  var red_texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, red_texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, red);


  var tex_coordinates = [
    vec2(0.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0),

    vec2(0.0, 0.0),
    vec2(0.0, 0.0),
    vec2(0.0, 0.0),
    vec2(0.0, 0.0),

    vec2(0.0, 0.0),
    vec2(0.0, 0.0),
    vec2(0.0, 0.0),
    vec2(0.0, 0.0)
  ];


   // Texture buffer
   var tBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coordinates), gl.STATIC_DRAW);

   var vTexCoord = gl.getAttribLocation(program, "texCoord");
   gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(vTexCoord);


  // Matrix
  var m = mat4();   // model matrix
  var v = mat4();   // view matrix
  var p = mat4();    // projection matrix


  var mshadow = mat4(); // shadow model matrix
  var d = -(light_pos[1] - (-1));
  mshadow[3][1] = 1.0 / d;
  mshadow[3][3] = 0.0;


  var fovy = 90.0; // angle between the top and bottom planes of the clipping volume
  var aspect = 1.0; // aspect ratio
  var near = 0.1; // distance from the viewer to the near clipping plane
  var far = 9.0; // distance from the viewer to the far clipping plane

  var eye = vec3(0.0, 0.0, 0.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 0.2, 0.0);


  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mLoc = gl.getUniformLocation(program, "m"); // get location of model matrix in shader
  vLoc = gl.getUniformLocation(program, "v"); // get location of view matrix in shader


  // Events
  var circulatingLight = document.getElementById("circulatingLight");
  circulatingLight.addEventListener("click", function (ev) {
    static = !static;
  });




  function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BI);

  if (!static) {
    alpha += dr;
  }


  light_pos = vec3(starting_light_pos);

  light_pos[0] = starting_light_pos[0] + radius * Math.sin(alpha);
  light_pos[2] = starting_light_pos[2] + radius * Math.cos(alpha);

  v = lookAt(eye, at, up);
  p = perspective(fovy, aspect, near, far);

  gl.uniformMatrix4fv(mLoc, false, flatten(m)); // copy m to uniform value in shader
  gl.uniformMatrix4fv(vLoc, false, flatten(v)); // copy v to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader



  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  v = mult(v, translate(light_pos));
  v = mult(v, mshadow);
  v = mult(v, translate(vec3(-light_pos[0], -light_pos[1], -light_pos[2])));
  gl.uniformMatrix4fv(vLoc, false, flatten(v));


  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
  gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
  gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);


  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
  v = lookAt(eye, at, up);
  gl.uniformMatrix4fv(vLoc, false, flatten(v));
  gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
  gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);


  window.requestAnimFrame(render);
  }

  render();
}
