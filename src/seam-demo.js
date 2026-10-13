import { gsap } from "gsap";

// "Como funciona": one conversation in four movements. The message arrives, the Copilot writes
// in the margin (summary, source, suggestion) and the person decides. Plays once when the
// section comes into view; the final state is the default for reduced motion and without JS.

const replies = {
  usar: {
    meta: "usou a sugestão",
    text: "Oi, Marina! Recebemos seus documentos. Para concluir, falta o comprovante de endereço (até 90 dias). Pode enviar por aqui?",
  },
  editar: {
    meta: "editou a sugestão",
    text: "Oi, Marina! Recebemos seus documentos, obrigada pela paciência. Para concluir, só falta o comprovante de endereço dos últimos 90 dias. Pode enviar por aqui mesmo.",
  },
  outro: {
    meta: "transferiu para Cadastro",
    text: "Conversa transferida para a equipe de Cadastro, com o resumo e a fonte anexados.",
    handoff: true,
  },
};

export function initSeamDemo() {
  const demo = document.querySelector("[data-seam-demo]");
  if (!demo) return () => {};

  const axis = demo.querySelector("[data-seam-axis]");
  const core = demo.querySelector("[data-seam-core]");
  const rows = [...demo.querySelectorAll("[data-seam-row]")];
  const caption = demo.querySelector(".seam-thread__caption");
  const reply = demo.querySelector("[data-seam-reply]");
  const replyMeta = demo.querySelector("[data-seam-reply-meta]");
  const replyText = demo.querySelector("[data-seam-reply-text]");
  const choices = [...demo.querySelectorAll("[data-seam-choice]")];
  const desktopQuery = window.matchMedia("(min-width: 900px)");
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let timeline = null;
  let observer = null;
  let resizeFrame = 0;

  const parts = (row) => ({
    msg: row.querySelector("[data-seam-msg]"),
    node: row.querySelector(".seam-node"),
    note: row.querySelector("[data-seam-note]"),
  });

  function setChoice(key, { animate = true } = {}) {
    choices.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.seamChoice === key)));
    if (!key) return;
    const next = replies[key];
    replyMeta.textContent = next.meta;
    replyText.textContent = next.text;
    reply.classList.toggle("is-handoff", Boolean(next.handoff));
    if (animate && !reducedQuery.matches) {
      reply.classList.remove("is-swapping");
      void reply.offsetWidth;
      reply.classList.add("is-swapping");
    }
  }
  const onChoice = (event) => {
    timeline?.progress(1);
    observer?.disconnect();
    setChoice(event.currentTarget.dataset.seamChoice);
  };
  choices.forEach((button) => button.addEventListener("click", onChoice));

  const centerY = (element) => {
    const a = axis.getBoundingClientRect();
    const r = element.getBoundingClientRect();
    return r.top + r.height / 2 - a.top;
  };
  const parkCore = () => gsap.set(core, { y: centerY(parts(rows.at(-1)).node), autoAlpha: 1 });
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { if (!timeline?.isActive()) parkCore(); });
  };
  window.addEventListener("resize", onResize);

  function build() {
    const desktop = desktopQuery.matches;
    const elements = rows.flatMap((row) => [parts(row).msg, parts(row).note]);
    gsap.set([...elements, caption], { autoAlpha: 0 });
    gsap.set(core, { autoAlpha: 1, y: 0 });
    rows.forEach((row) => row.classList.remove("is-lit"));

    timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: parkCore });
    let at = 0;
    rows.forEach((row, index) => {
      const { msg, node, note } = parts(row);
      const travel = index === 0 ? 0.7 : 0.55;
      timeline.to(core, { y: () => centerY(node), duration: travel, ease: "power3.inOut" }, at);
      const lit = at + travel - 0.04;
      timeline.call(() => row.classList.add("is-lit"), null, lit);

      if (!row.matches(".seam-row--decision")) {
        timeline
          .fromTo(msg, { autoAlpha: 0, x: desktop ? 18 : 0, y: desktop ? 0 : 10 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.7, clearProps: "transform" }, lit - 0.04)
          .fromTo(note, { autoAlpha: 1, clipPath: desktop ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.out", clearProps: "clipPath" }, lit + 0.1);
        at = lit + 0.5;
      } else {
        // The suggestion arrives first; the person decides; only then does a reply exist.
        timeline
          .call(() => setChoice(null), null, lit - 0.05)
          .fromTo(note, { autoAlpha: 0, x: desktop ? -18 : 0, y: desktop ? 0 : 10 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, clearProps: "transform" }, lit)
          .call(() => setChoice("editar", { animate: false }), null, lit + 1)
          .fromTo(msg, { autoAlpha: 0, x: desktop ? 18 : 0, y: desktop ? 0 : 10 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.75, clearProps: "transform" }, lit + 1.15)
          .fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, clearProps: "opacity,visibility" }, lit + 1.5);
      }
    });

    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      timeline.play();
    }, { threshold: 0.35 });
    observer.observe(demo);
  }

  // A visitor who lands below the section (anchor, reload) sees the final state, not a replay.
  const alreadyPast = demo.getBoundingClientRect().bottom < 0;
  if (reducedQuery.matches || alreadyPast) {
    rows.forEach((row) => row.classList.add("is-lit"));
    parkCore();
  } else {
    build();
  }

  return () => {
    timeline?.kill();
    observer?.disconnect();
    cancelAnimationFrame(resizeFrame);
    window.removeEventListener("resize", onResize);
    choices.forEach((button) => button.removeEventListener("click", onChoice));
    gsap.set([...rows.flatMap((row) => [parts(row).msg, parts(row).note]), caption, core], { clearProps: "all" });
  };
}
