window.onload = function init ()
{

  var canvas = document.getElementById("c");
  var gl = canvas.getContext("webgl");
  // gl = webGLutils.setup()

  if (!gl) {
    console.log("WebGL is not available");
  }

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

}
