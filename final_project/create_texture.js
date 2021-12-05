window.onload = function init ()
{

  var canvas = document.getElementById("gl-canvas");
  var gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});
  if (!gl) {
    console.log("WebGL is not available");
  }


  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  // Vertex
  var max_verts = 1000;
  var index = 0;

  // var vBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
  //
  // var vPosition = gl.getAttribLocation(program, "a_Position");
  // gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(vPosition);


  // Color
  var colors = [
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 0.5, 0.0, 1.0), // orange
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.5, 1.0, 0.0, 1.0), // spring green
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 1.0, 0.5, 1.0), // turquoise
    vec4(0.0, 1.0, 1.0, 1.0), // cyan
    vec4(0.0, 0.5, 1.0, 1.0), // ocean
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(0.5, 0.0, 1.0, 1.0), // violet
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(1.0, 0.0, 0.5, 1.0)  // raspberry
  ];

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec3'], gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "a_Color");
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);


  // Events
  var offset = vec2(0.0, 0.0);    // v_t
  var velocity = vec2(0.0, 0.0);  // w_t
  var mousepos = vec2(0.0, 0.0);
  var speed = 0.01;



  var points = [];
  var triangles = [];
  var circles = [];

  var addPoint = true;
  var addTriangle = false;
  var addCircle = false;


    // click on canvas
  var colorMenu = document.getElementById("colorMenu");

  var addPointB = document.getElementById("addPointButton");
  var addTriangleB = document.getElementById("addTriangleButton");
  var addCircleB = document.getElementById("addCircleButton");

  addTriangleB.addEventListener("click", function (ev) {
    addTriangle = true;
    addPoint = false;
    addCircle = false;
  });

  addPointB.addEventListener("click", function (ev) {
    addTriangle = false;
    addPoint = true;
    addCircle = false;
  });

  addCircleB.addEventListener("click", function (ev) {
    addTriangle = false;
    addPoint = false;
    addCircle = true;
  });


  var counter_vT = 0;
  var counter_vC = 0;
  var center_C;
  var stops = 50;

    canvas.addEventListener("click", function (ev) {

    // Vertex
    var bbox = ev.target.getBoundingClientRect();
    mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
    velocity = vec2((mousepos[0] - offset[0])*speed, (mousepos[1] - offset[1])*speed);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));

    // Colors
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(colors[colorMenu.selectedIndex]));




    if (addTriangle) {

      if (counter_vT < 2) {
        points.push(index);
        counter_vT++;
      }
      else {
        counter_vT = 0;
        points.pop();
        triangles.push(points.pop());
      }

    }
    else if (addCircle) {
      if (counter_vC < 1) {
        points.push(index);
        counter_vC++;
        center_C = mousepos;
      }
      else {
        counter_vC = 0;
        circles.push(points.pop());
        var radius = ((mousepos[0] - center_C[0])**2 + (mousepos[1] - center_C[1])**2)**(1/2);


        for (var i = 0; i < stops; i++){
          var pos = vec2(center_C[0] + Math.cos(i*2*Math.PI/(stops-1))*radius, center_C[1] + Math.sin(i*2*Math.PI/(stops-1))*radius);

          gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(pos));

          gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(colors[colorMenu.selectedIndex]));

          index++;
          index %= max_verts;
        }
      }

    }
    else {
      points.push(index);
    }


    index++;
    index %= max_verts;
  });

    // buttons
  var clearButton = document.getElementById("clearButton");

  clearButton.addEventListener("click", function (ev) {
    var bgcolor = vec4(1.0, 1.0, 1.0, 1.0);
    gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
    index = 0;
    counter_vT = 0;
    counter_vC = 0;
    points = [];
    triangles = [];
    circles = [];
  });

  var bgMenu = document.getElementById("bgMenu");
  var backgroundButton = document.getElementById("changeBackground");

  backgroundButton.addEventListener("click", function (ev) {
    var bgcolor = colors[bgMenu.selectedIndex];
    gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
  });


  // Save canvas
  download_img = function(el) {
   // get image URI from canvas object
   var imageURI = canvas.toDataURL("texture/jpg");
   el.href = imageURI;
  };



  // QUAD
  // var vertices = [
  //   vec3(-4, -1, -21),
  //   vec3(4, -1, -21),
  //   vec3(4, -1, -21),
  //   vec3(-4, -1, -21)
  // ];
  var vertices = [
    vec2(1.0,  1.0),
    vec2(-1.0,  1.0),
    vec2(-1.0,  -1.0),
    vec2(-1.0,  -1.0),
    vec2(1.0,  -1.0),
    vec2(1.0,  1.0)
  ];


  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); // 3
  gl.enableVertexAttribArray(vPosition);


  var tex_coordinates = new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0]);

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tex_coordinates, gl.STATIC_DRAW);

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
















  gl.uniform1i(gl.getUniformLocation(program, "bgTexture"), 0);

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
  updateCanvas('../assets/earth.jpg');
  // image.src = '../assets/earth.jpg';



  // Load background
  document.getElementById('myBckgrnd').onchange = function(evt) {
     var tgt = evt.target || window.event.srcElement, files = tgt.files;
     // FileReader support
     if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => showImage(fr);
        fr.readAsDataURL(files[0]);
     }
  }

  function showImage(fileReader) {
     var img = document.getElementById("myBckgrnd"); // myImgMatcap
     img.src = fileReader.result;
     updateCanvas(img.src);
  }

  function updateCanvas(src) {
    image.src = src;
  }







  // Render
  function render()
  {
  // gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // for (var i = 0; i < points.length; i++) {
  //   gl.drawArrays(gl.POINTS, points[i], 1);
  // }
  //
  // for (var i = 0; i < triangles.length; i++) {
  //   gl.drawArrays(gl.TRIANGLES, triangles[i], 3);
  // }
  //
  // for (var i = 0; i < circles.length; i++) {
  //   gl.drawArrays(gl.TRIANGLE_FAN, circles[i], 51);
  // }

  gl.drawArrays(gl.TRIANGLES, 0, 6);
  // gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);

  window.requestAnimFrame(render);
  }


  render();

}
