import React, { useState, useEffect, useCallback } from "react";

const EVENT_START = new Date("2026-08-07T09:00:00Z").getTime();
const EVENT_END = EVENT_START + 3 * 60 * 60 * 1000;

const promoMessages = [
  { text: "Free Delivery Within Accra & Kumasi",  },
  { text: "On All Products Purchased Online",  },
  { text: "Save More With Free Delivery Today", },
];

const pad = (n) => String(n).padStart(2, "0");

function getTimeLeft(target) {
  const diff = target - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0 };
  return {
    d: Math.floor(diff / (1000 * 60 * 60 * 24)),
    h: Math.floor((diff / (1000 * 60 * 60)) % 24),
    m: Math.floor((diff / (1000 * 60)) % 60),
    s: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

const AnnouncementBar = () => {
  const [countdown, setCountdown] = useState(() => getTimeLeft(EVENT_START));
  const [phase, setPhase] = useState("upcoming");
  const [msgIdx, setMsgIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now < EVENT_START) {
        setPhase("upcoming");
        setCountdown(getTimeLeft(EVENT_START));
      } else if (now < EVENT_END) {
        setPhase("live");
        setCountdown(getTimeLeft(EVENT_END));
      } else {
        setPhase("ended");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const nextMsg = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setMsgIdx((p) => (p + 1) % promoMessages.length);
      setIsVisible(true);
    }, 200);
  }, []);

  useEffect(() => {
    const id = setInterval(nextMsg, 4000);
    return () => clearInterval(id);
  }, [nextMsg]);

  const liveProgress = phase === "live" ? ((Date.now() - EVENT_START) / (EVENT_END - EVENT_START)) * 100 : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@800;900&display=swap');
        .fs-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        .fs-root { position: sticky; top: 0; z-index: 9999; width: 100%; display: block; }
        .fs-bg {
          background: linear-gradient(90deg, #1E0A36 0%, #321156 18%, #4D1070 38%, #7A0E6A 68%, #A30D5F 85%, #B90F67 100%);
          position: relative; border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 2px 36px rgba(30,10,54,0.25);
        }
        .fs-bg::after { content:''; position:absolute; inset:0; background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%); pointer-events:none; }
        .fs-shine { position:relative; overflow:hidden; }
        .fs-shine::before { content:''; position:absolute; top:0; left:-40%; width:30%; height:100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); animation: fs-shineMove 6s ease-in-out infinite; }
        @keyframes fs-shineMove { 0%{left:-40%} 60%{left:130%} 100%{left:130%} }

        /* ===== BASE (desktop / large screens) — padding & min-height are the source of truth, unchanged ===== */
        .fs-inner {
          max-width: 1780px; margin: 0 auto; min-height: 42px;
          display:flex; align-items:center; justify-content:space-between; gap:10px;
          padding: 4px 18px; position:relative; z-index:2; flex-wrap: nowrap;
        }

        .fs-main { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
        .fs-brand-group { display:flex; align-items:center; gap:12px; min-width:0; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.35)); }
        .fs-alarm-wrap { position:relative; width:34px; height:34px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .fs-alarm-bg {
          width:30px; height:30px; border-radius: 50% 50% 42% 42% / 48% 48% 52% 52%;
          background: linear-gradient(135deg, #25114D 0%, #5E1072 50%, #A30D5F 100%);
          box-shadow: 0 2px 0 #FFB600, 0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
          display:flex; align-items:center; justify-content:center; position:relative;
        }

        .fs-logo-img {
          width: clamp(24px, 2.6vw, 98px);
          height: clamp(24px, 2.6vw, 98px);
          object-fit: contain;
        }
        .fs-title { display:flex; align-items:center; gap:8px; white-space:nowrap; min-width:0; }
        .fs-brand {
          font-family:'Plus Jakarta Sans', sans-serif; font-weight:900;
          font-size: clamp(12.5px, 1.6vw, 20.5px);
          letter-spacing:0.7px; color:#fff; line-height:1;
          text-shadow:
            0 1px 0 rgba(0,0,0,0.7),
            0 2px 0 rgba(0,0,0,0.7),
            0 3px 9px rgba(0,0,0,0.6),
            0 4px 8px rgba(0,0,0,0.4),
            0 20px 23px rgba(0,0,0,0.25);
          overflow:hidden; text-overflow:ellipsis;
        }
        .fs-brand span {
          color:#FFD500;
          text-shadow:
            0 1px 0 #8a5000,
            0 2px 0 #723f00,
            0 3px 4px rgba(0,0,0,0.8),
            0 4px 10px rgba(0,0,0,0.5),
            0 0 14px rgba(255,213,0,0.75),
            0 0 26px rgba(255,138,0,0.45);
          filter: brightness(1.12);
        }
        .fs-chip { display:inline-flex; align-items:center; padding: 3px 9px; border-radius:100px; font-size: clamp(9.5px, 1.15vw, 20px); font-weight:900; letter-spacing:0.9px; line-height:1; white-space:nowrap; }
        .fs-chip-yellow {
          background: linear-gradient(90deg, #FF8A00 0%, #FFB600 45%, #FFD500 100%);
          color:#2B0B54;
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            0 1px 0 #fff,
            0 2px 0 #b45500,
            0 3px 8px rgba(0,0,0,0.4),
            0 0 16px rgba(255,213,0,0.5);
          text-shadow:
            0 1px 0 rgba(255,255,255,0.95),
            0 1px 2px rgba(0,0,0,0.15);
        }

        .fs-cd-wrap { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .fs-cd-label {
          font-size: clamp(9px, 1vw, 16.5px); font-weight:800; letter-spacing:1px; text-transform:uppercase;
          color: #FFD500; white-space:nowrap;
          text-shadow: 0 1px 0 rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,213,0,0.3);
        }
        .fs-cd-label.live { color:#fff; display:flex; align-items:center; gap:4px; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
        .fs-dot { width:6px; height:6px; border-radius:50%; background:#FF2A2A; box-shadow:0 0 0 2px rgba(255,42,42,0.25); animation: fs-pulse 1.2s infinite; flex-shrink:0; }
        @keyframes fs-pulse { 0%{box-shadow:0 0 0 0 rgba(255,42,42,0.5)} 70%{box-shadow:0 0 0 6px rgba(255,42,42,0)} 100%{box-shadow:0 0 0 0 rgba(255,42,42,0)} }
        .fs-cd { display:flex; align-items:center; gap:3px; }
        .fs-box {
          min-width: clamp(20px, 1.7vw, 28px); height: clamp(18px, 1.5vw, 24px); padding:0 5px; border-radius:6px;
          background: rgba(255,255,255,0.98); color:#301256;
          display:flex; align-items:center; justify-content:center; gap:2px;
          font-variant-numeric: tabular-nums;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,1),
            0 1px 0 rgba(255,255,255,0.9),
            0 2px 0 rgba(0,0,0,0.2),
            0 4px 10px rgba(0,0,0,0.25);
        }
        .fs-box.live { background:#FFD500; color:#1E0A36; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 0 #8a5000, 0 4px 12px rgba(0,0,0,0.3), 0 0 14px rgba(255,213,0,0.5); }
        .fs-num { font-size: clamp(9.5px, 0.85vw, 12.5px); font-weight:900; line-height:1; text-shadow: 0 1px 0 rgba(255,255,255,0.9), 0 0.5px 0 rgba(0,0,0,0.1); }
        .fs-lbl { font-size: clamp(6px, 0.55vw, 8px); font-weight:900; opacity:0.6; margin-top:1px; }
        .fs-sep { color: rgba(255,255,255,0.5); font-weight:700; font-size:10px; text-shadow: 0 1px 2px rgba(0,0,0,0.6); }

        .fs-bottom { display:contents; }
        .fs-divider { width:1px; height:20px; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent); flex-shrink:0; }
        .fs-promo { display:flex; align-items:center; gap:8px; font-size: clamp(11px, 1.1vw, 16.5px); color: rgba(255,255,255,0.9); min-width:0; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
        .fs-promo-badge { background:#fff; color:#4D1070; font-size:8px; font-weight:900; padding:2px 2px; border-radius:100px; letter-spacing:0.6px; flex-shrink:0; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .fs-promo-text { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition: all 0.25s ease; }
        .fs-promo-text.hide { transform: translateY(-8px); opacity:0; filter:blur(2px); }
        .fs-promo-text.show { transform: translateY(0); opacity:1; }
        .fs-side { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .fs-link { display:flex; align-items:center; gap:5px; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:600; text-decoration:none; transition:0.2s; white-space:nowrap; cursor:pointer; }
        .fs-link-phone { background: rgba(255,255,255,0.12); color:#fff; border:1px solid rgba(255,255,255,0.15); }
        .fs-link-wa { background: linear-gradient(135deg, #25D366, #128C7E); color:#fff; box-shadow:0 2px 8px rgba(37,211,102,0.3); }
        .fs-shop-btn {
          background: linear-gradient(90deg, #FF8A00, #FFD500); color:#1E0A36;
          padding:5px 14px; border-radius:100px; font-size:11px; font-weight:900; letter-spacing:0.4px;
          text-decoration:none; box-shadow:0 3px 10px rgba(255,165,0,0.45), 0 2px 0 #8a5000;
          animation: fs-btnPulse 2s infinite; white-space:nowrap;
          text-shadow: 0 1px 0 rgba(255,255,255,0.7);
        }
        @keyframes fs-btnPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        .fs-prog { position:absolute; bottom:0; left:0; height:2px; background:#FFD500; box-shadow:0 0 6px #FFD500; transition: width 1s linear; }

        /* ===== TABLET / SMALL LAPTOP (1025px window down to the mobile stack breakpoint) =====
           Keeps the single-row desktop layout but lets clamp() shrink text/controls smoothly
           and tightens gaps so nothing crowds or wraps awkwardly. Padding/min-height untouched. */
        @media (max-width: 1024px) {
          .fs-main { gap:10px; }
          .fs-brand-group { gap:8px; }
          .fs-cd-wrap { gap:6px; }
          .fs-promo { gap:6px; }
          .fs-side { gap:6px; }
          .fs-link-text { display: none; }
          .fs-link { width:26px; height:26px; padding:0; justify-content:center; border-radius:50%; }
        }

        @media (max-width: 900px) {
          .fs-chip { display:none; }
        }

        /* ===== MOBILE STACK — the exact breakpoint/padding/height from the original design ===== */
        @media (max-width: 768px) {
          .fs-inner { flex-direction: column; gap:0; padding:0; min-height:0; flex-wrap: wrap; }
          .fs-main { width:100%; padding: 0px 8px; justify-content: space-between; gap:2px; }
          .fs-brand-group { gap:8px; flex:1; min-width:0; }
          .fs-alarm-wrap { width:28px; height:28px; }
          .fs-alarm-bg { width:26px; height:26px; }
          .fs-alarm-face { width:18px; height:18px; }
          .fs-logo-img { width: 24px; height: 24px; }
          .fs-title { flex-direction:column; align-items:flex-start; gap:3px; line-height:1; }
          .fs-brand { font-size: clamp(11px, 3.2vw, 13px); letter-spacing:0.5px; }
          .fs-chip { display: inline-flex; font-size: clamp(8.5px, 2.6vw, 10.5px); padding:1px 6px; }
          .fs-cd-wrap { gap:5px; margin-left:auto; }
          .fs-cd-label { font-size: clamp(8px, 2.4vw, 10px); margin-top: 20px }
          .fs-cd { gap:2px; margin-top: 20px }
          .fs-box { min-width:22px; height:20px; padding:0 3px; border-radius:5px; }
          .fs-num { font-size: clamp(9px, 2.6vw, 10.5px); }
          .fs-lbl { font-size:6.5px; }
          .fs-sep { font-size:8px; }
          .fs-bottom {
            display:flex; width:100%; align-items:center; justify-content:space-between;
            gap:8px; padding: 5px 12px;
            background: rgba(0,0,0,0.22); border-top: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(6px);
          }
          .fs-divider { display:none; }
          .fs-promo { display:flex!important; font-size: clamp(9px, 2.6vw, 10px); flex:1; min-width:0; }
          .fs-promo-badge { font-size:7px; padding:2px 5px; }
          .fs-promo-text { max-width: 100%; font-size: clamp(11px, 3vw, 13px); }
          .fs-side { gap:6px; margin-left:auto; }
          .fs-link { width:28px; height:28px; padding:0; justify-content:center; border-radius:50%; flex-shrink:0; }
          .fs-link-text { display:none; }
          .fs-shop-btn { font-size:9.5px; padding:5px 10px; margin-left:2px; }
        }

        /* ===== SMALL PHONES (e.g. iPhone SE / compact Android, ~480px and below) =====
           Same structure as the mobile stack; only spacing/sizes tighten further so
           nothing clips or overlaps on narrow screens. Padding/height rules above are untouched. */
        @media (max-width: 480px) {
          .fs-main { gap:0; }
          .fs-brand-group { gap:6px; }
          .fs-alarm-wrap { width:24px; height:24px; }
          .fs-alarm-bg { width:22px; height:22px; }
          .fs-cd-wrap { gap:4px; }
          .fs-box { min-width:19px; height:18px; }
          .fs-side { gap:4px; }
          .fs-link { width:26px; height:26px; }
          .fs-shop-btn { padding:4px 8px; font-size:9px; }
          .fs-promo-badge { padding:2px 2px; }
        }

        /* ===== VERY SMALL PHONES (≤360px, e.g. Galaxy Fold cover screen / old SE) =====
           Drop the least essential label so the countdown and brand never wrap or overflow. */
        @media (max-width: 360px) {
          .fs-cd-label { display:none; }
          .fs-chip { display:none; }
          .fs-sep { font-size:7px; }
          .fs-box { min-width:17px; padding:0 2px; }
          .fs-promo-text { font-size: 10.5px; }
        }

        /* ===== SHORT / LANDSCAPE MOBILE VIEWPORTS =====
           On short landscape screens vertical space is scarcer than horizontal space,
           so nudge the stacked mobile margins down without changing declared padding. */
        @media (max-width: 900px) and (max-height: 420px) and (orientation: landscape) {
          .fs-cd-label { margin-top: 0 !important; }
          .fs-cd { margin-top: 0 !important; }
          .fs-bottom { padding-top: 3px; padding-bottom: 3px; }
        }

        /* ===== HIGH-DPI / FOLDABLE & TABLET LANDSCAPE (small tablets like 820px iPad, Z Fold outer) ===== */
        @media (min-width: 481px) and (max-width: 768px) and (orientation: landscape) {
          .fs-main { padding-left: 16px; padding-right: 16px; }
        }

        /* ===== LARGE DESKTOP / ULTRAWIDE — cap growth so text doesn't balloon on huge monitors ===== */
        @media (min-width: 1780px) {
          .fs-brand { font-size: 20.5px; }
          .fs-chip { font-size: 20px; }
          .fs-cd-label { font-size: 16.5px; }
          .fs-promo { font-size: 16.5px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-shine::before,
          .fs-shop-btn,
          .fs-dot,
          .fs-promo-text { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="fs-root">
        <div className="fs-bg">
          <div className="fs-shine">
            <div className="fs-inner">
              <div className="fs-main">
                <div className="fs-brand-group">
                  <div className="fs-alarm-wrap">
                    <div className="fs-alarm-bg">
                      <div className="fs-alarm-face">
                        <img src="/speed.jpg" alt="Franko Speed shopping" className="fs-logo-img" />
                      </div>
                    </div>
                  </div>
                  <div className="fs-title">
                    <div className="fs-brand">FRANKO <span>SPEED SHOPPING</span></div>
                    <div className="fs-chip fs-chip-yellow">ONLY 3HRS TO SHOP</div>
                  </div>
                </div>

                <div className="fs-cd-wrap">
                  <div className={`fs-cd-label ${phase === "live" ? "live" : ""}`}>
                    {phase === "live" && <span className="fs-dot" />}
                    {phase === "upcoming" ? "STARTS IN" : phase === "live" ? "ENDS IN" : ""}
                  </div>
                  {phase !== "ended" ? (
                    <div className="fs-cd">
                      {countdown.d > 0 && (
                        <>
                          <div className={`fs-box ${phase === "live" ? "live" : ""}`}>
                            <span className="fs-num">{pad(countdown.d)}</span><span className="fs-lbl">D</span>
                          </div>
                          <span className="fs-sep">:</span>
                        </>
                      )}
                      <div className={`fs-box ${phase === "live" ? "live" : ""}`}>
                        <span className="fs-num">{pad(countdown.h)}</span><span className="fs-lbl">H</span>
                      </div>
                      <span className="fs-sep">:</span>
                      <div className={`fs-box ${phase === "live" ? "live" : ""}`}>
                        <span className="fs-num">{pad(countdown.m)}</span><span className="fs-lbl">M</span>
                      </div>
                      <span className="fs-sep">:</span>
                      <div className={`fs-box ${phase === "live" ? "live" : ""}`}>
                        <span className="fs-num">{pad(countdown.s)}</span><span className="fs-lbl">S</span>
                      </div>
                    </div>
                  ) : null}
                  {phase === "live" && <a href="/collections" className="fs-shop-btn">SHOP NOW</a>}
                  {phase === "ended" && <span style={{color:'#FFD500', fontSize:'10px', fontWeight:900, textShadow:'0 2px 4px rgba(0,0,0,0.6)'}}>ENDED</span>}
                </div>
              </div>

              <div className="fs-bottom">
                <div className="fs-divider promo-div" />
                <div className="fs-promo">
                  <span className="fs-promo-badge">{promoMessages[msgIdx].badge}</span>
                  <span className={`fs-promo-text ${isVisible ? "show" : "hide"}`}>{promoMessages[msgIdx].text}</span>
                </div>
                <div className="fs-divider" />
                <div className="fs-side">
                  <a href="tel:+233302225651" className="fs-link fs-link-phone" aria-label="Call">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    <span className="fs-link-text">030 222 5651</span>
                  </a>
                  <a href="https://wa.me/233503607980" target="_blank" rel="noreferrer" className="fs-link fs-link-wa" aria-label="WhatsApp">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" /></svg>
                    <span className="fs-link-text">050 360 7980</span>
                  </a>
                </div>
              </div>
              {phase === "live" && <div className="fs-prog" style={{ width: `${liveProgress}%` }} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBar;