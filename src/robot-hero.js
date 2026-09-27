import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Coordinates are normalized against robot-notebook.webp (1536 × 1024).
// Local displacement articulates the photographed fingers without moving the desk.
const VERTEX = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position.x, -a_position.y, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_time;
  uniform float u_scroll;
  varying vec2 v_uv;

  float region(vec2 uv, vec2 center, vec2 radius) {
    vec2 p = (uv - center) / radius;
    return exp(-dot(p, p) * 2.0);
  }

  vec2 finger(vec2 uv, vec2 center, float phase, float time) {
    float press = pow(max(0.0, sin(time * 12.0 + phase)), 3.0);
    float weight = region(uv, center, vec2(0.013, 0.034));
    return vec2(-0.002, 0.010) * press * weight;
  }

  void main() {
    vec2 uv = v_uv;
    float t = u_time + u_scroll * 2.0;
    vec2 motion = vec2(0.0);
    // The far hand, then the near hand; staggered taps avoid a unison bob.
    motion += finger(uv, vec2(0.346, 0.745), 0.0, t);
    motion += finger(uv, vec2(0.366, 0.754), 2.1, t);
    motion += finger(uv, vec2(0.389, 0.751), 4.0, t);
    motion += finger(uv, vec2(0.413, 0.736), 1.2, t);
    motion += finger(uv, vec2(0.429, 0.767), 3.0, t);
    motion += finger(uv, vec2(0.449, 0.777), 0.8, t);
    motion += finger(uv, vec2(0.474, 0.780), 4.9, t);
    motion += finger(uv, vec2(0.496, 0.767), 2.6, t);
    motion.y += sin(t * 6.0) * 0.002 * region(uv, vec2(0.469, 0.732), vec2(0.090, 0.040));
    motion.y += sin(t * 5.0 + 2.0) * 0.0015 * region(uv, vec2(0.393, 0.705), vec2(0.072, 0.035));
    // Subtle head movement and screen light keep the mechanical pose alive.
    motion.x += sin(t * 1.3) * 0.0012 * region(uv, vec2(0.644, 0.264), vec2(0.120, 0.180));
    vec3 color = texture2D(u_image, clamp(uv - motion, 0.001, 0.999)).rgb;
    float glow = region(uv, vec2(0.365, 0.774), vec2(0.16, 0.095));
    color += vec3(0.012, 0.038, 0.030) * glow * (0.65 + 0.35 * sin(t * 3.0));
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createTypingRenderer(canvas, image) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return null;

  const shaders = [];
  let program;
  let buffer;
  let texture;
  const dispose = () => {
    canvas.classList.remove("is-ready");
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  };

  try {
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Robot shader unavailable");
      return shader;
    };
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Robot renderer unavailable");
    gl.useProgram(program);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const scrollLocation = gl.getUniformLocation(program, "u_scroll");

    return {
      render(time, progress) {
        // Bound GPU work to the displayed size and the source resolution.
        const width = Math.min(1536, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5)));
        const height = Math.round(width / 1.5);
        if (!width) return;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        gl.uniform1f(timeLocation, time);
        gl.uniform1f(scrollLocation, progress);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        canvas.classList.add("is-ready");
      },
      dispose,
    };
  } catch {
    dispose();
    return null; // The semantic image remains visible when WebGL is unavailable.
  }
}

export function initRobotHero() {
  const hero = document.querySelector("[data-robot-hero]");
  if (!hero) return () => {};
  const image = hero.querySelector("[data-robot-image]");
  const canvas = hero.querySelector("[data-robot-canvas]");
  const button = hero.querySelector("[data-robot-motion]");
  const media = gsap.matchMedia();
  let paused = false;
  let disposed = false;

  const start = () => media.add({
    desktop: "(min-width: 1024px) and (min-height: 700px)",
    motion: "(prefers-reduced-motion: no-preference)",
  }, ({ conditions }) => {
    if (!conditions.motion) return undefined;
    let cancelled = false;
    let renderer = null;
    let running = false;
    let inView = false;
    let lastFrame = 0;
    let elapsed = 0;
    const state = { progress: 0 };

    const tick = (time, delta) => {
      elapsed += Math.min(delta, 50) / 1000;
      if (time - lastFrame < 1 / 30) return;
      lastFrame = time;
      renderer?.render(elapsed, state.progress);
    };
    const syncPlayback = () => {
      const shouldRun = Boolean(renderer && inView && !document.hidden);
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
      hero.dataset.robotPlaying = String(running);
    };

    // Observe actual visibility, including the extra distance added by pinning.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    visibilityObserver.observe(hero);

    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "robot-camera",
        trigger: hero,
        start: "top top",
        end: conditions.desktop ? () => `+=${Math.round(window.innerHeight * 0.8)}` : "bottom top",
        pin: conditions.desktop,
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    });
    timeline
      .to(hero.querySelector("[data-robot-camera]"), {
        scale: conditions.desktop ? 1.12 : 1.045,
        xPercent: conditions.desktop ? -3 : -1,
        yPercent: conditions.desktop ? -2 : -1,
        duration: 1,
      }, 0)
      .to(state, { progress: 1, duration: 1 }, 0)
      .to(hero.querySelector("[data-robot-progress]"), { scaleX: 1, duration: 1 }, 0);

    image.decode().then(() => {
      if (cancelled) return;
      renderer = createTypingRenderer(canvas, image);
      renderer?.render(0, state.progress);
      syncPlayback();
      ScrollTrigger.refresh();
    }).catch(() => { /* Keep the image fallback and the rest of the page usable. */ });

    const onContextLost = (event) => {
      event.preventDefault();
      renderer?.dispose();
      renderer = null;
      syncPlayback();
    };
    const onContextRestored = () => {
      if (cancelled || !image.complete || !image.naturalWidth) return;
      renderer = createTypingRenderer(canvas, image);
      syncPlayback();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      renderer?.dispose();
      delete hero.dataset.robotPlaying;
    };
  }, hero);

  const toggle = () => {
    paused = !paused;
    media.revert();
    if (!paused) start();
    button.innerHTML = paused
      ? 'Retomar animação <span aria-hidden="true">▷</span>'
      : 'Pausar animação <span aria-hidden="true">Ⅱ</span>';
    ScrollTrigger.refresh();
  };
  button.hidden = false;
  button.addEventListener("click", toggle);
  start();
  document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

  return () => {
    disposed = true;
    media.revert();
    button.removeEventListener("click", toggle);
    button.hidden = true;
  };
}
