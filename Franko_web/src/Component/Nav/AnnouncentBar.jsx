"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* ────────────────────────────────────────────────────────────
   Franko · Speed Shopping 2 announcement bar  (GSAP)

   npm i gsap @gsap/react

   Palette (from the promo poster)
   red #BB1420 / #A80F1B · yellow #FFD400 · blue #0F2A7A
   green #0E8A43 · cyan #4FD8F5

   Layout
   < lg   two rows:  [ promo message ]
                     [ countdown ............ call · WhatsApp ]
   ≥ lg   one row:   [ promo message | countdown | contact ]
   Side padding: 6px on phones, 8px from lg up.
   ──────────────────────────────────────────────────────────── */

/* ── Promo timing. Ghana is on GMT all year, so "Z" = Accra time.
      Change the start time here if the sale opens later than midnight. ── */
const PROMO_START = Date.parse("2026-10-02T00:00:00Z");
const PROMO_END = PROMO_START + 24 * 60 * 60 * 1000; // "24 hours only"

const SLIDE_SECONDS = 4.5;

/* Copy variants, picked with CSS so nothing needs measuring:
   `tiny`  → phones (< md)                  falls back to `short`, then `full`
   `full`  → tablets (md) and 2xl screens
   `short` → laptops (lg – xl)              falls back to `full`           */
const SLIDES = [
  {
    id: "launch",
    icon: "zap",
    badge: "Speed Shopping 2",
    tone: "yellow",
    full: [
      { t: "GHANA, GET READY! ", hl: true },
      { t: "The 2nd Edition of Franko Speed Shopping is here!" },
    ],
    short: [
      { t: "GHANA, GET READY! ", hl: true },
      { t: "Speed Shopping 2 is here!" },
    ],
  },
  {
    id: "sale",
    icon: "percent",
    badge: "Big sale",
    tone: "blue",
    full: [
      { t: "GET UP TO " },
      { count: 40, hl: true },
      { t: "% OFF", hl: true },
      { t: " selected items  " },
      { t: "24 HOURS ONLY!", hl: true },
    ],
    short: [
      { t: "UP TO " },
      { count: 40, hl: true },
      { t: "% OFF", hl: true },
      { t: " selected items · " },
      { t: "24 HRS ONLY!", hl: true },
    ],
  },
  {
    id: "date",
    icon: "calendar",
    badge: "Save the date",
    tone: "white",
    full: [{ t: "FRIDAY, 2ND OCT. 2026", hl: true }],
  },
  {
    // Stand-alone message
    id: "branches",
    icon: "pin",
    badge: "Nationwide",
    tone: "yellow",
    full: [
      { t: "AVAILABLE ACROSS ALL " },
      { t: "FRANKO BRANCHES", hl: true },
    ],
  },
  {
    id: "delivery",
    icon: "truck",
    badge: "Shop online",
    tone: "green",
    full: [
      { t: "FREE DELIVERY", hl: true },
      { t: " on online orders in Accra & Kumasi" },
    ],
    tiny: [
      { t: "FREE DELIVERY", hl: true },
      { t: " online · Accra & Kumasi" },
    ],
  },
];

const TONE = {
  yellow: "bg-[#FFD400] text-[#0F2A7A]",
  blue: "bg-[#0F2A7A] text-[#FFD400]",
  white: "bg-white text-[#B3121C]",
  green: "bg-[#0E8A43] text-white",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
.fk-root{font-family:'Nunito',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.fk-bg{background:linear-gradient(90deg,#A80F1B 0%,#BB1420 50%,#A80F1B 100%)}

/* ── 3D extruded text ──
   Stepped, same-color layers build a solid "slab" of depth beneath the
   glyph, finished with a soft contact shadow so it lifts off the red bar.
   text-shadow inherits, so [data-hl] words (rendered in yellow) get their
   own warmer, brassier extrusion instead of the default crimson one. */
.fk-text{
  text-shadow:
    1px 1px 0 #8a0e19,
    2px 2px 0 #8a0e19,
    3px 3px 0 #700b14,
    4px 4px 0 #700b14,
    5px 5px 0 #5c0910,
    0 6px 8px rgba(0,0,0,.45);
}
.fk-text [data-hl]{
  text-shadow:
    1px 1px 0 #a97405,
    2px 2px 0 #a97405,
    3px 3px 0 #8a5f04,
    4px 4px 0 #8a5f04,
    5px 5px 0 #6e4c03,
    0 6px 8px rgba(0,0,0,.5);
}
`;

/* ─────────────────────────── helpers ─────────────────────────── */

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pad = (n) => String(n).padStart(2, "0");

const getPhase = (now) =>
  now < PROMO_START ? "before" : now < PROMO_END ? "live" : "ended";

/* Only changes state when the phase flips, so the bar doesn't re-render every second. */
const usePromoPhase = () => {
  const [phase, setPhase] = useState("before");
  useEffect(() => {
    const tick = () => setPhase(getPhase(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return phase;
};

const useCountdown = () => {
  const [now, setNow] = useState(null); // null until mounted → no SSR mismatch
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return {
      phase: "before",
      label: "Starts in",
      units: ["--", "--", "--", "--"],
      aria: "Countdown to Franko Speed Shopping",
    };
  }

  const phase = getPhase(now);
  const target = phase === "before" ? PROMO_START : PROMO_END;
  const total = phase === "ended" ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const label = phase === "live" ? "Ends in" : "Starts in";

  return {
    phase,
    label,
    units: [pad(d), pad(h), pad(m), pad(s)],
    aria: `${label} ${d} days, ${h} hours, ${m} minutes`,
  };
};

/* ─────────────────────────── icons ─────────────────────────── */

const ICONS = {
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  percent: (
    <>
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  truck: (
    <>
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
};

const Icon = ({ name, size = 16, strokeWidth = 2.4 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
);

const WhatsAppIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
  </svg>
);

/* ─────────────────────── text: words → masked chars ───────────────────────
   Every word is an overflow-hidden mask; every character inside it is what GSAP
   moves. Highlighted words carry data-hl so they get an extra pop. */

const Chars = ({ parts }) =>
  parts.map((p, pi) => {
    if (p.count != null) {
      return (
        <span
          key={pi}
          data-count
          data-count-to={p.count}
          data-hl=""
          className="inline-block tabular-nums text-[#FFD400]"
        >
          {p.count}
        </span>
      );
    }
    return p.t.split(/(\s+)/).map((w, wi) => {
      if (w === "") return null;
      if (/^\s+$/.test(w)) return " ";
      return (
        <span
          key={`${pi}-${wi}`}
          data-hl={p.hl ? "" : undefined}
          className={`inline-block overflow-hidden whitespace-nowrap align-bottom ${
            p.hl ? "text-[#FFD400]" : ""
          }`}
          style={{ paddingBlock: 3, marginBlock: -3 }}
        >
          {[...w].map((c, ci) => (
            <span
              key={ci}
              data-char
              className="inline-block will-change-transform"
              style={{ transformOrigin: "0% 100%" }}
            >
              {c}
            </span>
          ))}
        </span>
      );
    });
  });

const plainText = (parts) => parts.map((p) => (p.count != null ? p.count : p.t)).join("");

/* ─────────────────────────── countdown ─────────────────────────── */

/* Digits roll up like a departure board whenever the value changes. */
const RollDigit = ({ value }) => {
  const wrap = useRef(null);
  const prev = useRef(value);

  useGSAP(
    () => {
      if (prev.current === value) return;
      const old = prev.current;
      prev.current = value;
      if (prefersReduced()) return;
      const cur = wrap.current.querySelector("[data-cur]");
      const ghost = wrap.current.querySelector("[data-ghost]");
      ghost.textContent = old;
      gsap.killTweensOf([cur, ghost]);
      gsap.fromTo(cur, { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: "back.out(1.7)" });
      gsap.fromTo(
        ghost,
        { yPercent: 0, opacity: 1 },
        { yPercent: -100, opacity: 0, duration: 0.3, ease: "power2.in" }
      );
    },
    { dependencies: [value], scope: wrap }
  );

  return (
    <span ref={wrap} className="relative flex h-full items-center overflow-hidden">
      <span data-cur className="flex h-full items-center">
        {value}
      </span>
      <span
        data-ghost
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      />
    </span>
  );
};

const UnitTiles = ({ units }) =>
  ["d", "h", "m", "s"].map((u, i) => (
    <span key={u} data-tile className="inline-flex items-center gap-0.5">
      <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-[#0F2A7A] text-[15px] font-black leading-none tabular-nums text-[#FFD400] shadow-[0_2px_0_rgba(0,0,0,0.25)] ring-1 ring-white/30 lg:h-7 lg:w-[30px] lg:text-base">
        <RollDigit value={units[i]} />
      </span>
      <span className="text-[10px] font-extrabold uppercase text-white/90 lg:text-[11px]">{u}</span>
    </span>
  ));

const LiveDot = () => (
  <span className="relative flex h-2 w-2" aria-hidden="true">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD400] opacity-75 motion-reduce:animate-none" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD400]" />
  </span>
);

const Divider = () => (
  <div className="mx-3 hidden h-5 w-px shrink-0 bg-white/25 lg:block" aria-hidden="true" />
);

/* Always visible: bottom-left row on phones and tablets, pinned inline from lg up.
   Renders nothing once the sale is over. */
const Countdown = () => {
  const { phase, label, units, aria } = useCountdown();
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReduced()) return;
      gsap.fromTo(
        gsap.utils.toArray("[data-tile]", ref.current),
        { yPercent: 120, opacity: 0, scale: 0.8 },
        { yPercent: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: "back.out(1.8)", delay: 0.15 }
      );
    },
    { scope: ref }
  );

  if (phase === "ended") return null;

  return (
    <>
      <Divider />
      <div ref={ref} role="timer" aria-label={aria} className="flex shrink-0 items-center gap-1.5 lg:gap-2">
        <span className="fk-text flex items-center gap-1.5 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.1em] text-white lg:text-xs">
          {phase === "live" && <LiveDot />}
          {label}
        </span>
        <span className="flex items-center gap-1 lg:gap-1.5" aria-hidden="true">
          <UnitTiles units={units} />
        </span>
      </div>
    </>
  );
};

/* ─────────────────────────── contact ───────────────────────────
   Phones: two round icon buttons (30px tap targets) so the countdown fits.
   sm and up: pills that show the numbers. */

const Contact = () => (
  <>
    <Divider />
    <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0 lg:gap-2">
      <span className="fk-text hidden text-[11px] font-black uppercase tracking-[0.12em] text-white sm:inline lg:hidden xl:inline">
        Need help?
      </span>

      <a
        href="tel:+233302225651"
        aria-label="Call Franko on 030 222 5651"
        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#0F2A7A] shadow-md transition-transform duration-200 hover:-translate-y-px hover:scale-105 active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3.5 sm:text-[14px] sm:font-black"
      >
        <Icon name="phone" size={15} strokeWidth={2.6} />
        <span className="hidden tabular-nums sm:inline">030 222 5651</span>
      </a>

      <a
        href="https://wa.me/233503607980"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Franko on WhatsApp, 050 360 7980"
        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-md ring-1 ring-white/30 transition-transform duration-200 hover:-translate-y-px hover:scale-105 active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3.5 sm:text-[14px] sm:font-black"
      >
        <WhatsAppIcon size={16} />
        <span className="hidden tabular-nums sm:inline">050 360 7980</span>
      </a>
    </div>
  </>
);

/* ─────────────────────────── slide exit ─────────────────────────── */

const runExit = (stage, done, store) => {
  if (!stage) return done();
  const chars = gsap.utils.toArray("[data-char]", stage).filter((el) => el.offsetParent !== null);
  const bits = gsap.utils.toArray("[data-icon],[data-badge]", stage);
  const tl = gsap.timeline({ onComplete: done });
  if (prefersReduced()) {
    tl.to(stage, { opacity: 0, duration: 0.15 });
  } else {
    if (chars.length)
      tl.to(chars, { yPercent: -130, opacity: 0, duration: 0.28, ease: "power2.in", stagger: 0.006 }, 0);
    if (bits.length)
      tl.to(bits, { scale: 0, opacity: 0, duration: 0.22, ease: "power2.in" }, 0);
    if (!chars.length && !bits.length) tl.to(stage, { opacity: 0, duration: 0.2 }, 0);
  }
  store.current = tl;
};

/* ─────────────────────────── the bar ─────────────────────────── */

const AnnouncementBar = () => {
  const phase = usePromoPhase();

  const slides = phase === "ended" ? SLIDES.filter((s) => s.id === "delivery") : SLIDES;

  const [slideId, setSlideId] = useState(SLIDES[0].id);
  const slide = slides.find((s) => s.id === slideId) ?? slides[0];
  const canRotate = slides.length > 1;

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const progressRef = useRef(null);
  const tweenRef = useRef(null);
  const exitRef = useRef(null);
  const busy = useRef(false);
  const pausedRef = useRef(false);
  const resumeTimer = useRef(null);
  const slidesRef = useRef(slides);
  const currentId = useRef(slide.id);
  slidesRef.current = slides;
  currentId.current = slide.id;

  const goTo = useCallback((id) => {
    if (busy.current || id === currentId.current) return;
    busy.current = true;
    tweenRef.current?.kill();
    runExit(
      stageRef.current,
      () => {
        busy.current = false;
        setSlideId(id);
      },
      exitRef
    );
  }, []);

  const advance = useCallback(() => {
    const list = slidesRef.current;
    const i = list.findIndex((s) => s.id === currentId.current);
    goTo(list[(i + 1) % list.length].id);
  }, [goTo]);

  const setPaused = useCallback((v) => {
    pausedRef.current = v;
    if (v) tweenRef.current?.pause();
    else tweenRef.current?.resume();
  }, []);

  useEffect(
    () => () => {
      exitRef.current?.kill();
      clearTimeout(resumeTimer.current);
    },
    []
  );

  /* Bar entrance + occasional shine sweep */
  useGSAP(
    () => {
      const root = rootRef.current;
      gsap.fromTo(root, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
      if (prefersReduced()) return;
      gsap.fromTo(
        root.querySelector("[data-shine]"),
        { xPercent: -130 },
        { xPercent: 530, duration: 1.6, ease: "power2.inOut", repeat: -1, repeatDelay: 6 }
      );
    },
    { scope: rootRef }
  );

  /* Slide enter + progress timer, re-run for every new slide */
  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;
      const q = (sel) => gsap.utils.toArray(sel, stage);
      const visible = (els) => els.filter((el) => el.offsetParent !== null);
      const chars = visible(q("[data-char]"));
      const hlChars = visible(q("[data-hl] [data-char]"));
      const icon = q("[data-icon]");
      const badge = q("[data-badge]");
      const counts = visible(q("[data-count]"));
      const reduce = prefersReduced();

      if (reduce) {
        gsap.fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      } else {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        if (icon.length)
          tl.fromTo(
            icon,
            { scale: 0, rotate: -120 },
            { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2.4)" },
            0
          );
        if (badge.length)
          tl.fromTo(
            badge,
            { scale: 0.5, opacity: 0, transformOrigin: "0% 50%" },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.2)" },
            0.05
          );
        if (chars.length)
          tl.fromTo(
            chars,
            { yPercent: 130, rotate: 7, opacity: 0 },
            { yPercent: 0, rotate: 0, opacity: 1, duration: 0.6, stagger: 0.02 },
            0.08
          );
        if (hlChars.length)
          tl.fromTo(
            hlChars,
            { scale: 1.6 },
            { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)", stagger: 0.02 },
            0.2
          );

        /* 40% counts up from zero */
        counts.forEach((el) => {
          const to = Number(el.dataset.countTo);
          const o = { v: 0 };
          el.textContent = "0";
          tl.to(
            o,
            {
              v: to,
              duration: 0.9,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(o.v);
              },
              onComplete: () => {
                el.textContent = to;
              },
            },
            0.15
          );
        });

        /* the delivery truck idles with a little drive */
        if (slide.icon === "truck" && icon.length)
          gsap.to(icon, { x: 3, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.7 });
      }

      /* the progress line is the timer: when it fills, the next slide comes in */
      if (canRotate && progressRef.current) {
        tweenRef.current = gsap.fromTo(
          progressRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: SLIDE_SECONDS, ease: "none", onComplete: advance }
        );
        if (pausedRef.current) tweenRef.current.pause();
      }
    },
    { dependencies: [slide.id, canRotate], scope: rootRef, revertOnUpdate: true }
  );

  /* Pause on mouse hover, keyboard focus, or touch (touch resumes after 2.5s) */
  const onPointerEnter = (e) => e.pointerType === "mouse" && setPaused(true);
  const onPointerLeave = (e) => e.pointerType === "mouse" && setPaused(false);
  const onTouchStart = () => {
    clearTimeout(resumeTimer.current);
    setPaused(true);
  };
  const onTouchEnd = () => {
    resumeTimer.current = setTimeout(() => setPaused(false), 2500);
  };

  return (
    <div
      ref={rootRef}
      className="fk-root relative w-full overflow-hidden text-white"
      role="region"
      aria-label="Franko promotions"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{CSS}</style>

      <div className="fk-bg relative">
        <span
          data-shine
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="relative z-[1] mx-auto flex max-w-[1920px] flex-col lg:h-11 lg:flex-row lg:items-center lg:px-2">
          {/* ═══ PROMO ═══ */}
          <div className="flex h-8 min-w-0 items-center justify-center gap-2 px-1.5 lg:h-full lg:flex-1 lg:justify-start lg:px-0">
            <div className="flex h-full min-w-0 items-center overflow-hidden">
              <div key={slide.id} ref={stageRef} className="flex min-w-0 items-center gap-1.5 md:gap-2">
                <span data-icon className="shrink-0 text-[#FFD400]">
                  <Icon name={slide.icon} size={16} />
                </span>

                <span
                  data-badge
                  className={`hidden h-[22px] shrink-0 items-center rounded-full px-3 text-[14px] font-black uppercase tracking-[0.1em] shadow-md xl:inline-flex ${TONE[slide.tone]}`}
                >
                  {slide.badge}
                </span>

                <span className="fk-text min-w-0 truncate text-[clamp(12px,3.75vw,15px)] font-black leading-none md:text-base lg:text-[14.5px] xl:text-[15.5px] 2xl:text-[15.5px]">
                  <span className="sr-only">{plainText(slide.full)}</span>
                  <span aria-hidden="true" className="md:hidden">
                    <Chars parts={slide.tiny ?? slide.short ?? slide.full} />
                  </span>
                  <span aria-hidden="true" className="hidden md:inline lg:hidden 2xl:inline">
                    <Chars parts={slide.full} />
                  </span>
                  <span aria-hidden="true" className="hidden lg:inline 2xl:hidden">
                    <Chars parts={slide.short ?? slide.full} />
                  </span>
                </span>
              </div>
            </div>

            {/* Dots (tablets and 2xl+; hidden on lg–xl to save room) */}
            {canRotate && (
              <div className="hidden shrink-0 items-center md:flex lg:hidden 2xl:flex">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-label={`Show message ${i + 1} of ${slides.length}`}
                    aria-current={s.id === slide.id ? "true" : undefined}
                    className="flex h-6 items-center rounded px-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span
                      className="block h-2 rounded-full transition-[width,background-color] duration-300"
                      style={{
                        width: s.id === slide.id ? 18 : 8,
                        backgroundColor: s.id === slide.id ? "#FFD400" : "rgba(255,255,255,0.45)",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══ COUNTDOWN + CONTACT ═══
              second row below lg; from lg up the wrapper disappears (display: contents)
              so both sit inline with the promo */}
          <div className="flex h-[34px] items-center justify-between gap-2 border-t border-white/15 bg-black/15 px-1.5 lg:contents">
            <Countdown />
            <Contact />
          </div>
        </div>

        {/* Progress line (poster sky: yellow → cyan). Freezes while paused. */}
        {canRotate && (
          <span
            ref={progressRef}
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[3px] w-full origin-left"
            style={{ transform: "scaleX(0)", background: "linear-gradient(90deg,#FFE45C,#4FD8F5)" }}
          />
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;