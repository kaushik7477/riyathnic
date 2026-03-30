import React, { useEffect, useRef } from 'react';

// Animation constants
const FIRST_TICK_MS = 1000;
const TICK_MS = 4000;
const IN_OUT_GAP_MS = 150;

const ROTATORS = new WeakMap();

const TextRotatorSection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    function parseOptions(rotatorEl: HTMLElement) {
      try {
        const parsed = JSON.parse(rotatorEl.dataset.rotatorOptions || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function initRotator(rotatorEl: HTMLElement) {
      const options = parseOptions(rotatorEl);
      if (options.length < 2) return;

      const frontEl = rotatorEl.querySelector("[data-rotator-text]") as HTMLElement;
      if (!frontEl) return;

      if (rotatorEl.querySelector("[data-rotator-text]:nth-child(2)")) return;

      const backEl = frontEl.cloneNode(true) as HTMLElement;
      backEl.textContent = "";
      rotatorEl.appendChild(backEl);
      backEl.classList.toggle("is-hidden", true);

      const staggerMs = Number(rotatorEl.dataset.rotatorDelay) || 0;

      const runtime = {
        index: 0,
        options,
        frontEl,
        backEl,
        staggerMs
      };

      ROTATORS.set(rotatorEl, {
        loopTimerId: null,
        phaseTimerIds: [],
        runId: 0,
        runtime
      });
    }

    function setHidden(el: HTMLElement, on: boolean) {
      el.classList.toggle("is-hidden", on);
    }

    function animateIn(el: HTMLElement) {
      el.classList.remove("mask-out");
      void el.offsetWidth;
      el.classList.add("mask-in");
    }

    function animateOut(el: HTMLElement) {
      el.classList.remove("mask-in");
      void el.offsetWidth;
      el.classList.add("mask-out");
    }

    function scheduleTick(rotatorEl: HTMLElement, waitMs: number) {
      const state = ROTATORS.get(rotatorEl);
      if (!state) return;

      const { runtime } = state;
      const { options, staggerMs } = runtime;
      // Note: We use the mutable state from the WeakMap entry to get the latest front/back
      // runtime object itself is stable, but we mutate its properties
      
      const nextIndex = (runtime.index + 1) % options.length;
      const nextWord = options[nextIndex];
      if (!nextWord) return;

      const runId = state.runId;

      const loopTimerId = setTimeout(() => {
        const run = () => {
             const cur = ROTATORS.get(rotatorEl);
             if (!cur || cur.loopTimerId !== loopTimerId || cur.runId !== runId) return;

             const currentFront = cur.runtime.frontEl;
             const currentBack = cur.runtime.backEl;

             setHidden(currentBack, true);
             currentBack.textContent = nextWord;

             cur.phaseTimerIds.forEach((id: any) => clearTimeout(id));
             cur.phaseTimerIds.length = 0;

             const outTimerId = setTimeout(() => {
               if (cur.runId !== runId) return;
               animateOut(currentFront);
             }, staggerMs);

             const inTimerId = setTimeout(() => {
               if (cur.runId !== runId) return;
               setHidden(currentBack, false);
               animateIn(currentBack);
             }, staggerMs + IN_OUT_GAP_MS);

             cur.phaseTimerIds.push(outTimerId, inTimerId);

             // Swap
             cur.runtime.index = nextIndex;
             cur.runtime.frontEl = currentBack;
             cur.runtime.backEl = currentFront;

             scheduleTick(rotatorEl, TICK_MS);
        };

        if (document.hidden) {
            const onVis = () => {
                if(document.hidden) return;
                document.removeEventListener("visibilitychange", onVis);
                run();
            };
            document.addEventListener("visibilitychange", onVis);
        } else {
            run();
        }

      }, waitMs);

      state.loopTimerId = loopTimerId;
    }

    function startRotator(rotatorEl: HTMLElement) {
      const state = ROTATORS.get(rotatorEl);
      if (!state) return;
      if (state.loopTimerId) return;

      state.runId += 1;
      scheduleTick(rotatorEl, FIRST_TICK_MS);
    }

    function stopRotator(rotatorEl: HTMLElement) {
      const state = ROTATORS.get(rotatorEl);
      if (!state) return;

      state.runId += 1;
      if (state.loopTimerId) clearTimeout(state.loopTimerId);
      state.loopTimerId = null;
      state.phaseTimerIds.forEach((id: any) => clearTimeout(id));
      state.phaseTimerIds.length = 0;

      const { frontEl, backEl } = state.runtime;
      frontEl.classList.remove("mask-in", "mask-out", "is-hidden");
      backEl.classList.remove("mask-in", "mask-out");
      setHidden(backEl, true);
    }

    const rotators = containerRef.current.querySelectorAll("[data-rotator]");
    rotators.forEach(el => initRotator(el as HTMLElement));

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target as HTMLElement;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                startRotator(el);
            } else {
                stopRotator(el);
            }
        });
    }, { threshold: 0.5 });

    rotators.forEach(el => io.observe(el));

    return () => {
        io.disconnect();
        rotators.forEach(el => stopRotator(el as HTMLElement));
    };
  }, []);

  return (
    <section 
        ref={containerRef}
        className="flex flex-col justify-center py-[6vh] px-[6vw] bg-white text-gold overflow-hidden"
        style={{ fontFamily: '"Noto Sans", sans-serif' }}
    >
      {/* <span className="inline-flex items-center gap-[0.75em] mb-4 text-xs font-mono tracking-widest uppercase opacity-70">
        <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
        Soul stich
      </span> */}

      <h1 
        className="m-0 text-[clamp(2rem,12vw,8rem)] leading-none font-normal tracking-[-0.02em]"
        style={{ fontFamily: '"Lora", serif', textShadow: '0 0 30px rgba(255, 191, 0, 0.4)' }}
      >
        <span className="sr-only">Move Style & Soul</span>
        <div aria-hidden="true">
          Riyathnic in {' '}
          <span 
            data-rotator 
            data-rotator-options='["Style", "Quality", "Trends", "Comfort", "Design", "Art"]'
            className="inline-grid align-bottom whitespace-nowrap"
            style={{ gridTemplateAreas: '"stack"' }}
          >
            <span 
                data-rotator-text 
                className="will-change-[transform,clip-path,opacity] text-pink"
                style={{ gridArea: 'stack' }}
            >
                Style
            </span>
          </span>
        </div>
        <div aria-hidden="true">
          &{' '}
          <span 
            data-rotator 
            data-rotator-delay="200" 
            data-rotator-options='["Trends", "Comfort" ,"Art" ,"Style", "Print", "Quality"]'
            className="inline-grid align-bottom whitespace-nowrap"
            style={{ gridTemplateAreas: '"stack"' }}
          >
            <span 
                data-rotator-text 
                className="will-change-[transform,clip-path,opacity] text-pink"
                style={{ gridArea: 'stack' }}
            >
                Vibe
            </span>
          </span>
        </div>
      </h1>
    </section>
  );
};

export default TextRotatorSection;
