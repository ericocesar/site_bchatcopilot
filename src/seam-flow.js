// Hero image: an automation workflow crossing the Copilot on the seam. CSS grid places the
// nodes (responsive); this module measures them, draws right-angled connectors in the SVG and
// runs a teal pulse node to node, alternating two flows. Decorative: it pauses off-screen and
// stays static under reduced motion.

const SVG_NS = "http://www.w3.org/2000/svg";
const FLOWS = [
  ["message", "intent", "copilot", "search", "suggest", "sent"],
  ["message", "tag", "assign", "copilot", "crm", "sent"],
];
const SPEED = 240; // px per second
const PULSE = 26;

export function initSeamFlow() {
  const hero = document.querySelector("[data-seam-hero]");
  const stage = hero?.querySelector("[data-seam-flow]");
  if (!stage) return () => {};

  const svg = stage.querySelector("[data-flow-edges]");
  const nodes = Object.fromEntries([...stage.querySelectorAll("[data-flow-node]")].map((node) => [node.dataset.flowNode, node]));
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let edges = [];
  let frame = 0;
  let resizeFrame = 0;
  let visible = true;
  let running = false;
  let clock = { flow: 0, edge: 0, start: 0, waitUntil: 0 };

  // Measured from layout boxes (offset*), so entrance transforms never skew the connectors.
  const box = (node) => {
    let x = 0;
    let y = 0;
    for (let el = node; el && el !== stage; el = el.offsetParent) {
      x += el.offsetLeft;
      y += el.offsetTop;
    }
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
  };

  function route(fromId, toId) {
    const a = box(nodes[fromId]);
    const b = box(nodes[toId]);
    if (Math.abs(a.cy - b.cy) < 4) return a.cx < b.cx ? [[a.r, a.cy], [b.x, b.cy]] : [[a.x, a.cy], [b.r, b.cy]];
    if (Math.abs(a.cx - b.cx) < 4) return a.cy < b.cy ? [[a.cx, a.b], [b.cx, b.y]] : [[a.cx, a.y], [b.cx, b.b]];
    if (toId === "copilot") {
      const start = [a.cx, a.cy < b.cy ? a.b : a.y];
      return [start, [a.cx, b.cy], [a.cx < b.cx ? b.x : b.r, b.cy]];
    }
    if (fromId === "copilot") {
      const start = [a.cx < b.cx ? a.r : a.x, a.cy];
      return [start, [b.cx, a.cy], [b.cx, a.cy < b.cy ? b.y : b.b]];
    }
    // Generic elbow: leave vertically, arrive horizontally.
    return [[a.cx, a.cy < b.cy ? a.b : a.y], [a.cx, b.cy], [a.cx < b.cx ? b.x : b.r, b.cy]];
  }

  function pathFrom(points, radius = 12) {
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length; i += 1) {
      const [x, y] = points[i];
      const next = points[i + 1];
      if (!next) { d += ` L${x},${y}`; break; }
      const [px, py] = points[i - 1];
      const inLen = Math.hypot(x - px, y - py) || 1;
      const outLen = Math.hypot(next[0] - x, next[1] - y) || 1;
      const r = Math.min(radius, inLen / 2, outLen / 2);
      d += ` L${x - ((x - px) / inLen) * r},${y - ((y - py) / inLen) * r} Q${x},${y} ${x + ((next[0] - x) / outLen) * r},${y + ((next[1] - y) / outLen) * r}`;
    }
    return d;
  }

  function layout() {
    svg.replaceChildren();
    edges = [];
    svg.setAttribute("viewBox", `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
    const shown = (id) => nodes[id] && nodes[id].offsetParent !== null;
    const drawn = new Map();
    FLOWS.forEach((flow, flowIndex) => {
      const stops = flow.filter(shown);
      for (let i = 0; i < stops.length - 1; i += 1) {
        const key = `${stops[i]}>${stops[i + 1]}`;
        if (!drawn.has(key)) {
          const d = pathFrom(route(stops[i], stops[i + 1]));
          const base = document.createElementNS(SVG_NS, "path");
          base.setAttribute("d", d);
          base.setAttribute("class", "seam-flow__edge");
          const pulse = document.createElementNS(SVG_NS, "path");
          pulse.setAttribute("d", d);
          pulse.setAttribute("class", "seam-flow__pulse");
          svg.append(base, pulse);
          const length = base.getTotalLength();
          pulse.style.strokeDasharray = `${PULSE} ${length + PULSE}`;
          pulse.style.strokeDashoffset = String(PULSE);
          drawn.set(key, { from: nodes[stops[i]], to: nodes[stops[i + 1]], pulse, length });
        }
        edges.push({ ...drawn.get(key), flow: flowIndex });
      }
    });
  }

  function light(node) {
    node.classList.add("is-on");
    clearTimeout(node.seamTimer);
    node.seamTimer = setTimeout(() => node.classList.remove("is-on"), 1400);
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (!visible || !edges.length || now < clock.waitUntil) return;
    const list = edges.filter((edge) => edge.flow === clock.flow);
    if (!list.length) { clock.flow = (clock.flow + 1) % FLOWS.length; return; }
    const edge = list[clock.edge];
    if (!clock.start) { clock.start = now; light(edge.from); }
    const duration = Math.max(520, (edge.length / SPEED) * 1000);
    const t = Math.min(1, (now - clock.start) / duration);
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    edge.pulse.style.strokeDashoffset = String(PULSE - eased * (edge.length + PULSE));
    if (t < 1) return;
    edge.pulse.style.strokeDashoffset = String(PULSE);
    light(edge.to);
    clock.start = 0;
    clock.edge += 1;
    if (clock.edge >= list.length) clock = { flow: (clock.flow + 1) % FLOWS.length, edge: 0, start: 0, waitUntil: now + 1500 };
    else clock.waitUntil = now + 220;
  }

  const startPulses = () => {
    if (running || reducedQuery.matches) return;
    running = true;
    frame = requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.1 });
  observer.observe(stage);

  const onReady = () => layout();
  const onSettled = () => { layout(); startPulses(); };
  hero.addEventListener("seam:ready", onReady);
  hero.addEventListener("seam:settled", onSettled);

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      clock = { flow: clock.flow, edge: 0, start: 0, waitUntil: performance.now() + 300 };
      layout();
    });
  });
  resizeObserver.observe(stage);

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resizeFrame);
    observer.disconnect();
    resizeObserver.disconnect();
    hero.removeEventListener("seam:ready", onReady);
    hero.removeEventListener("seam:settled", onSettled);
    Object.values(nodes).forEach((node) => clearTimeout(node.seamTimer));
    svg.replaceChildren();
  };
}
