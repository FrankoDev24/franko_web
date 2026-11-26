"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* ────────────────────────────────────────────────────────────
   Franko · Black Friday announcement bar (GSAP)

   npm i gsap @gsap/react

   Palette (from the Black Friday poster)
   black #080808 / #171717 · red #E50914 · orange #FF9F0F
   yellow #FFD400 · white #FFFFFF

   Layout
   < lg   two rows:  [ promo message ]
                     [ countdown ················ contact ]
   ≥ lg   one row:   [ promo message | countdown | contact ]
   ──────────────────────────────────────────────────────────── */

/* ── Black Friday timing. Ghana is on GMT all year, so "Z" = Accra time. ── */
const PROMO_START = Date.parse("2026-11-27T00:00:00Z");
const PROMO_END = Date.parse("2026-11-28T00:00:00Z");

const SLIDE_SECONDS = 4.5;

const CALL_NUMBERS = [
  { display: "030 222 5651", href: "tel:+233302225651" },
  { display: "024 642 2338", href: "tel:+233246422338" },
];

/* Copy variants */
const SLIDES = [
  {
    id: "teaser",
    icon: "calendar",
    full: [
      { t: "BLACK FRIDAY IS COMING! ", hl: true },
      { t: "Mark your calendar - 27th November." },
    ],
    short: [
      { t: "BLACK FRIDAY · ", hl: true },
      { t: " 27TH NOVEMBER" },
    ],
    tiny: [
      { t: "BLACK FRIDAY · ", hl: true },
      { t: "NOV 27" },
    ],
  },
  {
    id: "super-sale",
    full: [
      { t: "BLACK FRIDAY" },
      { t: " · DISCOUNT UP TO ", hl: true },
      { count: 40, hl: true },
      { t: "% OFF", hl: true },
    ],
    short: [
      { t: "BLACK FRIDAY · UP TO ", hl: true },
      { count: 40, hl: true },
      { t: "% OFF", hl: true },
    ],
    tiny: [
      { t: "UP TO ", hl: true },
      { count: 40, hl: true },
      { t: "% OFF", hl: true },
    ],
  },
  {
    id: "limited-time",
    full: [
      { t: "BIG SAVINGS. ", hl: true },
      { t: "LIMITED TIME ONLY" },
    ],
    short: [
      { t: "BIG SAVINGS · ", hl: true },
      { t: "LIMITED TIME" },
    ],
    tiny: [
      { t: "LIMITED TIME · ", hl: true },
      { t: "BIG SAVINGS" },
    ],
  },
  {
    id: "delivery",
    full: [
      { t: "FREE DELIVERY ", hl: true },
      { t: "within Accra & Kumasi" },
      { t: " · ON ONLINE ORDERS", hl: true },
    ],
    short: [
      { t: "FREE DELIVERY", hl: true },
      { t: " · ACCRA & KUMASI · ONLINE ORDERS" },
    ],
    tiny: [
      { t: "FREE DELIVERY", hl: true },
      { t: "· ACCRA & KUMASI. ONLINE ORDERS" },
    ],
  },
  {
    id: "branches",
    icon: "pin",
    full: [
      { t: "BLACK FRIDAY DEALS ", hl: true },
      { t: "across all Franko branches" },
    ],
    short: [
      { t: "BLACK FRIDAY DEALS ", hl: true },
      { t: "across all Franko branches" },
    ],
    tiny: [
      { t: "BLACK FRIDAY DEALS ", hl: true },
      { t: "across all Franko branches" },
    ],
  },
];

const CSS = `
.fk-root{font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}
.fk-bg{background:radial-gradient(circle at 50% -80%,#3a3a3a 0%,#171717 42%,#080808 100%)}

.fk-text{
  text-shadow:
    1px 1px 0 #000,
    2px 2px 0 #000,
    3px 3px 0 #000,
    0 5px 8px rgba(0,0,0,.7);
}
.fk-text [data-hl]{
  text-shadow:
    1px 1px 0 #9b080f,
    2px 2px 0 #9b080f,
    3px 3px 0 #65050a,
    0 5px 8px rgba(0,0,0,.7);
}
`;

/* ─────────────────────────── helpers ─────────────────────────── */

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pad = (n) => String(n).padStart(2, "0");

const getPhase = (now) =>
  now < PROMO_START ? "before" : now < PROMO_END ? "live" : "ended";

const usePromoPhase = () => {
  const [phase, setPhase] = useState(() => getPhase(Date.now()));
  useEffect(() => {
    const tick = () => setPhase(getPhase(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return phase;
};

const useCountdown = () => {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return {
      phase: "live",
      label: "Black Friday starts in",
      shortLabel: "Starts in",
      units: ["--", "--", "--", "--"],
      aria: "Countdown to Black Friday on Friday, 27 November 2026",
    };
  }

  const phase = getPhase(now);
  const target = phase === "before" ? PROMO_START : PROMO_END;
  const total = phase === "ended" ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const label = phase === "ended" ? "Black Friday is live" : "Black Friday starts in";
  const shortLabel = phase === "ended" ? "Live now" : "Starts in";

  return {
    phase,
    label,
    shortLabel,
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
  bag: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
};

const Icon = ({ name, size = 16, strokeWidth = 2.4 }) => {
  if (!name || !ICONS[name]) return null;
  return (
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
};

const WhatsAppIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
  </svg>
);

/* ─────────────────────── text: words → masked chars ─────────────────────── */

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
      <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-[#080808] text-[15px] font-black leading-none tabular-nums text-[#FFD400] shadow-[0_2px_0_rgba(0,0,0,0.25)] ring-1 ring-white/30 lg:h-7 lg:w-[30px] lg:text-base">
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

/* Mobile-only divider (hidden from lg up, where the single-row layout uses Divider) */
const MobileDivider = () => (
  <div className="mx-1.5 h-4 w-px shrink-0 bg-white/25 lg:hidden" aria-hidden="true" />
);

const Countdown = () => {
  const { phase, label, shortLabel, units, aria } = useCountdown();
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
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
        <span className="flex items-center gap-1 lg:gap-1.5" aria-hidden="true">
          <UnitTiles units={units} />
        </span>
      </div>
    </>
  );
};

/* ─────────────────────────── call modal ─────────────────────────── */

const CallModal = ({ open, onClose }) => {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useGSAP(
    () => {
      if (!open || prefersReduced()) return;
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" });
      gsap.fromTo(
        panelRef.current,
        { y: 18, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.28, ease: "back.out(1.7)" }
      );
    },
    { dependencies: [open] }
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fk-call-modal-title"
      onClick={onClose}
      className="fk-root fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="fk-bg relative w-full max-w-xs overflow-hidden rounded-2xl border border-white/15 p-5 text-white shadow-2xl"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: "linear-gradient(90deg,#FFD400,#FF9F0F,#E50914)" }}
        />

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD400] text-[#080808] shadow">
              <Icon name="phone" size={16} strokeWidth={2.5} />
            </span>
            <div>
              <h2 id="fk-call-modal-title" className="text-sm font-black uppercase tracking-wider text-white">
                Call Franko
              </h2>
              <p className="text-xs text-white/70">Choose a line to call</p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close call options"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            <Icon name="close" size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {CALL_NUMBERS.map((num, idx) => (
            <a
              key={num.href}
              href={num.href}
              onClick={onClose}
              aria-label={`Call Franko on ${num.display}`}
              className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 text-[#080808] shadow-md transition-transform duration-150 active:scale-[0.98] hover:bg-[#FFD400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400]"
            >
              <span className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#080808] text-[#FFD400] transition-transform duration-150 group-hover:scale-105">
                  <Icon name="phone" size={16} strokeWidth={2.4} />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#080808]/60">
                    Line {idx + 1}
                  </span>
                  <span className="text-base font-black tabular-nums tracking-tight">{num.display}</span>
                </span>
              </span>
              <span className="rounded-full bg-[#E50914] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                Call
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─────────────────────────── shop now ─────────────────────────── */

const ShopNowButton = () => (
  <a
    href="/blackfriday"
    aria-label="Shop Black Friday deals"
    className="inline-flex h-[26px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#FFD400] px-3 text-[11px] font-black uppercase tracking-wide text-[#080808] shadow-[0_2px_0_rgba(0,0,0,0.25)] ring-1 ring-white/25 transition-transform duration-200 hover:-translate-y-px hover:scale-105 hover:bg-[#FFE14D] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-8 sm:px-3.5 sm:text-[13px] lg:h-[30px]"
  >
    <Icon name="bag" size={14} strokeWidth={2.6} />
    <span className="whitespace-nowrap">Shop Now</span>
  </a>
);

/* ─────────────────────────── contact ─────────────────────────── */

const Contact = ({ onOpenCallModal }) => (
  <>
    <MobileDivider />
    <Divider />
    <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0 lg:gap-2">
      <ShopNowButton />

      <span className="fk-text hidden text-[11px] font-black uppercase tracking-[0.12em] text-white sm:inline lg:hidden xl:inline">
        Need help?
      </span>

      {/* Mobile / < xl: icon button that opens the number selection modal */}
      <button
        type="button"
        onClick={onOpenCallModal}
        aria-label="Call Franko — choose a phone number"
        className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-[#080808] shadow-md transition-transform duration-200 hover:-translate-y-px hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-[13px] sm:font-black lg:h-[30px] lg:w-[30px] lg:rounded-full lg:sm:h-8 xl:hidden"
      >
        <Icon name="phone" size={14} strokeWidth={2.6} />
      </button>

      {/* Desktop (≥ xl): both numbers displayed & individually clickable */}
      <div className="hidden h-8 items-center whitespace-nowrap rounded-full bg-white px-3.5 text-sm font-black text-[#080808] shadow-md transition-transform duration-200 hover:-translate-y-px hover:scale-105 active:scale-95 xl:inline-flex">
        <a
          href={CALL_NUMBERS[0].href}
          aria-label={`Call Franko on ${CALL_NUMBERS[0].display}`}
          className="inline-flex h-full items-center gap-1.5 tabular-nums transition-colors hover:text-[#E50914] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400]"
        >
          <Icon name="phone" size={14} strokeWidth={2.6} />
          <span>{CALL_NUMBERS[0].display}</span>
        </a>
        <span className="mx-1.5 text-[#080808]/35" aria-hidden="true">
          /
        </span>
        <a
          href={CALL_NUMBERS[1].href}
          aria-label={`Call Franko on ${CALL_NUMBERS[1].display}`}
          className="inline-flex h-full items-center tabular-nums transition-colors hover:text-[#E50914] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400]"
        >
          {CALL_NUMBERS[1].display}
        </a>
      </div>

      <a
        href="https://wa.me/233503607980"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Franko on WhatsApp, 050 360 7980"
        className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-md ring-1 ring-white/30 transition-transform duration-200 hover:-translate-y-px hover:scale-105 active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-[13px] sm:font-black lg:h-[30px] lg:w-[30px] lg:rounded-full xl:w-auto xl:px-3.5 xl:text-sm"
      >
        <WhatsAppIcon size={15} />
        <span className="hidden tabular-nums xl:inline">050 360 7980</span>
      </a>
    </div>
  </>
);

/* ─────────────────────────── slide exit ─────────────────────────── */

const runExit = (stage, done, store) => {
  if (!stage) return done();
  const chars = gsap.utils.toArray("[data-char]", stage).filter((el) => el.offsetParent !== null);
  const bits = gsap.utils.toArray("[data-icon]", stage);
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
  const [callModalOpen, setCallModalOpen] = useState(false);
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

  useEffect(() => {
    setPaused(callModalOpen);
  }, [callModalOpen, setPaused]);

  useEffect(
    () => () => {
      exitRef.current?.kill();
      clearTimeout(resumeTimer.current);
    },
    []
  );

  /* Entrance + shine (runs once) */
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

  /* Per-slide entrance + rotation timer */
  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;
      const q = (sel) => gsap.utils.toArray(sel, stage);
      const visible = (els) => els.filter((el) => el.offsetParent !== null);
      const chars = visible(q("[data-char]"));
      const hlChars = visible(q("[data-hl] [data-char]"));
      const icon = q("[data-icon]");
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

        if (slide.icon === "truck" && icon.length)
          gsap.to(icon, { x: 3, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.7 });
      }

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

  const onPointerEnter = (e) => e.pointerType === "mouse" && setPaused(true);
  const onPointerLeave = (e) => e.pointerType === "mouse" && !callModalOpen && setPaused(false);
  const onTouchStart = () => {
    clearTimeout(resumeTimer.current);
    setPaused(true);
  };
  const onTouchEnd = () => {
    if (!callModalOpen) resumeTimer.current = setTimeout(() => setPaused(false), 2500);
  };

  return (
    <>
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
        onBlur={() => !callModalOpen && setPaused(false)}
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
                  {slide.icon && (
                    <span data-icon className="shrink-0 text-[#FFD400]">
                      <Icon name={slide.icon} size={16} />
                    </span>
                  )}

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

            {/* ═══ BOTTOM ROW (mobile) / INLINE ROW (desktop) ═══
                Countdown → Contact on every breakpoint. */}
            <div className="flex h-[34px] items-center gap-1 border-t border-white/15 bg-black/15 px-1.5 lg:contents lg:h-auto lg:border-0 lg:bg-transparent lg:gap-0 lg:px-0">
              <Countdown />
              <Contact onOpenCallModal={() => setCallModalOpen(true)} />
            </div>
          </div>

          {canRotate && (
            <span
              ref={progressRef}
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-[3px] w-full origin-left"
              style={{ transform: "scaleX(0)", background: "linear-gradient(90deg,#FFD400,#FF9F0F,#E50914)" }}
            />
          )}
        </div>
      </div>

      <CallModal open={callModalOpen} onClose={() => setCallModalOpen(false)} />
    </>
  );
};

export default AnnouncementBar;
