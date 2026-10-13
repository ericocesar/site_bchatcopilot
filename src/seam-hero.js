import { gsap } from "gsap";

// Hero entrance, "a costura": the brand's light line draws down, "BCHAT │ COPILOT" splits on it,
// the headline opens outward from the seam, and the light comes to rest on the Copilot node of
// the automation flow. Once per session; every element is visible by default, so reduced motion
// and returning visits get the final state. `seam-js-intro` is set pre-paint in index.html.

export const SEAM_STORAGE_KEY = "bchat-seam-entrance";

export function initSeamHero() {
  const root = document.documentElement;
  const hero = document.querySelector("[data-seam-hero]");
  if (!hero) {
    root.classList.remove("seam-js-intro");
    return () => {};
  }

  const header = document.querySelector("[data-header]");
  const axis = hero.querySelector("[data-seam-axis]");
  const line = hero.querySelector("[data-seam-line]");
  const core = hero.querySelector("[data-seam-core]");
  const wordmark = hero.querySelector("[data-seam-wordmark]");
  const [wordLeft, wordRight] = wordmark.children;
  const titleLeft = hero.querySelector('[data-seam-title="left"]');
  const titleRight = hero.querySelector('[data-seam-title="right"]');
  const reveals = [...hero.querySelectorAll("[data-seam-reveal]")];
  const copilot = hero.querySelector('[data-flow-node="copilot"]');
  const desktopQuery = window.matchMedia("(min-width: 900px)");
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let intro = null;
  let skipHandler = null;
  let resizeFrame = 0;
  let disposed = false;

  const centerY = (element) => {
    const a = axis.getBoundingClientRect();
    const r = element.getBoundingClientRect();
    return r.top + r.height / 2 - a.top;
  };
  const parkCore = () => {
    if (copilot?.offsetParent) gsap.set(core, { y: centerY(copilot), autoAlpha: 1 });
    else gsap.set(core, { autoAlpha: 0 });
  };
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { if (!intro?.isActive()) parkCore(); });
  };
  window.addEventListener("resize", onResize);

  const settle = () => {
    try { sessionStorage.setItem(SEAM_STORAGE_KEY, "1"); } catch { /* private mode: replay is harmless */ }
    parkCore();
    removeSkipListeners();
    hero.dispatchEvent(new CustomEvent("seam:settled"));
  };

  function removeSkipListeners() {
    if (!skipHandler) return;
    ["wheel", "keydown", "pointerdown", "touchstart"].forEach((type) => window.removeEventListener(type, skipHandler));
    skipHandler = null;
  }

  function showFinalState() {
    root.classList.remove("seam-js-intro");
    gsap.set(wordmark, { autoAlpha: 0 });
    gsap.set(line, { scaleY: 1 });
    settle();
  }

  function playEntrance() {
    const desktop = desktopQuery.matches;

    // GSAP takes over the hidden state from the pre-paint class.
    gsap.set(line, { scaleY: 0 });
    gsap.set([titleLeft, titleRight, header, ...reveals], { autoAlpha: 0 });
    gsap.set(core, { autoAlpha: 0, y: desktop ? centerY(titleLeft) : 0 });
    root.classList.remove("seam-js-intro");

    intro = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: settle });
    intro
      .to(line, { scaleY: 1, duration: 1.2, ease: "expo.inOut" }, 0)
      .to(core, { autoAlpha: desktop ? 1 : 0, duration: 0.5 }, 0.45)
      .fromTo(wordmark, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.3)
      .to(wordLeft, { x: desktop ? -26 : 0, y: desktop ? 0 : -10, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 1.25)
      .to(wordRight, { x: desktop ? 26 : 0, y: desktop ? 0 : -10, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 1.25)
      .set(wordmark, { autoAlpha: 0 }, 1.8)
      // The headline opens outward from the seam.
      .fromTo(titleLeft, { autoAlpha: 1, x: desktop ? 28 : 0, y: desktop ? 0 : 16, clipPath: desktop ? "inset(0% 0% 0% 100%)" : "inset(0% 0% 100% 0%)" }, { x: 0, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, clearProps: "transform,clipPath" }, 1.5)
      .fromTo(titleRight, { autoAlpha: 1, x: desktop ? -28 : 0, y: desktop ? 0 : 16, clipPath: desktop ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 100% 0%)" }, { x: 0, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, clearProps: "transform,clipPath" }, desktop ? 1.5 : 1.65)
      .fromTo(reveals, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.14, clearProps: "transform" }, 1.95)
      .fromTo(header, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.8, clearProps: "transform,opacity,visibility" }, 2.1);
    // The light travels down the seam and lands on the Copilot in the flow.
    if (desktop && copilot?.offsetParent) intro.to(core, { y: centerY(copilot), duration: 0.9, ease: "power3.inOut" }, 2.35);

    skipHandler = () => intro?.progress(1);
    ["wheel", "keydown", "pointerdown", "touchstart"].forEach((type) => window.addEventListener(type, skipHandler, { passive: true }));
  }

  const start = () => {
    if (disposed) return;
    const entrance = root.classList.contains("seam-js-intro") && !reducedQuery.matches;
    // Layout is final here (fonts settled, no entrance transforms yet): the flow layer measures now.
    hero.dispatchEvent(new CustomEvent("seam:ready", { detail: { entrance } }));
    if (entrance) playEntrance();
    else showFinalState();
  };
  // Wait for the display face so positions are measured on final metrics (bounded).
  Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 700))]).then(start);

  return () => {
    disposed = true;
    intro?.kill();
    removeSkipListeners();
    cancelAnimationFrame(resizeFrame);
    window.removeEventListener("resize", onResize);
    gsap.set([header, titleLeft, titleRight, ...reveals], { clearProps: "all" });
  };
}
