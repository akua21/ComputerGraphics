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

  // Vertex
  var max_verts = 1000;
  var index = 0;

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Colors
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

    // Triangle
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
    // Circle
    else if (addCircle) {
      if (counter_vC < 1) {
        points.push(index);
        counter_vC++;
        center_C = mousepos;
      }
      else {
        counter_vC = 0;
        circles.push(points.pop());

        var dist_x = mousepos[0] - center_C[0];
        var dist_y = mousepos[1] - center_C[1];

        var radius = (dist_x**2 + dist_y**2)**(1/2);

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
    // Point
    else {
      points.push(index);
    }
    index++;
    index %= max_verts;
  });

  // Buttons
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



  // Render
  function render()
  {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < points.length; i++) {
      gl.drawArrays(gl.POINTS, points[i], 1);
    }

    for (var i = 0; i < triangles.length; i++) {
      gl.drawArrays(gl.TRIANGLES, triangles[i], 3);
    }

    for (var i = 0; i < circles.length; i++) {
      gl.drawArrays(gl.TRIANGLE_FAN, circles[i], 51);
    }

    window.requestAnimFrame(render);
  }
  render();
}
