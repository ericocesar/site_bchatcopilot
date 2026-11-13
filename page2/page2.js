/* page2 · scroll-trigger choreography
 * GSAP + ScrollTrigger. Three pinned acts. Respects prefers-reduced-motion.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  // No pinning, no scroll-driven tweens — keep markup in its resting state.
  document.querySelectorAll(".p2-act").forEach((act) => {
    act.style.minHeight = "auto";
  });
} else {
  initAct01Ativar();
  initAct02Conectar();
  initAct03Decidir();
}

/* ════ ATO 01 · ATIVAR ═══════════════════════════════════════════════ */
function initAct01Ativar() {
  const section = document.querySelector(".p2-act--ativar");
  if (!section) return;

  const eyebrow = section.querySelector(".p2-eyebrow");
  const titleLines = section.querySelectorAll(".p2-line > span");
  const sub = section.querySelector(".p2-sub");
  const marquee = section.querySelector(".p2-marquee");
  const orbRings = section.querySelectorAll(".p2-orb__ring");
  const orbCore = section.querySelector(".p2-orb__core");

  // Set initial states (above-fold: small offset, no scroll budget yet).
  gsap.set([eyebrow, sub, marquee], { y: 18, opacity: 0 });
  gsap.set(titleLines, { yPercent: 110, opacity: 0 });
  gsap.set(orbRings, { scale: 0.85, opacity: 0 });
  gsap.set(orbCore, { scale: 0.6, opacity: 0 });

  // Above-the-fold intro — runs once on load.
  const introTl = gsap.timeline({ delay: 0.15 });
  introTl
    .to(eyebrow, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" })
    .to(
      titleLines,
      { yPercent: 0, opacity: 1, duration: 0.95, ease: "power4.out", stagger: 0.08 },
      "<0.1",
    )
    .to(sub, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "<0.25")
    .to(marquee, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "<0.15")
    .to(
      orbRings,
      { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out", stagger: 0.08 },
      "<-0.6",
    )
    .to(orbCore, { scale: 1, opacity: 1, duration: 1.1, ease: "power2.out" }, "<-0.8");

  // Pinned scroll budget — drives the title forward, the orb breathes back.
  const scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=200%",
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  scrollTl
    .to(
      titleLines,
      { yPercent: -18, scale: 0.94, opacity: 0.55, ease: "none" },
      0,
    )
    .to([sub, marquee], { y: -28, opacity: 0, ease: "none" }, 0)
    .to(eyebrow, { y: -14, opacity: 0.3, ease: "none" }, 0)
    .to(
      orbRings,
      { scale: 1.18, opacity: 0.55, ease: "none", stagger: 0.04 },
      0,
    )
    .to(orbCore, { scale: 1.4, opacity: 0.8, ease: "none" }, 0);
}

/* ════ ATO 02 · CONECTAR ═════════════════════════════════════════════ */
function initAct02Conectar() {
  const section = document.querySelector(".p2-act--conectar");
  if (!section) return;

  const pillars = gsap.utils.toArray(section.querySelectorAll(".p2-pillar"));
  const head = section.querySelector(".p2-pillars-head");

  // Initial state: pillars off-screen staggered.
  gsap.set(head, { y: 22, opacity: 0 });
  gsap.set(pillars, (i) => {
    const offsets = [-220, 220, -160];
    return {
      x: offsets[i] ?? 0,
      y: i === 2 ? 60 : 0,
      rotateY: i === 0 ? 14 : i === 1 ? -14 : 8,
      opacity: 0,
    };
  });

  // Head reveal on entry.
  ScrollTrigger.create({
    trigger: section,
    start: "top 75%",
    once: true,
    onEnter: () =>
      gsap.to(head, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out" }),
  });

  // Pinned scroll budget: pillars converge into a horizontal row,
  // lines draw as they settle.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=200%",
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  tl.to(pillars, {
    x: 0,
    y: 0,
    rotateY: 0,
    opacity: 1,
    ease: "none",
    stagger: { each: 0.06, from: "center" },
  });

  pillars.forEach((pillar, i) => {
    const line = pillar.querySelector(".p2-pillar__line");
    gsap.set(line, { scaleX: 0 });
    tl.to(
      line,
      { scaleX: 1, duration: 0.18, ease: "power2.out" },
      0.55 + i * 0.05,
    );
  });

  // Final convergence squeeze — pillars compress inward as scene exits.
  tl.to(
    pillars,
    {
      x: (i) => (i - 1) * -16,
      scale: 0.96,
      ease: "none",
    },
    0.85,
  );
}

/* ════ ATO 03 · DECIDIR ══════════════════════════════════════════════ */
function initAct03Decidir() {
  const section = document.querySelector(".p2-act--decidir");
  if (!section) return;

  const head = section.querySelector(".p2-steps-head");
  const steps = gsap.utils.toArray(section.querySelectorAll(".p2-step"));

  gsap.set(head, { y: 22, opacity: 0 });
  gsap.set(steps, { y: 32, opacity: 0 });
  gsap.set(steps.map((s) => s.querySelector(".p2-step__fill")), { scaleX: 0 });

  ScrollTrigger.create({
    trigger: section,
    start: "top 80%",
    once: true,
    onEnter: () =>
      gsap.to(head, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }),
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=240%",
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  // Each step rises into view, then its rail fills.
  steps.forEach((step, i) => {
    const fill = step.querySelector(".p2-step__fill");
    tl.to(
      step,
      { y: 0, opacity: 1, duration: 0.16, ease: "power2.out" },
      0.05 + i * 0.18,
    );
    tl.to(
      fill,
      { scaleX: 1, duration: 0.14, ease: "power2.out" },
      0.05 + i * 0.18 + 0.14,
    );
  });

  // Counter tick — each step's number rolls from 0N to its final value.
  steps.forEach((step, i) => {
    const counter = step.querySelector("[data-p2-counter]");
    const final = String(i + 1).padStart(2, "0");
    const state = { n: 0 };
    tl.to(
      state,
      {
        n: i + 1,
        duration: 0.18,
        ease: "power2.out",
        onUpdate: () => {
          counter.textContent = String(Math.round(state.n)).padStart(2, "0");
        },
      },
      0.05 + i * 0.18,
    );
  });
}