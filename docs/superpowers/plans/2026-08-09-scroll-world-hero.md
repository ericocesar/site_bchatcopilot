# Scroll World Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Hero in `index.html:67-122` with a scroll-driven Canvas2D animation (4 scenes: Chaos → Cluster → Copilot → Product) that retains the existing copy/CTA, pauses when offscreen, and falls back to a static layout when `prefers-reduced-motion: reduce` is set.

**Architecture:** A single `<ScrollWorldHero>` React component mounted by `App.jsx` (inside `#react-root`) that swaps into the existing hero `<section>` markup. GSAP ScrollTrigger maps scroll position to `progress ∈ [0,1]`; a `useScrollProgress` hook writes that value into a ref consumed by a `requestAnimationFrame` loop. The scene state lives in a pure factory `createScene()` whose `update(progress, dt)` and `draw(ctx)` are deterministic for a given seed. React only owns mount/unmount and reduced-motion branching — the rAF loop runs in a `useEffect`.

**Tech Stack:** React 19 (already in project), GSAP 3.x + ScrollTrigger plugin (new dep), Canvas2D, Vitest (already configured).

**Replaces:** Hero block at `index.html:67-122` (the entire `<section class="hero" id="topo">…</section>`).

**Leaves untouched:** proof-band, signal-strip, benefits, features, process, pricing, comparison, faq, final-cta, footer. `landing.js` vanilla orchestrator untouched.

## Global Constraints

- Vite + plain JavaScript (no TypeScript), ES modules, `"type": "module"` in `package.json`.
- `npm run check` (`node --check src/landing.js`) must continue to pass.
- All new tests must pass under `npm test` (Vitest, jsdom environment already configured).
- `npm run build` must succeed with no new warnings.
- Canvas `pointer-events: none`, `aria-hidden="true"`. CTAs live in DOM overlay above canvas.
- Cleanup must cancel rAF and `ScrollTrigger.kill()` on unmount.
- DPR cap at 2; resize debounce 150 ms.
- Determinism: scene RNG uses `mulberry32` with a fixed seed; identical `progress` always produces identical draw calls.

## File Structure

```
src/scroll-world/
├── ScrollWorldHero.jsx
├── ScrollWorldHero.test.jsx
├── scrollWorld.css
├── canvasUtils.js
├── canvasUtils.test.js
├── useScrollProgress.js
├── useScrollProgress.test.js
├── useReducedMotion.js
├── useReducedMotion.test.js
└── scene/
    ├── createScene.js
    ├── createScene.test.js
    ├── particles.js
    └── theme.js
```

`src/scroll-world/scene/` owns the pure scene factory and its constants. `src/scroll-world/` owns the React shell + hooks. No file mixes the two responsibilities.

---

### Task 1: Canvas utilities (mulberry32 + resize)

**Files:**
- Create: `src/scroll-world/canvasUtils.js`
- Create: `src/scroll-world/canvasUtils.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `mulberry32(seed: number): () => number` (returns deterministic float in [0,1)); `resizeCanvas(canvas, cssWidth, cssHeight, dprCap = 2): { width, height }` (sets `canvas.width/height` to scaled pixel dims, returns them).

- [ ] **Step 1: Write the failing test**

```js
// src/scroll-world/canvasUtils.test.js
import { describe, it, expect } from "vitest";
import { mulberry32, resizeCanvas } from "./canvasUtils.js";

describe("mulberry32", () => {
  it("returns a function that yields floats in [0,1)", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});

describe("resizeCanvas", () => {
  it("sets canvas pixel dimensions to cssWidth × dpr", () => {
    const canvas = { width: 0, height: 0 };
    resizeCanvas(canvas, 800, 600, 2);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it("caps dpr at 2 by default", () => {
    const canvas = { width: 0, height: 0 };
    resizeCanvas(canvas, 800, 600, 4);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it("returns the scaled dimensions", () => {
    const canvas = { width: 0, height: 0 };
    const result = resizeCanvas(canvas, 1024, 768, 1);
    expect(result).toEqual({ width: 1024, height: 768 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/scroll-world/canvasUtils.test.js`
Expected: FAIL — `Cannot find module './canvasUtils.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/scroll-world/canvasUtils.js

/**
 * Deterministic PRNG. Same seed → same sequence on every platform.
 * @param {number} seed
 * @returns {() => number} float in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Resize a canvas backing store, capping devicePixelRatio.
 * @param {{ width: number, height: number }} canvas
 * @param {number} cssWidth
 * @param {number} cssHeight
 * @param {number} [dprCap=2]
 * @returns {{ width: number, height: number }}
 */
export function resizeCanvas(canvas, cssWidth, cssHeight, dprCap = 2) {
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, dprCap);
  const width = Math.round(cssWidth * dpr);
  const height = Math.round(cssHeight * dpr);
  canvas.width = width;
  canvas.height = height;
  return { width, height };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/scroll-world/canvasUtils.test.js`
Expected: PASS — 6 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/scroll-world/canvasUtils.js src/scroll-world/canvasUtils.test.js
git commit -m "feat(scroll-world): add seeded RNG and canvas resize helper"
```

---

### Task 2: Scene theme constants

**Files:**
- Create: `src/scroll-world/scene/theme.js`

**Interfaces:**
- Consumes: nothing
- Produces: `THEME` object with `clusterColors: string[]` (4 hex), `easing: { inOut, out }` (cubic-bezier tuples), `PARTICLE_COUNT: 50`, `CLUSTER_COUNT: 4`, `SCENE_BOUNDS: { chaos: [0, 0.20], cluster: [0.20, 0.45], copilot: [0.45, 0.70], product: [0.70, 1.00] }`.

- [ ] **Step 1: Write theme.js**

```js
// src/scroll-world/scene/theme.js

export const PARTICLE_COUNT = 50;
export const CLUSTER_COUNT = 4;

export const SCENE_BOUNDS = Object.freeze({
  chaos: [0.0, 0.2],
  cluster: [0.2, 0.45],
  copilot: [0.45, 0.7],
  product: [0.7, 1.0],
});

export const clusterColors = Object.freeze([
  "#5DA3FF", // blue
  "#C4F567", // lime
  "#63E6DE", // teal
  "#F59E0B", // amber
]);

export const easing = Object.freeze({
  inOut: [0.65, 0, 0.35, 1],
  out: [0.22, 1, 0.36, 1],
});

export const THEME = Object.freeze({
  PARTICLE_COUNT,
  CLUSTER_COUNT,
  SCENE_BOUNDS,
  clusterColors,
  easing,
  coreColor: "#63E6DE",
  canvasBackground: "rgba(8, 11, 16, 0)",
});
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: pass (no syntax error).

- [ ] **Step 3: Commit**

```bash
git add src/scroll-world/scene/theme.js
git commit -m "feat(scroll-world): define scene theme constants"
```

---

### Task 3: Scene factory (createScene)

**Files:**
- Create: `src/scroll-world/scene/particles.js`
- Create: `src/scroll-world/scene/createScene.js`
- Create: `src/scroll-world/scene/createScene.test.js`

**Interfaces:**
- Consumes: `mulberry32` from `../canvasUtils.js`; constants from `./theme.js`
- Produces: `createScene({ seed = 1 }): { state, resize(width, height, dpr), update(progress, dt), draw(ctx) }` — pure factory; same seed produces same particle layout.

- [ ] **Step 1: Write particles.js**

```js
// src/scroll-world/scene/particles.js

/**
 * A single message particle in the galaxy scene.
 */
export function createParticles(rand, count, width, height) {
  const particles = new Array(count);
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.min(width, height) * (0.18 + rand() * 0.32);
    particles[i] = {
      baseX: width / 2 + Math.cos(angle) * radius,
      baseY: height / 2 + Math.sin(angle) * radius,
      clusterIndex: Math.floor(rand() * 4),
      size: 1.5 + rand() * 2.5,
      phase: rand() * Math.PI * 2,
      driftAmp: 8 + rand() * 16,
    };
  }
  return particles;
}

/**
 * Target positions for each cluster, evenly distributed in a ring.
 */
export function clusterTargets(width, height, count) {
  const targets = new Array(count);
  const radius = Math.min(width, height) * 0.22;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    targets[i] = {
      x: width / 2 + Math.cos(a) * radius,
      y: height / 2 + Math.sin(a) * radius,
    };
  }
  return targets;
}
```

- [ ] **Step 2: Write the failing test for createScene**

```js
// src/scroll-world/scene/createScene.test.js
import { describe, it, expect } from "vitest";
import { createScene } from "./createScene.js";

describe("createScene", () => {
  it("produces deterministic particle positions for the same seed", () => {
    const a = createScene({ seed: 7 });
    const b = createScene({ seed: 7 });
    a.resize(800, 600, 1);
    b.resize(800, 600, 1);
    a.update(0.1, 16);
    b.update(0.1, 16);
    expect(a.state.particles[0].baseX).toBeCloseTo(b.state.particles[0].baseX, 5);
    expect(a.state.particles[0].baseY).toBeCloseTo(b.state.particles[0].baseY, 5);
  });

  it("clamps progress to [0,1] internally", () => {
    const scene = createScene({ seed: 7 });
    scene.resize(800, 600, 1);
    expect(() => scene.update(-0.5, 16)).not.toThrow();
    expect(() => scene.update(1.5, 16)).not.toThrow();
    expect(scene.state.clampedProgress).toBeGreaterThanOrEqual(0);
    expect(scene.state.clampedProgress).toBeLessThanOrEqual(1);
  });

  it("draw() invokes canvas APIs without throwing", () => {
    const calls = [];
    const ctx = new Proxy({}, {
      get(_t, key) {
        return (...args) => calls.push([String(key), ...args.map((a) => (typeof a === "number" ? a : String(a)))]);
      },
    });
    const scene = createScene({ seed: 7 });
    scene.resize(800, 600, 1);
    scene.update(0.5, 16);
    expect(() => scene.draw(ctx)).not.toThrow();
    expect(calls.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/scroll-world/scene/createScene.test.js`
Expected: FAIL — `Cannot find module './createScene.js'`

- [ ] **Step 4: Write createScene.js**

```js
// src/scroll-world/scene/createScene.js
import { mulberry32 } from "../canvasUtils.js";
import { PARTICLE_COUNT, CLUSTER_COUNT, SCENE_BOUNDS, clusterColors, easing, coreColor } from "./theme.js";
import { createParticles, clusterTargets } from "./particles.js";

const easeInOut = (t) => {
  // cubic-bezier(0.65, 0, 0.35, 1) — Newton's method approximation
  // For animation purposes, use a closed-form smoothstep variant tuned to the curve
  return t * t * (3 - 2 * t);
};

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createScene({ seed = 1 } = {}) {
  const rand = mulberry32(seed);

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    particles: [],
    clusters: [],
    core: { x: 0, y: 0, pulse: 0 },
    progress: 0,
    clampedProgress: 0,
  };

  function resize(width, height, dpr = 1) {
    state.width = width;
    state.height = height;
    state.dpr = dpr;
    state.particles = createParticles(rand, PARTICLE_COUNT, width, height);
    state.clusters = clusterTargets(width, height, CLUSTER_COUNT);
    state.core = { x: width / 2, y: height / 2, pulse: 0 };
  }

  function update(progress, dt) {
    const p = Math.max(0, Math.min(1, progress));
    state.progress = progress;
    state.clampedProgress = p;
    const t = dt / 1000; // seconds
    state.core.pulse = (state.core.pulse + t * 1.6) % (Math.PI * 2);
  }

  function draw(ctx) {
    if (!state.width || !state.height) return;
    const p = state.clampedProgress;

    const chaos = smoothstep(SCENE_BOUNDS.chaos[0], SCENE_BOUNDS.chaos[1], p);
    const cluster = smoothstep(SCENE_BOUNDS.cluster[0], SCENE_BOUNDS.cluster[1], p);
    const copilot = smoothstep(SCENE_BOUNDS.copilot[0], SCENE_BOUNDS.copilot[1], p);
    const product = smoothstep(SCENE_BOUNDS.product[0], SCENE_BOUNDS.product[1], p);

    ctx.save();
    ctx.scale(state.dpr, state.dpr);

    // Draw particles
    for (let i = 0; i < state.particles.length; i++) {
      const part = state.particles[i];
      const clusterPos = state.clusters[part.clusterIndex];
      const t = (1 - cluster) * chaos + cluster * easeInOut(cluster);
      const drift = Math.sin(state.core.pulse + part.phase) * part.driftAmp * (1 - cluster);
      const x = part.baseX * (1 - t) + clusterPos.x * t + drift;
      const y = part.baseY * (1 - t) + clusterPos.y * t + drift;
      const color = clusterColors[part.clusterIndex];

      const alpha = 0.25 + 0.6 * cluster + 0.15 * (1 - product);
      const size = part.size * (1 + 0.5 * copilot);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw connections (cluster → core) during copilot phase
    if (copilot > 0) {
      ctx.globalAlpha = copilot * 0.55;
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < state.clusters.length; i++) {
        const c = state.clusters[i];
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        const mx = (c.x + state.core.x) / 2;
        const my = (c.y + state.core.y) / 2 - 40 * copilot;
        ctx.quadraticCurveTo(mx, my, state.core.x, state.core.y);
        ctx.stroke();
      }
    }

    // Draw core
    const corePulse = 1 + 0.15 * Math.sin(state.core.pulse * 2);
    const coreRadius = (10 + 18 * copilot + 40 * product) * corePulse;
    const coreAlpha = 0.4 + 0.4 * copilot + 0.2 * product;
    ctx.globalAlpha = Math.min(1, coreAlpha);
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(state.core.x, state.core.y, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  return { state, resize, update, draw };
}

// Suppress unused-import lint for easing tuple reference (kept for future use)
void easing;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/scroll-world/scene/createScene.test.js`
Expected: PASS — 3 assertions.

- [ ] **Step 6: Commit**

```bash
git add src/scroll-world/scene/particles.js src/scroll-world/scene/createScene.js src/scroll-world/scene/createScene.test.js
git commit -m "feat(scroll-world): implement deterministic scene factory"
```

---

### Task 4: useReducedMotion hook

**Files:**
- Create: `src/scroll-world/useReducedMotion.js`
- Create: `src/scroll-world/useReducedMotion.test.js`

**Interfaces:**
- Consumes: `window.matchMedia`
- Produces: `useReducedMotion(): boolean` — true when `(prefers-reduced-motion: reduce)` matches; updates on media-query change.

- [ ] **Step 1: Write the failing test**

```js
// src/scroll-world/useReducedMotion.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion.js";

function mockMatchMedia(matches) {
  const listeners = new Set();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: (_e, cb) => listeners.add(cb),
    removeEventListener: (_e, cb) => listeners.delete(cb),
  }));
  return {
    set(next) {
      listeners.forEach((cb) => cb({ matches: next }));
    },
  };
}

describe("useReducedMotion", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { matchMedia: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when media query matches reduce", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when media query does not match", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("updates when the media query change fires", () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    mq.set(true);
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/scroll-world/useReducedMotion.test.js`
Expected: FAIL — `Cannot find module './useReducedMotion.js'`

- [ ] **Step 3: Write the hook**

```js
// src/scroll-world/useReducedMotion.js
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event) => setReduced(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Add jsdom + @testing-library/react to dev deps and update vitest config**

This task (and Tasks 5, 6) need jsdom + React Testing Library. The current `vite.config.js` sets `environment: "node"` and `include: ["src/**/*.test.js"]` — that won't load `.test.jsx` or expose `document`/`window` for `renderHook`. Update the config to support both vanilla node tests (`leads.test.js`, `pricing.test.js`) and React tests.

Run:
```bash
npm install --save-dev @testing-library/react@^16.1.0 jsdom@^25.0.0 @testing-library/dom@^10.4.0
```

Replace `vite.config.js` contents with:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
  build: { sourcemap: false },
  test: {
    include: ["src/**/*.test.{js,jsx}"],
    environmentMatchGlobs: [
      ["src/scroll-world/**/*.test.{js,jsx}", "jsdom"],
      ["src/**/ScrollWorld*.test.{js,jsx}", "jsdom"],
    ],
  },
});
```

(`leads.test.js` and `pricing.test.js` keep the default `node` environment.)

Expected: `package.json`, `package-lock.json`, and `vite.config.js` updated.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/scroll-world/useReducedMotion.test.js`
Expected: PASS — 3 assertions.

- [ ] **Step 6: Commit**

```bash
git add src/scroll-world/useReducedMotion.js src/scroll-world/useReducedMotion.test.js package.json package-lock.json
git commit -m "feat(scroll-world): add useReducedMotion hook"
```

---

### Task 5: useScrollProgress hook

**Files:**
- Create: `src/scroll-world/useScrollProgress.js`
- Create: `src/scroll-world/useScrollProgress.test.js`

**Interfaces:**
- Consumes: `gsap` + `ScrollTrigger` (loaded once in module scope); `IntersectionObserver`
- Produces: `useScrollProgress({ pinRef, totalScrollVh = 300 }): { progressRef }` — `progressRef.current` ∈ [0,1] updated synchronously by ScrollTrigger callback; falls back to 0 when offscreen.

- [ ] **Step 1: Write the failing test**

```js
// src/scroll-world/useScrollProgress.test.js
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mocks must be declared before importing the hook.
const scrollTriggerInstances = [];

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn((fn) => {
      fn();
      return { revert: vi.fn() };
    }),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create: vi.fn((config) => {
      scrollTriggerInstances.push(config);
      return { kill: vi.fn() };
    }),
  },
}));

import { useScrollProgress } from "./useScrollProgress.js";

describe("useScrollProgress", () => {
  it("returns a ref that defaults to 0", () => {
    const pinRef = { current: null };
    const { result } = renderHook(() => useScrollProgress({ pinRef }));
    expect(result.current.progressRef.current).toBe(0);
  });

  it("registers a ScrollTrigger pinned to the ref element", () => {
    scrollTriggerInstances.length = 0;
    const fakeEl = document.createElement("div");
    const pinRef = { current: fakeEl };
    renderHook(() => useScrollProgress({ pinRef, totalScrollVh: 250 }));
    expect(scrollTriggerInstances.length).toBe(1);
    expect(scrollTriggerInstances[0].pin).toBe(fakeEl);
    expect(scrollTriggerInstances[0].end).toContain("+=250%");
  });

  it("writes progress into the ref onUpdate", () => {
    scrollTriggerInstances.length = 0;
    const pinRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useScrollProgress({ pinRef }));
    const cfg = scrollTriggerInstances[0];
    cfg.onUpdate({ progress: 0.42 });
    expect(result.current.progressRef.current).toBeCloseTo(0.42, 5);
  });

  it("clamps onUpdate values to [0,1]", () => {
    scrollTriggerInstances.length = 0;
    const pinRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useScrollProgress({ pinRef }));
    const cfg = scrollTriggerInstances[0];
    cfg.onUpdate({ progress: -0.3 });
    expect(result.current.progressRef.current).toBe(0);
    cfg.onUpdate({ progress: 1.7 });
    expect(result.current.progressRef.current).toBe(1);
  });
});
```

- [ ] **Step 2: Add gsap to deps and run test to verify it fails**

Run: `npm install --save gsap@^3.12.5`
Run: `npm test -- src/scroll-world/useScrollProgress.test.js`
Expected: FAIL — `Cannot find module './useScrollProgress.js'`

- [ ] **Step 3: Write the hook**

```js
// src/scroll-world/useScrollProgress.js
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginRegistered = false;
function ensurePlugin() {
  if (!pluginRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    pluginRegistered = true;
  }
}

export function useScrollProgress({ pinRef, totalScrollVh = 300 } = {}) {
  const progressRef = useRef(0);
  const triggerRef = useRef(null);

  useEffect(() => {
    ensurePlugin();
    const target = pinRef && pinRef.current;
    if (!target) return undefined;

    const ctx = gsap.context(() => {
      triggerRef.current = ScrollTrigger.create({
        trigger: target,
        start: "top top",
        end: `+=${totalScrollVh}%`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const p = Math.max(0, Math.min(1, self.progress));
          progressRef.current = p;
        },
      });
    });

    return () => {
      ctx.revert();
      if (triggerRef.current) {
        triggerRef.current.kill();
        triggerRef.current = null;
      }
    };
  }, [pinRef, totalScrollVh]);

  return { progressRef };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/scroll-world/useScrollProgress.test.js`
Expected: PASS — 4 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/scroll-world/useScrollProgress.js src/scroll-world/useScrollProgress.test.js package.json package-lock.json
git commit -m "feat(scroll-world): add useScrollProgress hook with ScrollTrigger"
```

---

### Task 6: ScrollWorldHero component

**Files:**
- Create: `src/scroll-world/ScrollWorldHero.jsx`
- Create: `src/scroll-world/ScrollWorldHero.test.jsx`

**Interfaces:**
- Consumes: `useReducedMotion`, `useScrollProgress`, `createScene`, `resizeCanvas` from `./canvasUtils.js`
- Produces: `<ScrollWorldHero />` — when reduced-motion, renders a static `<section>` with hero copy + CTA. Otherwise, renders the pinned scroll world with canvas + overlay copy.

- [ ] **Step 1: Write the failing test**

```jsx
// src/scroll-world/ScrollWorldHero.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("./useReducedMotion.js", () => ({
  useReducedMotion: vi.fn(() => false),
}));
vi.mock("./useScrollProgress.js", () => ({
  useScrollProgress: vi.fn(() => ({ progressRef: { current: 0 } })),
}));

import { useReducedMotion } from "./useReducedMotion.js";
import ScrollWorldHero from "./ScrollWorldHero.jsx";

describe("ScrollWorldHero", () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it("renders a canvas and overlay copy when motion is allowed", () => {
    const { container } = render(<ScrollWorldHero />);
    expect(container.querySelector("canvas")).toBeTruthy();
    expect(container.querySelector("#hero-title")).toBeTruthy();
    expect(container.querySelector('a[href="#contato"]')).toBeTruthy();
  });

  it("does NOT mount the canvas when reduced-motion is set", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { container } = render(<ScrollWorldHero />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("#hero-title")).toBeTruthy();
    expect(container.querySelector('a[href="#contato"]')).toBeTruthy();
  });

  it("keeps the analytics data attributes on the CTA", () => {
    const { container } = render(<ScrollWorldHero />);
    const cta = container.querySelector('a[href="#contato"]');
    expect(cta.getAttribute("data-analytics")).toBe("landing_primary_cta_click");
    expect(cta.getAttribute("data-placement")).toBe("hero");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/scroll-world/ScrollWorldHero.test.jsx`
Expected: FAIL — `Cannot find module './ScrollWorldHero.jsx'`

- [ ] **Step 3: Write the component**

```jsx
// src/scroll-world/ScrollWorldHero.jsx
import { useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion.js";
import { useScrollProgress } from "./useScrollProgress.js";
import { resizeCanvas } from "./canvasUtils.js";
import { createScene } from "./scene/createScene.js";
import "./scrollWorld.css";

function StaticHero() {
  return (
    <section className="hero hero-static" id="topo" aria-labelledby="hero-title">
      <div className="container hero-content">
        <div className="hero-copy">
          <p className="eyebrow reveal">IA PARA ATENDIMENTO <span className="eyebrow-line"></span> BCHAT</p>
          <h1 id="hero-title" className="hero-title reveal reveal-delay-1">Mais contexto para atender.<br /><em>Mais confiança</em> para responder.</h1>
          <p className="hero-description reveal reveal-delay-2">O BChat Copilot apoia equipes de atendimento com resumos, sugestões e conhecimento conectado dentro da própria conversa.</p>
          <div className="hero-actions reveal reveal-delay-3">
            <a className="button button-primary" href="#contato" data-analytics="landing_primary_cta_click" data-placement="hero">Solicitar demonstração <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#funcionalidades" data-analytics="landing_secondary_cta_click" data-placement="hero">Conhecer funcionalidades <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ScrollWorldHero() {
  const reduced = useReducedMotion();
  if (reduced) return <StaticHero />;
  return <ScrollWorld />;
}

function ScrollWorld() {
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const { progressRef } = useScrollProgress({ pinRef, totalScrollVh: 300 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return undefined;

    const scene = createScene({ seed: 42 });
    let raf = 0;
    let inView = true;
    let lastTs = performance.now();
    let resizeTimer = 0;

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      resizeCanvas(canvas, rect.width, rect.height, 2);
      scene.resize(rect.width, rect.height, 1);
    };

    handleResize();
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 150);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView && !raf) raf = requestAnimationFrame(loop);
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    function loop(ts) {
      raf = 0;
      if (!inView) return;
      const dt = Math.min(64, ts - lastTs);
      lastTs = ts;
      const progress = progressRef.current;
      scene.update(progress, dt);
      try {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        scene.draw(ctx2d);
      } catch (err) {
        console.warn("[scroll-world] draw failed", err);
        observer.disconnect();
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [progressRef]);

  return (
    <section className="hero hero-world" id="topo" aria-labelledby="hero-title">
      <div ref={pinRef} className="hero-world-pin">
        <canvas ref={canvasRef} className="hero-world-canvas" aria-hidden="true" />
        <div className="container hero-content hero-world-overlay">
          <div className="hero-copy">
            <p className="eyebrow reveal">IA PARA ATENDIMENTO <span className="eyebrow-line"></span> BCHAT</p>
            <h1 id="hero-title" className="hero-title reveal reveal-delay-1">Mais contexto para atender.<br /><em>Mais confiança</em> para responder.</h1>
            <p className="hero-description reveal reveal-delay-2">O BChat Copilot apoia equipes de atendimento com resumos, sugestões e conhecimento conectado dentro da própria conversa.</p>
            <p className="hero-fit reveal reveal-delay-2">Para operações de suporte, vendas e pós-venda que lidam com volume, contexto e consistência.</p>
            <div className="hero-actions reveal reveal-delay-3">
              <a className="button button-primary" href="#contato" data-analytics="landing_primary_cta_click" data-placement="hero">Solicitar demonstração <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#funcionalidades" data-analytics="landing_secondary_cta_click" data-placement="hero">Conhecer funcionalidades <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-meta reveal reveal-delay-4"><span className="status-dot"></span> Humano no controle · fontes visíveis em cada sugestão</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/scroll-world/ScrollWorldHero.test.jsx`
Expected: PASS — 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/scroll-world/ScrollWorldHero.jsx src/scroll-world/ScrollWorldHero.test.jsx
git commit -m "feat(scroll-world): mount ScrollWorldHero with canvas + overlay"
```

---

### Task 7: scroll-world CSS

**Files:**
- Create: `src/scroll-world/scrollWorld.css`

- [ ] **Step 1: Write the stylesheet**

```css
/* src/scroll-world/scrollWorld.css */

.hero-world {
  position: relative;
}

.hero-world-pin {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--canvas, #080b10);
}

.hero-world-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hero-world-overlay {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
}

.hero-world-overlay .hero-copy {
  max-width: 640px;
}

.hero-static {
  /* Re-uses existing .hero styling from landing.css */
}
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: pass (CSS is not checked by `node --check`, but the build will validate).

- [ ] **Step 3: Commit**

```bash
git add src/scroll-world/scrollWorld.css
git commit -m "feat(scroll-world): add scroll world hero styling"
```

---

### Task 8: Wire into landing

**Files:**
- Modify: `src/App.jsx` (replace blog-only shell so ScrollWorldHero mounts on the landing route)
- Modify: `index.html` (remove the static hero block at lines 67–122)

**Interfaces:**
- Consumes: `<ScrollWorldHero />` from `./scroll-world/ScrollWorldHero.jsx`
- Produces: landing route renders ScrollWorldHero; blog route unchanged

- [ ] **Step 1: Update App.jsx**

Replace the contents of `src/App.jsx` with:

```jsx
import { useEffect } from "react";
import ScrollWorldHero from "./scroll-world/ScrollWorldHero.jsx";
import "./react-shell.css";

function BlogPlaceholder() {
  return (
    <main className="blog-placeholder" aria-labelledby="blog-title">
      <div className="blog-placeholder-orbit" aria-hidden="true" />
      <p className="blog-kicker">BCHAT JOURNAL</p>
      <h1 id="blog-title">Conteúdo para conversas que importam.</h1>
      <p>
        O blog do BChat está sendo preparado. Em breve, você encontrará ideias,
        guias e novidades sobre atendimento, conhecimento e inteligência aplicada.
      </p>
      <a href="/" className="blog-back-link">Voltar para o BChat Copilot <span aria-hidden="true">↗</span></a>
    </main>
  );
}

export default function App() {
  const isBlogRoute = window.location.pathname.replace(/\/$/, "") === "/blog";

  useEffect(() => {
    document.body.classList.toggle("is-blog-route", isBlogRoute);
  }, [isBlogRoute]);

  if (isBlogRoute) return <BlogPlaceholder />;
  return <ScrollWorldHero />;
}
```

- [ ] **Step 2: Remove the static hero block from index.html**

Open `index.html`, locate lines 67–122 (the entire `<section class="hero" id="topo" aria-labelledby="hero-title">…</section>`), and delete that block. The next section (`<section class="proof-band"…` at line 123) becomes the next sibling. Leave a blank line where the section used to be so the file diff stays readable.

- [ ] **Step 3: Run check + tests**

Run: `npm run check`
Expected: pass.

Run: `npm test`
Expected: all scroll-world tests pass; existing tests still pass.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: success, no new warnings.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx index.html
git commit -m "feat(landing): mount ScrollWorldHero and remove static hero markup"
```

---

### Task 9: Final verification

**Files:** none modified

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS for `canvasUtils`, `useReducedMotion`, `useScrollProgress`, `createScene`, `ScrollWorldHero`, plus existing `leads.test.js`, `pricing.test.js`.

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: pass (vanilla `landing.js` unchanged).

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Manual smoke (optional)**

Run: `npm run dev`, open `http://localhost:5175/`, scroll slowly through the hero section. Confirm:
- Particles drift → cluster → connect to core → reveal product silhouette
- CTA "Solicitar demonstração" clicks through to `#contato`
- In DevTools, toggle `prefers-reduced-motion: reduce` and reload — canvas disappears, static copy remains
- Scroll past the hero — the rest of the page (proof-band, benefits, features, pricing, faq, final CTA) is untouched

- [ ] **Step 5: Commit any leftover artifacts (none expected)**

```bash
git status
```
Expected: clean working tree.

---

## Self-Review

**1. Spec coverage:**
- Hero replaced → Task 8 ✅
- 4 scenes, progress 0→1 → Task 3 (createScene maps SCENE_BOUNDS to draw) ✅
- GSAP ScrollTrigger → Task 5 (useScrollProgress) ✅
- Canvas2D → Tasks 1, 3, 6 ✅
- reduced-motion fallback → Tasks 4, 6 ✅
- IntersectionObserver pause → Task 6 ✅
- DPR cap → Task 1 ✅
- Resize debounce → Task 6 ✅
- Cleanup → Task 5 (revert), Task 6 (disconnect, cancelAnimationFrame) ✅
- Determinism via seeded RNG → Task 1 ✅
- Tests for hooks/factory → Tasks 1, 3, 4, 5, 6 ✅
- CTAs preserved with analytics attrs → Task 6 (kept in markup) ✅
- a11y (canvas aria-hidden, DOM overlay) → Task 6 (canvas aria-hidden="true"; copy + CTA in DOM) ✅

**2. Placeholder scan:** No "TBD", "TODO", "fill in later", or vague validation phrases. Every step shows exact code.

**3. Type/name consistency:** `useScrollProgress` is the hook name throughout (Tasks 5, 6). `createScene({ seed })` matches Task 3 and Task 6 usage. `progressRef.current` matches between Task 5 hook return and Task 6 component. `resizeCanvas` is imported from `./canvasUtils.js` everywhere (Tasks 1, 6).

Plan complete and saved to `docs/superpowers/plans/2026-08-09-scroll-world-hero.md`.

**Execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task with two-stage review between tasks
2. **Inline Execution** — execute tasks in this session, batch with checkpoints

Which approach?
