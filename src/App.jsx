import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const colors = {
  graphite: {
    name: 'Obsidian',
    base: '#111512',
    edge: '#b5ff45',
    glow: 'rgba(181, 255, 69, .32)',
  },
  mineral: {
    name: 'Mineral',
    base: '#a5aaa4',
    edge: '#e7ffc4',
    glow: 'rgba(224, 255, 184, .3)',
  },
  ember: {
    name: 'Ember',
    base: '#521e19',
    edge: '#ff725e',
    glow: 'rgba(255, 114, 94, .32)',
  },
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v14M3 10h14" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3 5.5 16 29 29 5.5l-8.2 2.9L16 19 11.2 8.4 3 5.5Z" />
      <path d="m11.2 8.4 9.6 0" />
    </svg>
  );
}

function MagneticButton({ children, className = '', onClick, type = 'button' }) {
  const ref = useRef(null);

  const move = (event) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(ref.current, { x: x * 0.12, y: y * 0.16, duration: 0.35, ease: 'power2.out' });
  };

  const reset = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, .45)' });

  return (
    <button
      ref={ref}
      type={type}
      className={`magnetic-button ${className}`}
      onMouseMove={move}
      onMouseLeave={reset}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    const move = (event) => {
      gsap.to(dot.current, { x: event.clientX, y: event.clientY, duration: 0.08 });
      gsap.to(ring.current, { x: event.clientX, y: event.clientY, duration: 0.42, ease: 'power3.out' });
    };
    const enter = () => ring.current?.classList.add('cursor-active');
    const leave = () => ring.current?.classList.remove('cursor-active');
    const targets = document.querySelectorAll('button, a, input, [data-cursor]');
    targets.forEach((target) => {
      target.addEventListener('mouseenter', enter);
      target.addEventListener('mouseleave', leave);
    });
    window.addEventListener('mousemove', move);

    return () => {
      window.removeEventListener('mousemove', move);
      targets.forEach((target) => {
        target.removeEventListener('mouseenter', enter);
        target.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring} />
    </>
  );
}

function SignalField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -1000, y: -1000 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let points = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: Math.min(46, Math.round(width / 30)) }, (_, index) => ({
        x: (index * 173.3) % width,
        y: (index * 91.7) % height,
        vx: ((index % 5) - 2) * 0.025,
        vy: ((index % 7) - 3) * 0.018,
        r: index % 8 === 0 ? 1.4 : 0.7,
      }));
    };

    const move = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      points.forEach((point) => {
        if (!reducedMotion) {
          point.x = (point.x + point.vx + width) % width;
          point.y = (point.y + point.vy + height) % height;
        }
        const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        const influence = Math.max(0, 1 - distance / 180);
        context.beginPath();
        context.fillStyle = `rgba(181,255,69,${0.08 + influence * 0.32})`;
        context.arc(point.x, point.y, point.r + influence * 1.7, 0, Math.PI * 2);
        context.fill();
        if (influence > 0.04) {
          context.beginPath();
          context.strokeStyle = `rgba(181,255,69,${influence * 0.11})`;
          context.moveTo(point.x, point.y);
          context.lineTo(pointer.x, pointer.y);
          context.stroke();
        }
      });
      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  return <canvas className="signal-field" ref={canvasRef} aria-hidden="true" />;
}

function MaskModel({ color = 'graphite', className = '', exploded = false }) {
  const uid = useId().replaceAll(':', '');
  const palette = colors[color];

  return (
    <svg
      className={`mask-model ${className} ${exploded ? 'is-exploded' : ''}`}
      viewBox="0 0 620 620"
      role="img"
      aria-label={`VEIL/01 mask in ${palette.name}`}
      style={{ '--mask-base': palette.base, '--mask-edge': palette.edge, '--mask-glow': palette.glow }}
    >
      <defs>
        <radialGradient id={`halo-${uid}`} cx="50%" cy="48%" r="50%">
          <stop offset="0" stopColor={palette.edge} stopOpacity=".21" />
          <stop offset=".72" stopColor={palette.edge} stopOpacity=".035" />
          <stop offset="1" stopColor={palette.edge} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`shell-${uid}`} x1=".18" y1=".08" x2=".84" y2=".92">
          <stop offset="0" stopColor="#363b37" />
          <stop offset=".3" stopColor={palette.base} />
          <stop offset=".74" stopColor="#070908" />
          <stop offset="1" stopColor="#242925" />
        </linearGradient>
        <linearGradient id={`ridge-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.edge} stopOpacity=".92" />
          <stop offset=".22" stopColor="#dfffb4" stopOpacity=".22" />
          <stop offset=".68" stopColor="#151916" stopOpacity=".65" />
          <stop offset="1" stopColor={palette.edge} stopOpacity=".72" />
        </linearGradient>
        <pattern id={`mesh-${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 7h14M7 0v14" stroke={palette.edge} strokeOpacity=".11" strokeWidth=".65" />
        </pattern>
        <filter id={`blur-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`shadow-${uid}`} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="22" stdDeviation="24" floodColor="#000" floodOpacity=".72" />
        </filter>
      </defs>

      <circle cx="310" cy="310" r="260" fill={`url(#halo-${uid})`} className="mask-halo" />
      <ellipse cx="310" cy="526" rx="162" ry="34" fill="#000" opacity=".58" filter={`url(#blur-${uid})`} />

      <g className="mask-straps" data-part="straps" fill="none" strokeLinecap="round">
        <path d="M172 235C92 225 42 266 30 326" stroke="#2c312d" strokeWidth="22" />
        <path d="M448 235c80-10 130 31 142 91" stroke="#2c312d" strokeWidth="22" />
        <path d="M165 385C86 412 58 449 68 493" stroke="#252a26" strokeWidth="17" />
        <path d="M455 385c79 27 107 64 97 108" stroke="#252a26" strokeWidth="17" />
        <path d="M170 235C97 229 54 268 43 324" stroke={palette.edge} strokeOpacity=".18" strokeWidth="2" />
        <path d="M450 235c73-6 116 33 127 89" stroke={palette.edge} strokeOpacity=".18" strokeWidth="2" />
      </g>

      <g className="mask-shell" data-part="shell" filter={`url(#shadow-${uid})`}>
        <path
          d="M310 104c-38 0-64 23-74 68l-16 73-55 31c-22 13-32 39-26 64l27 108c7 28 31 48 60 51l84 9 84-9c29-3 53-23 60-51l27-108c6-25-4-51-26-64l-55-31-16-73c-10-45-36-68-74-68Z"
          fill={`url(#shell-${uid})`}
          stroke="#5c635d"
          strokeOpacity=".52"
          strokeWidth="2"
        />
        <path
          d="M310 122c-24 0-44 17-51 50l-22 103-70 39 35 145 108 25 108-25 35-145-70-39-22-103c-7-33-27-50-51-50Z"
          fill={`url(#mesh-${uid})`}
          opacity=".66"
        />
        <path d="m310 114-2 376" stroke="#8d958e" strokeOpacity=".19" />
        <path d="M222 255c29 14 56 21 88 22 32-1 59-8 88-22" fill="none" stroke="#899089" strokeOpacity=".28" />
        <path d="M203 459c72 25 142 25 214 0" fill="none" stroke="#899089" strokeOpacity=".16" />
      </g>

      <g className="mask-emitters" data-part="emitters">
        {[
          [216, 290], [251, 270], [369, 270], [404, 290],
          [201, 334], [238, 326], [382, 326], [419, 334],
          [213, 383], [255, 374], [365, 374], [407, 383],
          [240, 423], [278, 410], [342, 410], [380, 423],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={index % 3 === 0 ? 8 : 6} fill="#050605" stroke={palette.edge} strokeOpacity=".42" />
            <circle cx={cx} cy={cy} r="2" fill={palette.edge} opacity={index % 4 === 0 ? '.95' : '.38'} />
          </g>
        ))}
      </g>

      <g className="mask-ridge" data-part="ridge">
        <path d="m310 128-22 105 22 45 22-45-22-105Z" fill={`url(#ridge-${uid})`} opacity=".92" />
        <path d="m310 278-31 103 31 83 31-83-31-103Z" fill="#0b0e0c" stroke={palette.edge} strokeOpacity=".34" />
        <path d="m310 291-13 89 13 54 13-54-13-89Z" fill={palette.edge} opacity=".14" />
        <circle cx="310" cy="381" r="4.5" fill={palette.edge} className="pulse-node" />
      </g>

      <g className="mask-vents" data-part="vents" fill="none" stroke={palette.edge} strokeOpacity=".36" strokeWidth="3" strokeLinecap="round">
        <path d="m211 443 48 11" />
        <path d="m218 456 43 10" />
        <path d="m409 443-48 11" />
        <path d="m402 456-43 10" />
      </g>
    </svg>
  );
}

function Navigation({ onReserve }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="VEIL home" onClick={close}>
        <LogoMark />
        <span>VEIL/01</span>
      </a>
      <nav className={open ? 'nav-open' : ''} aria-label="Primary navigation">
        <a href="#principle" onClick={close}>Principle</a>
        <a href="#anatomy" onClick={close}>Anatomy</a>
        <a href="#object" onClick={close}>The object</a>
      </nav>
      <MagneticButton className="nav-cta" onClick={onReserve}>
        <span>Reserve edition 01</span>
        <ArrowIcon />
      </MagneticButton>
      <button
        type="button"
        className="menu-toggle"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}

function Hero({ onReserve }) {
  const modelWrap = useRef(null);

  const parallax = (event) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(modelWrap.current, {
      rotateY: x * 15,
      rotateX: y * -11,
      x: x * 18,
      y: y * 14,
      duration: 0.8,
      ease: 'power3.out',
      transformPerspective: 900,
    });
  };

  const reset = () => gsap.to(modelWrap.current, { rotateY: 0, rotateX: 0, x: 0, y: 0, duration: 1.2, ease: 'expo.out' });

  return (
    <section className="hero" id="top" onMouseMove={parallax} onMouseLeave={reset}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow"><span /> Privacy wear / prototype 01</p>
        <h1 className="hero-title" aria-label="Your face is not public infrastructure">
          <span className="title-line"><span>Your face is not</span></span>
          <span className="title-line title-outline"><span>public infrastructure.</span></span>
        </h1>
        <p className="hero-description">
          A speculative privacy object for the camera-saturated city. Designed to make consent visible — without asking you to disappear.
        </p>
        <div className="hero-actions">
          <MagneticButton className="primary-button" onClick={onReserve}>
            <span>Explore the prototype</span>
            <ArrowIcon />
          </MagneticButton>
          <span className="edition-note">Edition 01 · 500 units<br />Concept release · 2026</span>
        </div>
      </div>

      <div className="hero-object" data-cursor>
        <div className="object-orbit orbit-a" />
        <div className="object-orbit orbit-b" />
        <div className="hero-model-wrap" ref={modelWrap}>
          <MaskModel className="hero-mask" />
        </div>
        <div className="object-label label-one"><span>01</span> Adaptive NIR array</div>
        <div className="object-label label-two"><span>02</span> Airflow geometry</div>
        <div className="object-label label-three"><span>03</span> Passive by default</div>
      </div>

      <div className="hero-footer">
        <div className="scroll-prompt"><span className="scroll-line" /> Scroll to reveal</div>
        <p>Concept study / Not a certified security device</p>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ['PRIVACY IS A POSTURE', 'VISIBLE CONSENT', 'DESIGNED FOR THE CITY', 'OFFLINE BY DESIGN'];
  return (
    <div className="marquee" aria-label={words.join('. ')}>
      <div className="marquee-track">
        {[...words, ...words].map((word, index) => (
          <span key={`${word}-${index}`}>{word}<i>✳</i></span>
        ))}
      </div>
    </div>
  );
}

function Principle() {
  return (
    <section className="principle section-pad" id="principle">
      <div className="section-index" data-reveal>
        <span>01</span>
        <p>THE PRINCIPLE</p>
      </div>
      <div className="principle-statement">
        <p className="statement-kicker" data-reveal>Every camera asks a question.</p>
        <h2 className="statement-title" data-split>
          VEIL gives you a way to answer.
        </h2>
        <div className="statement-meta" data-reveal>
          <p>
            We imagine personal privacy as a tangible layer: deliberate, expressive, and under your control. The product combines sculptural form with an experimental near-infrared light field.
          </p>
          <p className="mono-note">NO APP / NO CLOUD / NO IDENTITY GRAPH</p>
        </div>
      </div>
    </section>
  );
}

function FaceWireframe() {
  return (
    <svg className="face-wireframe" viewBox="0 0 460 560" aria-hidden="true">
      <defs>
        <linearGradient id="faceFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c847c" />
          <stop offset=".48" stopColor="#252b27" />
          <stop offset="1" stopColor="#0a0d0b" />
        </linearGradient>
        <pattern id="faceGrid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 11h22M11 0v22" stroke="#b5ff45" strokeOpacity=".13" strokeWidth=".5" />
        </pattern>
      </defs>
      <path d="M230 34c-95 0-155 76-155 185 0 73 27 169 78 238 27 36 51 59 77 59s50-23 77-59c51-69 78-165 78-238C385 110 325 34 230 34Z" fill="url(#faceFill)" />
      <path d="M230 34c-95 0-155 76-155 185 0 73 27 169 78 238 27 36 51 59 77 59s50-23 77-59c51-69 78-165 78-238C385 110 325 34 230 34Z" fill="url(#faceGrid)" />
      <path d="M111 216c36-24 76-24 104 1M245 217c28-25 68-25 104-1" fill="none" stroke="#d5dbd6" strokeOpacity=".58" strokeWidth="3" />
      <path d="M230 212c-8 78-18 126-34 155 22 12 46 12 68 0-16-29-26-77-34-155Z" fill="#0b0e0c" stroke="#919991" strokeOpacity=".5" />
      <path d="M161 401c44 27 94 27 138 0" fill="none" stroke="#bbc2bb" strokeOpacity=".47" strokeWidth="3" />
      <g fill="#b5ff45">
        <circle cx="142" cy="224" r="3" /><circle cx="196" cy="222" r="3" />
        <circle cx="264" cy="222" r="3" /><circle cx="318" cy="224" r="3" />
        <circle cx="230" cy="285" r="3" /><circle cx="202" cy="364" r="3" />
        <circle cx="258" cy="364" r="3" /><circle cx="230" cy="412" r="3" />
      </g>
    </svg>
  );
}

function CameraDemo() {
  const [coverage, setCoverage] = useState(34);
  const confidence = Math.max(18, Math.round(94 - coverage * 0.76));
  const status = coverage > 72 ? 'IDENTITY UNRESOLVED' : coverage > 38 ? 'SIGNAL DEGRADED' : 'FACE DETECTED';

  return (
    <section className="camera-demo section-pad">
      <div className="demo-heading">
        <div className="section-index" data-reveal>
          <span>02</span>
          <p>CAMERA VIEW</p>
        </div>
        <h2 data-reveal>Change the<br />machine’s view.</h2>
        <p data-reveal>Drag the signal control to explore the visual concept.</p>
      </div>

      <div className="camera-console" data-reveal data-cursor>
        <div className="console-topbar">
          <div><span className="live-dot" /> LIVE / SIMULATION</div>
          <div>CAM_04 · 24 FPS</div>
          <div className="console-time">14:32:08:18</div>
        </div>
        <div className="camera-viewport">
          <FaceWireframe />
          <div className="privacy-field" style={{ width: `${coverage}%` }}>
            <div className="field-noise" />
            <div className="field-copy">VEIL FIELD ACTIVE</div>
          </div>
          <div className="face-bounds">
            <span className="corner c1" /><span className="corner c2" />
            <span className="corner c3" /><span className="corner c4" />
          </div>
          <div className="scan-line" />
          <div className="landmark-paths" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="viewport-status">
            <span>SUBJECT_001</span>
            <strong className={confidence < 55 ? 'status-low' : ''}>{status}</strong>
          </div>
        </div>
        <div className="console-controls">
          <div className="confidence-block">
            <p>DETECTION<br />CONFIDENCE</p>
            <strong>{confidence}<span>%</span></strong>
          </div>
          <div className="range-block">
            <div className="range-labels"><span>PASSIVE</span><span>VEIL FIELD</span></div>
            <input
              aria-label="Privacy field strength"
              type="range"
              min="0"
              max="100"
              value={coverage}
              onChange={(event) => setCoverage(Number(event.target.value))}
              style={{ '--range-progress': `${coverage}%` }}
            />
            <div className="range-ticks">{Array.from({ length: 17 }, (_, index) => <i key={index} />)}</div>
          </div>
          <p className="simulation-note">Interactive visualization only.<br />Not a performance claim.</p>
        </div>
      </div>
    </section>
  );
}

const anatomyItems = [
  ['01', 'Optical lattice', 'A directional array embedded beneath a translucent structural skin.'],
  ['02', 'Airflow channels', 'A continuous vent path designed around speech and natural breathing.'],
  ['03', 'Soft-contact frame', 'A replaceable medical-grade silicone geometry with zero facial adhesives.'],
  ['04', 'Local controls', 'Physical input. Haptic feedback. No account, pairing, or cloud dependency.'],
];

function Anatomy() {
  const [active, setActive] = useState(0);
  return (
    <section className="anatomy section-pad" id="anatomy">
      <div className="anatomy-copy">
        <div className="section-index" data-reveal>
          <span>03</span>
          <p>ANATOMY</p>
        </div>
        <h2 data-reveal>Built as an<br />object of intent.</h2>
        <div className="anatomy-list" data-reveal>
          {anatomyItems.map(([number, title, copy], index) => (
            <button
              type="button"
              key={number}
              className={active === index ? 'active' : ''}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
            >
              <span>{number}</span>
              <span className="anatomy-item-copy"><strong>{title}</strong><small>{copy}</small></span>
              <PlusIcon />
            </button>
          ))}
        </div>
      </div>
      <div className={`exploded-stage active-${active}`} data-reveal data-cursor>
        <div className="stage-grid" />
        <MaskModel className="exploded-mask" exploded />
        <div className="stage-coordinate coord-a">X 043.202</div>
        <div className="stage-coordinate coord-b">Y 118.594</div>
        <div className="active-part-copy"><span>{anatomyItems[active][0]}</span>{anatomyItems[active][1]}</div>
      </div>
    </section>
  );
}

function MaterialStory() {
  return (
    <section className="material-story">
      <div className="material-image" data-reveal>
        <div className="woven-field">
          {Array.from({ length: 24 }, (_, index) => <span key={index} />)}
        </div>
        <div className="material-chip">
          <span>V/01</span>
          <p>RECYCLED PA12<br />MICRO-TEXTURED</p>
        </div>
      </div>
      <div className="material-copy section-pad">
        <div className="section-index" data-reveal>
          <span>04</span>
          <p>MATERIAL</p>
        </div>
        <h2 data-split>Technical outside.<br />Human inside.</h2>
        <p data-reveal>
          The outer shell is intentionally architectural. Everything that meets the body is quiet: soft, washable, modular, and designed to be repaired instead of replaced.
        </p>
        <div className="material-specs" data-reveal>
          <div><strong>142</strong><span>GRAMS</span></div>
          <div><strong>6H</strong><span>CONCEPT RUNTIME</span></div>
          <div><strong>IP54</strong><span>DESIGN TARGET</span></div>
        </div>
      </div>
    </section>
  );
}

function Product({ onReserve }) {
  const [color, setColor] = useState('graphite');
  const [view, setView] = useState('front');
  return (
    <section className="product section-pad" id="object">
      <div className="product-heading">
        <div className="section-index" data-reveal>
          <span>05</span>
          <p>THE OBJECT</p>
        </div>
        <h2 data-reveal>VEIL/01</h2>
        <p data-reveal>Privacy, made visible.</p>
      </div>

      <div className={`product-view view-${view}`} data-reveal data-cursor>
        <div className="product-backdrop-text">VEIL</div>
        <MaskModel color={color} className="product-mask" />
        <div className="view-controls" aria-label="Product view">
          <button type="button" className={view === 'front' ? 'active' : ''} onClick={() => setView('front')}>FRONT</button>
          <button type="button" className={view === 'angle' ? 'active' : ''} onClick={() => setView('angle')}>ANGLE</button>
        </div>
        <div className="model-code">MODEL / V01–A<br />SERIES / CONCEPT 2026</div>
      </div>

      <div className="product-purchase" data-reveal>
        <div>
          <p className="purchase-label">SELECT FINISH</p>
          <div className="swatches">
            {Object.entries(colors).map(([key, palette]) => (
              <button
                type="button"
                className={color === key ? 'active' : ''}
                key={key}
                onClick={() => setColor(key)}
                aria-label={`Select ${palette.name}`}
              >
                <i style={{ background: palette.base, borderColor: palette.edge }} />
                <span>{palette.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="price-block">
          <span>CONCEPT RESERVATION</span>
          <strong>€10</strong>
          <small>Fully refundable · No payment collected today</small>
        </div>
        <MagneticButton className="primary-button purchase-button" onClick={onReserve}>
          <span>Join the concept list</span>
          <ArrowIcon />
        </MagneticButton>
      </div>
    </section>
  );
}

const faqItems = [
  ['Is VEIL/01 a real product?', 'VEIL/01 is currently a speculative industrial-design concept. The site explores the product language, interaction model, and ethical position before technical validation.'],
  ['Does it guarantee anonymity?', 'No. No wearable can promise anonymity across every camera, angle, spectrum, and recognition system. Any future claims would require independent, reproducible testing.'],
  ['Why make privacy so visible?', 'Because privacy should not feel suspicious or invisible. VEIL imagines consent as a clear social signal and a personal design choice.'],
  ['What happens when I reserve?', 'This prototype does not collect payment. The demo form confirms your interest locally and illustrates the intended launch flow.'],
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="faq section-pad">
      <div className="faq-heading">
        <div className="section-index" data-reveal><span>06</span><p>QUESTIONS</p></div>
        <h2 data-reveal>Before you ask.</h2>
      </div>
      <div className="faq-list" data-reveal>
        {faqItems.map(([question, answer], index) => (
          <div className={`faq-item ${open === index ? 'open' : ''}`} key={question}>
            <button type="button" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{question}</strong>
              <PlusIcon />
            </button>
            <div className="faq-answer"><div><p>{answer}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ onReserve }) {
  return (
    <footer className="footer">
      <div className="footer-cta section-pad">
        <p className="eyebrow" data-reveal><span /> PRIVATE BY NATURE</p>
        <h2 data-split>Own your<br />outline.</h2>
        <MagneticButton className="footer-button" onClick={onReserve}>
          <span>Reserve edition 01</span><ArrowIcon />
        </MagneticButton>
      </div>
      <div className="footer-bottom">
        <a className="brand" href="#top"><LogoMark /><span>VEIL/01</span></a>
        <p>SPECULATIVE PRODUCT CONCEPT<br />DESIGNED FOR HUMAN AGENCY</p>
        <div><a href="#principle">PRINCIPLE</a><a href="#anatomy">ANATOMY</a><a href="#object">OBJECT</a></div>
        <span>© 2026 VEIL STUDY</span>
      </div>
      <div className="footer-word" aria-hidden="true">VEIL</div>
    </footer>
  );
}

function ReservationModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  const submit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="reservation-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-code">V01 / EARLY SIGNAL</div>
        {submitted ? (
          <div className="modal-success">
            <div className="success-mark"><LogoMark /></div>
            <h2 id="modal-title">Signal<br />received.</h2>
            <p>Thank you. This demo keeps your entry in this browser only — no data was transmitted.</p>
            <MagneticButton className="primary-button" onClick={onClose}><span>Return to VEIL</span><ArrowIcon /></MagneticButton>
          </div>
        ) : (
          <>
            <h2 id="modal-title">Enter the<br />first edition.</h2>
            <p>Join the VEIL/01 concept list. No payment, no commitment, no tracking pixel.</p>
            <form onSubmit={submit}>
              <label htmlFor="reserve-email">EMAIL ADDRESS</label>
              <div className="email-row">
                <input
                  id="reserve-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@domain.com"
                  required
                  autoFocus
                />
                <button type="submit" aria-label="Join the list"><ArrowIcon /></button>
              </div>
              <small>PROTOTYPE UI · DATA IS NOT TRANSMITTED</small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-logo"><LogoMark /><span>VEIL/01</span></div>
      <div className="intro-line"><i /></div>
      <span className="intro-code">PRIVATE BY NATURE</span>
    </div>
  );
}

function usePageAnimation(root) {
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const context = gsap.context(() => {
      gsap.set('.hero-eyebrow, .hero-description, .hero-actions, .hero-footer', { opacity: 0, y: 22 });
      gsap.set('.hero-title .title-line > span', { yPercent: 115 });
      gsap.set('.hero-object', { opacity: 0, scale: 0.88, rotate: -3 });
      const intro = gsap.timeline({ delay: 1.45 });
      intro
        .to('.hero-title .title-line > span', { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'power4.out' })
        .to('.hero-object', { opacity: 1, scale: 1, rotate: 0, duration: 1.4, ease: 'expo.out' }, '<.1')
        .to('.hero-eyebrow, .hero-description, .hero-actions, .hero-footer', { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' }, '<.35');

      gsap.to('.hero-model-wrap', {
        yPercent: 24,
        rotate: 4,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
      });
      gsap.to('.hero-title', {
        xPercent: -9,
        opacity: 0.13,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '48% top', end: 'bottom top', scrub: true },
      });

      root.current.querySelectorAll('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 48,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        });
      });

      root.current.querySelectorAll('[data-split]').forEach((element) => {
        const original = element.innerHTML;
        const pieces = original.split(/(<br\s*\/?>|\s+)/).filter(Boolean);
        element.innerHTML = pieces.map((piece) => piece.startsWith('<br') ? piece : piece.trim() ? `<span class="split-word"><i>${piece}</i></span>` : piece).join('');
        gsap.from(element.querySelectorAll('.split-word i'), {
          yPercent: 115,
          duration: 1.05,
          stagger: 0.045,
          ease: 'power4.out',
          scrollTrigger: { trigger: element, start: 'top 82%', once: true },
        });
      });

      gsap.to('.exploded-mask', {
        rotate: 9,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: '.anatomy', start: 'top bottom', end: 'bottom top', scrub: 1.4 },
      });
      gsap.to('.woven-field', {
        backgroundPosition: '120px 180px',
        ease: 'none',
        scrollTrigger: { trigger: '.material-story', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.to('.footer-word', {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    }, root);

    return () => context.revert();
  }, [root]);
}

export default function App() {
  const root = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  usePageAnimation(root);

  return (
    <div className="app" ref={root}>
      <Intro />
      <SignalField />
      <CustomCursor />
      <div className="scroll-progress" />
      <Navigation onReserve={() => setModalOpen(true)} />
      <main>
        <Hero onReserve={() => document.querySelector('#principle')?.scrollIntoView({ behavior: 'smooth' })} />
        <Marquee />
        <Principle />
        <CameraDemo />
        <Anatomy />
        <MaterialStory />
        <Product onReserve={() => setModalOpen(true)} />
        <FAQ />
      </main>
      <Footer onReserve={() => setModalOpen(true)} />
      <ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
