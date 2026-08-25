import * as React from "react";
import { useEffect, useRef } from "react";
import { ArrowRight, ArrowUp, ArrowUpRight, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./motion-footer.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MagneticButton = React.forwardRef(function MagneticButton(
  { as: Component = "a", className = "", children, ...props },
  forwardedRef,
) {
  const localRef = useRef(null);

  useEffect(() => {
    const element = localRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const context = gsap.context(() => {
      const handleMouseMove = (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        gsap.to(element, {
          x: x * 0.18,
          y: y * 0.18,
          rotationX: -y * 0.05,
          rotationY: x * 0.05,
          scale: 1.03,
          duration: 0.35,
          ease: "power2.out",
          overwrite: true,
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.35)",
          overwrite: true,
        });
      };

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, element);

    return () => context.revert();
  }, []);

  const setRef = (node) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <Component ref={setRef} className={`cinematic-footer-pill ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
});

MagneticButton.displayName = "MagneticButton";

function MarqueeItem() {
  return (
    <span className="cinematic-footer-marquee-item">
      <span>Contexto conectado</span>
      <Sparkles aria-hidden="true" />
      <span>Respostas com fonte</span>
      <Sparkles aria-hidden="true" />
      <span>Humano no controle</span>
      <Sparkles aria-hidden="true" />
      <span>Atendimento que evolui</span>
      <Sparkles aria-hidden="true" />
      <span>Privacidade por padrão</span>
      <Sparkles aria-hidden="true" />
    </span>
  );
}

export function CinematicFooter() {
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      gsap.set([giantTextRef.current, headingRef.current, linksRef.current], { opacity: 1, y: 0, scale: 1 });
      return undefined;
    }

    let context = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || context) return;
        context = gsap.context(() => {
          gsap.fromTo(
            giantTextRef.current,
            { y: "18vh", scale: 0.75, opacity: 0 },
            {
              y: "-9vh",
              scale: 1.6,
              opacity: 1,
              ease: "power1.out",
              scrollTrigger: {
                trigger: wrapper,
                start: "top 100%",
                end: "bottom bottom",
                scrub: 1,
              },
            },
          );

          gsap.fromTo(
            [headingRef.current, linksRef.current],
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.15,
              ease: "power3.out",
              scrollTrigger: {
                trigger: wrapper,
                start: "top 72%",
                end: "bottom bottom",
                scrub: 1,
              },
            },
          );

          const primary = wrapper.querySelector(".cinematic-footer-primary");
          if (primary) {
            gsap.fromTo(
              primary,
              { y: -6 },
              {
                y: 0,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: wrapper,
                  start: "top 72%",
                  end: "bottom bottom",
                  scrub: 1,
                },
              },
            );
          }
        }, wrapper);

        observer.disconnect();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      context?.revert();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={wrapperRef} className="cinematic-footer-wrapper">
      <footer className="cinematic-footer" aria-labelledby="cinematic-footer-title">
        <div className="cinematic-footer-grid" aria-hidden="true" />
        <div className="cinematic-footer-giant-text" ref={giantTextRef} aria-hidden="true">
          BCHAT
        </div>

        <div className="cinematic-footer-marquee" aria-hidden="true">
          <div className="cinematic-footer-marquee-track">
            <MarqueeItem />
            <MarqueeItem />
          </div>
        </div>

        <div className="cinematic-footer-content">
          <p className="cinematic-footer-kicker">
            <span /> O próximo passo
          </p>
          <h2 id="cinematic-footer-title" ref={headingRef}>
            Responda com mais <em>contexto.</em>
          </h2>

          <div className="cinematic-footer-links" ref={linksRef}>
            <div className="cinematic-footer-primary-links">
              <MagneticButton
                href="#contato"
                className="cinematic-footer-primary"
                data-analytics="landing_primary_cta_click"
                data-placement="footer"
              >
                <ShieldCheck aria-hidden="true" />
                Solicitar demonstração
                <ArrowUpRight aria-hidden="true" />
              </MagneticButton>
              <MagneticButton href="#funcionalidades" className="cinematic-footer-primary cinematic-footer-secondary">
                <Sparkles aria-hidden="true" />
                Conhecer o Copilot
                <ArrowRight aria-hidden="true" />
              </MagneticButton>
            </div>

            <nav className="cinematic-footer-secondary-links" aria-label="Links do rodapé">
              <MagneticButton href="#beneficios">Benefícios</MagneticButton>
              <MagneticButton href="#como-funciona">Como funciona</MagneticButton>
              <MagneticButton href="#planos">Planos</MagneticButton>
              <MagneticButton href="#faq">FAQ</MagneticButton>
            </nav>
          </div>
        </div>

        <div className="cinematic-footer-bottom">
          <p>© 2026 BChat. Todos os direitos reservados.</p>
          <p className="cinematic-footer-made-with">
            Feito para conversas que importam <Heart aria-hidden="true" />
          </p>
          <MagneticButton
            as="button"
            type="button"
            onClick={scrollToTop}
            className="cinematic-footer-top"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <ArrowUp aria-hidden="true" />
          </MagneticButton>
        </div>
      </footer>
    </div>
  );
}