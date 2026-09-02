/**
 * Animated Gradient — Vanilla JS port of the React AnimatedGradient WebGL2 shader component.
 * Presets: Prism, Lava, Plasma, Pulse, Vortex, Mist, or fully custom.
 *
 * Usage:
 *   <canvas id="particleCanvas"></canvas>
 *   <script src="js/bg-3d.js"></script>
 *
 * The script auto-initialises on the #particleCanvas element.
 * Change `ACTIVE_PRESET` below (or set window.__gradientPreset before this script loads).
 */
(() => {
  /* ───────── Preset library ───────── */
  const presets = {
    Prism: {
      color1: "#050505", color2: "#66B3FF", color3: "#FFFFFF",
      rotation: -30, proportion: 1, scale: 0.01, speed: 30,
      distortion: 0, swirl: 50, swirlIterations: 16,
      softness: 47, offset: -299, shape: 0, shapeSize: 45,
    },
    Lava: {
      color1: "#FF9F21", color2: "#FF0303", color3: "#000000",
      rotation: 114, proportion: 100, scale: 0.52, speed: 30,
      distortion: 7, swirl: 18, swirlIterations: 20,
      softness: 100, offset: 717, shape: 2, shapeSize: 12,
    },
    Plasma: {
      color1: "#B566FF", color2: "#000000", color3: "#000000",
      rotation: 0, proportion: 63, scale: 0.75, speed: 30,
      distortion: 5, swirl: 61, swirlIterations: 5,
      softness: 100, offset: -168, shape: 0, shapeSize: 28,
    },
    Pulse: {
      color1: "#66FF85", color2: "#000000", color3: "#000000",
      rotation: -167, proportion: 92, scale: 0, speed: 20,
      distortion: 54, swirl: 75, swirlIterations: 3,
      softness: 28, offset: -813, shape: 0, shapeSize: 79,
    },
    Vortex: {
      color1: "#000000", color2: "#FFFFFF", color3: "#000000",
      rotation: 50, proportion: 41, scale: 0.4, speed: 20,
      distortion: 0, swirl: 100, swirlIterations: 3,
      softness: 5, offset: -744, shape: 1, shapeSize: 80,
    },
    Mist: {
      color1: "#050505", color2: "#FF66B8", color3: "#050505",
      rotation: 0, proportion: 33, scale: 0.48, speed: 39,
      distortion: 4, swirl: 65, swirlIterations: 5,
      softness: 100, offset: -235, shape: 2, shapeSize: 48,
    },
  };

  /* Select preset — override via window.__gradientPreset = "Lava" etc. */
  const ACTIVE_PRESET = window.__gradientPreset || "Prism";
  const p = Object.assign({}, presets[ACTIVE_PRESET] || presets.Prism);

  /* ── Speed adjustment: non-home pages run slightly slower ── */
  const isHomePage = /\/(index\.html)?(\?.*)?(\#.*)?$/.test(window.location.pathname) ||
                     window.location.pathname.endsWith("/public/") ||
                     window.location.pathname === "/";
  if (!isHomePage) {
    /* ~25% slower on inner pages for a subtler, calmer feel */
    p.speed = Math.round(p.speed * 0.75);
  }

  /* ───────── Canvas setup ───────── */
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) { console.warn("WebGL2 not available – animated gradient disabled."); return; }

  /* ───────── Shaders ───────── */
  const VERT = `#version 300 es
in vec4 a_position;
void main() { gl_Position = a_position; }`;

  const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2  u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4  u_color1;
uniform vec4  u_color2;
uniform vec4  u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI     3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 st) {
  vec2 i = floor(st); vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;
  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);
  vec3  bc = mix(color1, color2, r1);
  float bo = mix(c1.a, c2.a, r1);
  vec3  c  = mix(bc, color3, r2);
  float o  = mix(bo, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float ns = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (ns * u_resolution);
  uv  = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iters = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= 30.; i++) {
    if (i > iters) break;
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.  * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  float shape = 0.;
  float mixer = 0.;

  if (u_shape < .5) {
    vec2 cs = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(cs.x) * cos(cs.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 ss = uv * (.25 + 3. * u_shapeScale);
    float f = fract(ss.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (ns * u_resolution.y);
    sh += .5;
    float sc = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - sc, .55 + sc, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  fragColor = blend_colors(u_color1, u_color2, u_color3, mixer,
                           1. - clamp(u_softness, 0., 1.),
                           .01 + .01 * u_scale);
}`;

  /* ───────── Compile helpers ───────── */
  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader error:", gl.getShaderInfoLog(s));
    }
    return s;
  }

  const vs = compileShader(gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  /* Full-screen quad */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  /* Uniforms */
  const u = {};
  ["u_time","u_resolution","u_pixelRatio","u_scale","u_rotation",
   "u_color1","u_color2","u_color3","u_proportion","u_softness",
   "u_shape","u_shapeScale","u_distortion","u_swirl","u_swirlIterations"
  ].forEach(name => { u[name] = gl.getUniformLocation(prog, name); });

  /* ───────── Hex → RGBA helper ───────── */
  function hexToRgba(hex) {
    const c = hex.replace("#","");
    return [
      parseInt(c.substring(0,2),16) / 255,
      parseInt(c.substring(2,4),16) / 255,
      parseInt(c.substring(4,6),16) / 255,
      1.0
    ];
  }

  /* ───────── Resize ───────── */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    const h = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener("resize", resize);

  /* ───────── Render loop ───────── */
  const startTime = performance.now();
  const c1 = hexToRgba(p.color1);
  const c2 = hexToRgba(p.color2);
  const c3 = hexToRgba(p.color3);
  const speedFactor = (p.speed / 100) * 5;

  function frame(now) {
    const elapsed = (now - startTime) / 1000;

    gl.uniform1f(u.u_time, elapsed * speedFactor + p.offset * 0.01);
    gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(u.u_pixelRatio, window.devicePixelRatio || 1);
    gl.uniform1f(u.u_scale, p.scale);
    gl.uniform1f(u.u_rotation, (p.rotation * Math.PI) / 180);
    gl.uniform4f(u.u_color1, c1[0], c1[1], c1[2], c1[3]);
    gl.uniform4f(u.u_color2, c2[0], c2[1], c2[2], c2[3]);
    gl.uniform4f(u.u_color3, c3[0], c3[1], c3[2], c3[3]);
    gl.uniform1f(u.u_proportion, p.proportion / 100);
    gl.uniform1f(u.u_softness, p.softness / 100);
    gl.uniform1f(u.u_shape, p.shape);
    gl.uniform1f(u.u_shapeScale, p.shapeSize / 100);
    gl.uniform1f(u.u_distortion, p.distortion / 50);
    gl.uniform1f(u.u_swirl, p.swirl / 100);
    gl.uniform1f(u.u_swirlIterations, p.swirl === 0 ? 0 : p.swirlIterations);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  /* ───────── 3D Card Tilt ───────── */
  /* Excluded from: test question cards, teacher login box */
  function attachTilt() {
    const isTestPage = document.body.classList.contains("test-page");
    const isLoginPage = !!document.querySelector(".login-page");

    if (isTestPage || isLoginPage) return; /* No tilt on test or login */

    document.querySelectorAll(
      ".portal-button, .entry-card, .submitted-card, .pill-card, .stats-grid .card"
    ).forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -4;
        const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachTilt);
  } else {
    attachTilt();
  }
})();
