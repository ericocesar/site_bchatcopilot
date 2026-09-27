import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// A quiet, locally synthesized cinematic bed. No download, autoplay, or audio tracker.
function createIntroSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const sources = [55, 82.41, 110.15].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = [0.28, 0.09, 0.045][index];
    oscillator.connect(gain).connect(master);
    oscillator.start();
    return oscillator;
  });

  const noise = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  const air = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const airGain = context.createGain();
  air.buffer = noise;
  air.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 380;
  filter.Q.value = 0.65;
  airGain.gain.value = 0.055;
  air.connect(filter).connect(airGain).connect(master);
  air.start();
  sources.push(air);

  return {
    async resume() { await context.resume(); },
    update(progress, audible) {
      const time = context.currentTime;
      master.gain.setTargetAtTime(audible ? 0.24 * (1 - progress) : 0, time, 0.18);
      filter.frequency.setTargetAtTime(380 + progress * 1600, time, 0.12);
    },
    dispose() {
      sources.forEach((source) => source.stop());
      void context.close().catch(() => {});
    },
  };
}

export function initCopilotIntro() {
  const intro = document.querySelector("[data-copilot-intro]");
  if (!intro || window.location.pathname !== "/") {
    if (intro) intro.hidden = true;
    return () => {};
  }
  const stage = intro.querySelector("[data-intro-stage]");
  const scene = intro.querySelector("[data-intro-scene]");
  const light = intro.querySelector("[data-intro-light]");
  const title = intro.querySelector("[data-intro-title]");
  const wordmark = intro.querySelector("[data-intro-wordmark]");
  const controls = intro.querySelector("[data-intro-controls]");
  const soundButton = intro.querySelector("[data-intro-sound]");
  const soundLabel = intro.querySelector("[data-intro-sound-label]");
  const header = document.querySelector("[data-header]");
  const hero = document.querySelector("[data-robot-hero]");
  const links = intro.querySelectorAll("[data-intro-enter]");
  const skipLink = document.querySelector(".skip-link");
  const media = gsap.matchMedia();
  let sound;
  let soundEnabled = false;
  let disposed = false;
  let progress = 0;
  let transition;

  const syncSound = () => sound?.update(progress, soundEnabled && !document.hidden && progress < 1);
  const syncAccess = (value) => {
    progress = value;
    const covered = progress < 0.88;
    header.inert = covered;
    hero.inert = covered;
    intro.inert = !covered;
    syncSound();
  };

  const toggleSound = async () => {
    soundButton.disabled = true;
    try {
      sound ||= createIntroSound();
      if (!sound) throw new Error("Audio unavailable");
      await sound.resume();
      if (disposed) return;
      soundEnabled = !soundEnabled;
      soundButton.setAttribute("aria-pressed", String(soundEnabled));
      soundLabel.textContent = soundEnabled ? "Silenciar" : "Ativar som";
      syncSound();
    } catch {
      sound?.dispose();
      sound = null;
      soundEnabled = false;
      soundButton.setAttribute("aria-pressed", "false");
      soundLabel.textContent = "Som indisponível";
    } finally {
      soundButton.disabled = false;
    }
  };

  media.add({ motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
    const arrival = conditions.motion ? gsap.timeline()
      .fromTo(light, { opacity: 0, scaleY: 0.65 }, { opacity: 1, scaleY: 1, duration: 2.4, ease: "power2.out" })
      .fromTo(wordmark, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 2, ease: "power2.out" }, 0.65)
      : null;

    if (conditions.motion) {
      intro.classList.add("is-enhanced");
      transition = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "copilot-opening",
          trigger: intro,
          pin: stage,
          pinSpacing: false,
          start: "top top",
          end: "bottom top",
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate: (self) => syncAccess(self.progress),
          onRefresh: (self) => syncAccess(self.progress),
        },
      });
      transition
        .to(scene, { scale: 1.3, duration: 1 }, 0)
        .to(title, { opacity: 0, scale: 1.1, y: -25, duration: 0.4 }, 0.08)
        .to(controls, { autoAlpha: 0, duration: 0.2 }, 0)
        .to(scene, { opacity: 0, duration: 0.5 }, 0.5)
        .to(stage, { backgroundColor: "rgba(3,3,3,0)", autoAlpha: 0, duration: 0.5 }, 0.5)
        .fromTo(header, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16 }, 0.84);
    } else {
      // Normal document scrolling, with no pinned scene or camera movement.
      transition = ScrollTrigger.create({
        trigger: intro,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => syncAccess(self.progress),
        onRefresh: (self) => syncAccess(self.progress),
      });
    }

    return () => {
      arrival?.kill();
      transition = null;
      intro.classList.remove("is-enhanced");
      intro.inert = false;
      header.inert = false;
      hero.inert = false;
    };
  });

  const enter = (event) => {
    event?.preventDefault();
    // Keyboard and skip navigation bypass the sequence and focus the real content.
    const destination = intro.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: destination, behavior: "instant" });
    syncAccess(1);
    if (transition?.scrollTrigger) transition.progress(1);
    const heading = hero.querySelector("h1");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  };
  const enterFromHash = () => {
    if (window.location.hash === "#topo" || window.location.hash === "#conteudo") enter();
  };

  if (window.AudioContext || window.webkitAudioContext) soundButton.hidden = false;
  soundButton.addEventListener("click", toggleSound);
  links.forEach((link) => link.addEventListener("click", enter));
  skipLink?.addEventListener("click", enter);
  window.addEventListener("hashchange", enterFromHash);
  document.addEventListener("visibilitychange", syncSound);
  document.fonts.ready.then(() => {
    if (disposed) return;
    ScrollTrigger.refresh();
    enterFromHash();
  });

  return () => {
    disposed = true;
    media.revert();
    sound?.dispose();
    soundButton.removeEventListener("click", toggleSound);
    links.forEach((link) => link.removeEventListener("click", enter));
    skipLink?.removeEventListener("click", enter);
    window.removeEventListener("hashchange", enterFromHash);
    document.removeEventListener("visibilitychange", syncSound);
    soundButton.hidden = true;
  };
}
