var gl;
var canvas;

// Vertex positions of the tetrahedron
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

// Light
var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
var lightPosition = vec4(0.0, 0.0, -1.0, 0.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 100.0;

var kd = 0.5;
var ks = 0.5;
var ka = 0.5;
var le = 1.0;


// Matrix
var m = mat4();   // model matrix
var v = mat4();   // view matrix
var p = mat4();   // projection matrix

var fovy = 45.0; // angle between the top and bottom planes of the clipping volume
var aspect = 1.0; // aspect ratio
var near = 0.1; // distance from the viewer to the near clipping plane
var far = 10.0; // distance from the viewer to the far clipping plane

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 0.2, 0.0);

var alpha = 0.0;
var radius = 2.62;
var dr = 0.5 * Math.PI/180.0;

var numSubdivs = 6;
var index = 0;
var pointsArray = [];
var normalsArray = [];

// Functions
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
  gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Light
  var ambientProduct = mult(lightEmission, materialAmbient);
  var diffuseProduct = mult(lightEmission, materialDiffuse);
  var specularProduct = mult(lightEmission, materialSpecular);

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

  projLoc = gl.getUniformLocation(program, "p");
  mLoc = gl.getUniformLocation(program, "m");
  vLoc = gl.getUniformLocation(program, "v");

  lightPositionLoc = gl.getUniformLocation(program, "lightPosition");


  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  gl.uniform1f(gl.getUniformLocation(program, "kd"), kd);
  gl.uniform1f(gl.getUniformLocation(program, "ks"), ks);
  gl.uniform1f(gl.getUniformLocation(program, "ka"), ka);

  gl.uniform1f(gl.getUniformLocation(program, "le"), le);

  gl.uniform4fv(gl.getUniformLocation(program, "lightEmission"), lightEmission);


  // Events
  // sliders
  document.getElementById("slideAlpha").oninput = function(){
    alpha = event.srcElement.value;
  };

  document.getElementById("slideKa").oninput = function(){
    ka = event.srcElement.value;
    gl.uniform1f(gl.getUniformLocation(program, "ka"), ka);
  };

  document.getElementById("slideKd").oninput = function(){
    kd = event.srcElement.value;
    gl.uniform1f(gl.getUniformLocation(program, "kd"), kd);
  };

  document.getElementById("slideKs").oninput = function(){
    ks = event.srcElement.value;
    gl.uniform1f(gl.getUniformLocation(program, "ks"), ks);
  };

  document.getElementById("slideLe").oninput = function(){
    le = event.srcElement.value;
    gl.uniform1f(gl.getUniformLocation(program, "le"), le);
  };

  var texture_path = "./textures/mytexture.png";

  function updateTexture(src) {
    image.src = src;
  }


  document.getElementById('myTexture').onchange = function(evt) {
     var tgt = evt.target || window.event.srcElement, files = tgt.files;
     // FileReader support
     if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => showImage(fr);
        fr.readAsDataURL(files[0]);
     }
  }

  function showImage(fileReader) {
     var img = document.getElementById("myImgTexture");
     img.src = fileReader.result;
     updateTexture(img.src);
  }


  // Save canvas
  download_img = function(el) {
   // get image URI from canvas object
   var imageURI = canvas.toDataURL("matcap/jpg");
   el.href = imageURI;
  };

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
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
  updateTexture(texture_path);


  render();
}


function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(radius*Math.sin(alpha), 0, radius*Math.cos(alpha));
  lightPosition = vec4(radius*Math.sin(alpha), 0, radius*Math.cos(alpha), 0);

  v = lookAt(eye, at, up);
  p = perspective(fovy, aspect, near, far);

  gl.uniformMatrix4fv(mLoc, false, flatten(m));
  gl.uniformMatrix4fv(vLoc, false, flatten(v));
  gl.uniformMatrix4fv(projLoc, false, flatten(p)); 
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

  for (var i = 0; i < index; i += 3) {
    gl.drawArrays(gl.TRIANGLES, i, 3);
  }

  window.requestAnimFrame(render);
}
