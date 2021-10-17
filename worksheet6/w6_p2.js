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
    vec3(-4, -1, -1),
    vec3(4, -1, -1),
    vec3(4, -1, -21),
    vec3(-4, -1, -21)
  ];


  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);



  // Texture
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);


  // checkerboard
  var texSize = 64;
  var numRows = 8;
  var numCols = 8;

  var myTexels = new Uint8Array(4*texSize*texSize); // 4 for RGBA image, texSize is the resolution

  for(var i = 0; i < texSize; ++i) {
    for(var j = 0; j < texSize; ++j) {
      var patchx = Math.floor(i/(texSize/numRows));
      var patchy = Math.floor(j/(texSize/numCols));

      var c = (patchx%2 !== patchy%2 ? 255 : 0);

      var idx = 4*(i*texSize + j);

      myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
      myTexels[idx + 3] = 255;
    }
  }

   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);



   var tex_coordinates = [
     vec2(-1.5, 0.0),
     vec2(2.5, 0.0),
     vec2(2.5, 10.0),
     vec2(-1.5, 10.0)
   ];


   var tBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coordinates), gl.STATIC_DRAW);

   var vTexCoord = gl.getAttribLocation(program, "texCoord");
   gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray(vTexCoord);


  // Matrix

  var mv = mat4();   // modelview matrix
  var p = mat4();    // projection matrix

  var fovy = 90.0; // angle between the top and bottom planes of the clipping volume
  var aspect = 1.0; // aspect ratio
  var near = 0.1; // distance from the viewer to the near clipping plane
  var far = 9.0; // distance from the viewer to the far clipping plane

  p = perspective(fovy, aspect, near, far);

  projLoc = gl.getUniformLocation(program, "p"); // get location of projection matrix in shader
  mvLoc = gl.getUniformLocation(program, "mv"); // // get location of modelview matrix in shader


  // Isometric view
  var eye = vec3(0.0, 0.0, 0.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 0.2, 0.0);

  mv = lookAt(eye, at, up);


  gl.uniformMatrix4fv(mvLoc, false, flatten(mv)); // copy mv to uniform value in shader
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); // copy p to uniform value in shader

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);




  // Wrapping
  function wrapping(repeat=true) {
    // repeat
    if (repeat) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      window.requestAnimFrame(render);
    }
    // clamp-to-edge
    else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      window.requestAnimFrame(render);
    }
  }

  // Filtering
  function filtering_mag(index) {
    if (index == 0) {
      // nearest
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    else if (index == 1) {
      // linear
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
  }

  function filtering_min(index) {
    if (index == 0) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // nearest
    }
    else if (index == 1) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // linear
    }
    else if (index == 2) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST); // nearest-mipmap-nearest
    }
    else if (index == 3) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); // linear-mipmap-nearest
    }
    else if (index == 4) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); // nearest-mipmap-linear
    }
    else if (index == 5) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // linear-mipmap-linear
    }
  }








  // Events

  var repeatButton = document.getElementById("repeatButton");
  repeatButton.addEventListener("click", function (ev) {
    wrapping();
  });

  var clampButton = document.getElementById("clampButton");
  clampButton.addEventListener("click", function (ev) {
    wrapping(false);
  });

  var magnificationMenu = document.getElementById("magnificationMenu");
  magnificationMenu.addEventListener("click", function (ev) {
    filtering_mag(magnificationMenu.selectedIndex);
  });

  var minificationMenu = document.getElementById("minificationMenu");
  minificationMenu.addEventListener("click", function (ev) {
    filtering_min(minificationMenu.selectedIndex);
  });

  // Firs call
  wrapping();
  filtering_mag(magnificationMenu.selectedIndex);
  filtering_min(minificationMenu.selectedIndex);





  gl.generateMipmap(gl.TEXTURE_2D);






  function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length);

  window.requestAnimFrame(render);
  }

  render();
}
