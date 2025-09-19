"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Users,
  Zap,
  AppWindow,
  FastForward,
  Code,
  HeartHandshake,
} from 'lucide-react';

// NAVBAR COMPONENT (NO BG)
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-30 flex items-center justify-between px-6 py-4 pointer-events-auto"
      style={{ background: "transparent" }}
    >
      {/* Brand */}
      <div className="flex items-center">
        <span className="text-2xl font-extrabold tracking-tight text-white select-none pr-6">
          Novacal
        </span>
      </div>
      {/* Motto */}
      <div className="flex-1 flex justify-center">
        <span className="text-md md:text-lg text-sky-100 font-medium opacity-80 select-none">
          time management made easy
        </span>
      </div>
      {/* Login/Sign Up CTAs */}
      <div className="flex gap-2">
        <button className="px-5 py-2 rounded-full font-semibold bg-white/10 text-sky-100 border border-white/15 transition-all hover:bg-white/20 hover:text-sky-300 focus:outline-none">
          <a href="/login">Login</a>
        </button>
        <button className="px-5 py-2 rounded-full font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-fuchsia-500 text-white shadow-md hover:scale-105 hover:shadow-lg hover:from-pink-500 hover:to-purple-500 transition-all focus:outline-none">
            <a href="/signup">Sign Up</a>
        </button>
      </div>
    </nav>
  );
}

function randomColor() {
  const palette = [
    "#f9a8d4",
    "#818cf8",
    "#f472b6",
    "#a5b4fc",
    "#7dd3fc",
    "#c084fc",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

const shapes = ["circle", "rect"];
const NUM_PARTICLES = 34;

function BackgroundParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: NUM_PARTICLES }).map(() => ({
      x: Math.random() * window.innerWidth * dpr,
      y: Math.random() * window.innerHeight * dpr,
      r: 15 + Math.random() * 22,
      color: randomColor(),
      shape: shapes[Math.random() > 0.7 ? 1 : 0],
      v: 0.22 + Math.random() * 0.35 + Math.random() * 0.5,
      a: (Math.random() - 0.5) * 0.1,
      o: 0.45 + Math.random() * 0.35,
      t: Math.random() * 360,
    }));

    let animation;

    function draw() {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.o;
        ctx.translate(p.x, p.y);
        if (p.shape === "rect") ctx.rotate(((p.t += 0.002) % 360) || 0);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.rect(-p.r, -p.r, p.r * 2, p.r * 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        p.y -= p.v;
        p.x += p.a;
        if (p.y + p.r < 0) {
          p.y = c.height + p.r;
          p.x = Math.random() * c.width * 0.98;
        }
        if (p.x < -p.r) p.x = c.width + p.r;
        else if (p.x > c.width + p.r) p.x = -p.r;
      }
      animation = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none transition-opacity duration-700"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
        transition: 'opacity 0.4s'
      }}
    />
  );
}

// Animated section
const AnimatedSection = ({ children, sectionId, index, currentIndex }) => {
  return (
    <motion.section
      id={sectionId}
      className="relative h-screen w-full flex items-center justify-center overflow-hidden snap-start px-6 md:px-12"
      initial={{ opacity: 0, y: 100 }}
      animate={{
        opacity: currentIndex === index ? 1 : 0,
        y: currentIndex === index ? 0 : 100,
      }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {children}
    </motion.section>
  );
};

export default function HomePage() {
  const sections = ["hero", "features", "developers", "contact"];
  const [currentSection, setCurrentSection] = useState(0);
  const scrollLocked = useRef(false);

  const handleWheel = useCallback(
    (e) => {
      if (scrollLocked.current) return;
      scrollLocked.current = true;
      setTimeout(() => (scrollLocked.current = false), 1200);
      if (e.deltaY > 0 && currentSection < sections.length - 1) {
        setCurrentSection((prev) => prev + 1);
      } else if (e.deltaY < 0 && currentSection > 0) {
        setCurrentSection((prev) => prev - 1);
      }
    },
    [currentSection, sections.length]
  );

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans snap-y snap-mandatory">
      <Navbar />
      <BackgroundParticles />

      <div className="absolute inset-0 -z-10">
        <motion.div
          className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#232042] via-black to-[#0a0a0a]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <AnimatedSection
          key={sections[currentSection]}
          sectionId={sections[currentSection]}
          index={currentSection}
          currentIndex={currentSection}
        >
          {/* Hero */}
          {currentSection === 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
              <motion.div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 animate-pulse mb-12 shadow-xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1.1 }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <motion.h1
                className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-sky-400 via-blue-400 to-teal-400 bg-clip-text text-transparent drop-shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                Welcome to Novacal
              </motion.h1>
              <motion.p
                className="mt-6 max-w-2xl text-lg md:text-xl text-gray-300 mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
              >
                The future of time management.
              </motion.p>
            </div>
          )}

          {/* Features */}
          {currentSection === 1 && (
            <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto">
              <motion.h2
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-300 via-indigo-300 to-sky-400 bg-clip-text text-transparent mb-8 text-center drop-shadow-[0_2px_12px_rgba(100,0,200,0.2)] mt-10"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
              >
                Features That Set Us Apart
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ml-10 mr-10">
                <motion.div className="bg-gradient-to-tr from-pink-500/[0.13] to-indigo-500/[0.09] border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-fuchsia-400/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-fuchsia-500/60 flex items-center justify-center text-2xl">
                      <FastForward />
                    </div>
                    <span className="text-lg font-medium text-fuchsia-200">
                      Ultra-Fluid Interactions
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    Effortless navigation and frictionless UI that feels truly next-gen.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-tr from-sky-500/[0.12] to-purple-500/[0.09] border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-sky-400/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-sky-400/70 flex items-center justify-center text-2xl">
                      <AppWindow />
                    </div>
                    <span className="text-lg font-medium text-sky-200">
                      Pixel-Perfect Design
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    Pristine layouts and details across every device and size.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-tr from-yellow-400/[0.11] to-fuchsia-400/5 border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-yellow-300/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-300/60 flex items-center justify-center text-2xl">
                      <Zap />
                    </div>
                    <span className="text-lg font-medium text-yellow-200">
                      Blazing Performance
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    Lightning-fast speed lets you focus on what matters, never lagging behind.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-tr from-purple-400/[0.14] to-rose-400/10 border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-purple-300/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-300/75 flex items-center justify-center text-2xl">
                      <Users />
                    </div>
                    <span className="text-lg font-medium text-purple-100">
                      Ease of Use
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    UI so easy to use that other products simply can't compare.
                  </p>
                </motion.div>
              </div>
            </div>
          )}

          {/* Developers */}
          {currentSection === 2 && (
            <motion.div className="relative z-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center px-6">
              <motion.h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-300 via-teal-400 to-cyan-500 bg-clip-text text-transparent mb-8 drop-shadow-lg">
                Meet the Developers
              </motion.h2>
              <motion.p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
                MemoryVault was crafted with passion and precision by Aethel Software. We believe in creating tools that empower, inspire, and boost productivity.
              </motion.p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <motion.div className="bg-gradient-to-br from-green-600/[0.12] to-blue-500/[0.08] border border-white/10 rounded-3xl shadow-2xl !p-8 backdrop-blur-lg flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-4xl mb-4">
                    <Code className="text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-green-300 mb-2">Steven</h3>
                  <p className="text-md text-gray-400 mb-3">Lead Developer</p>
                  <p className="text-sm text-gray-300">
                    Built intuitive interfaces and focused on user experience.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-br from-blue-600/[0.12] to-sky-500/[0.08] border border-white/10 rounded-3xl shadow-2xl !p-8 backdrop-blur-lg flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-sky-400 flex items-center justify-center text-4xl mb-4">
                    <HeartHandshake className="text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-purple-300 mb-2">Kanisk Prakash</h3>
                  <p className="text-md text-gray-400 mb-3">Backend & API Specialist</p>
                  <p className="text-sm text-gray-300">
                    Developed crucial backend building blocks for the backend.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Contact */}
          {currentSection === 3 && (
            <motion.div className="relative z-10 max-w-3xl w-full mx-auto flex flex-col items-center !p-5">
              <motion.div className="absolute -inset-2 bg-gradient-to-br from-sky-500/20 via-teal-500/20 to-blue-400/10 rounded-3xl filter blur-2xl pointer-events-none -z-10" />
              <motion.h2 className="text-4xl md:text-5xl font-extrabold bg-sky-400 bg-clip-text text-transparent mb-5 text-center drop-shadow-lg">
                Let's Connect
              </motion.h2>
              <motion.p className="text-lg md:text-xl text-gray-300 mb-7 leading-relaxed max-w-xl text-center">
                Have an issue with MemoryVault? Want some improvements to the UI/UX? We're here. Drop us a line.
              </motion.p>
              <motion.a
                href="mailto:aethelsoftware@gmail.com"
                className="inline-flex items-center justify-center gap-2 !px-8 !py-4 text-lg font-bold rounded-full shadow-lg text-white bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 hover:scale-105 hover:shadow-2xl hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-500 transition-all duration-300"
              >
                <Mail className="text-white" />
                Contact Us
              </motion.a>
              <motion.div className="mt-7 text-sm text-gray-500 opacity-60">
                <a href="mailto:aethelsoftware@gmail.com">aethelsoftware@gmail.com</a>
              </motion.div>
            </motion.div>
          )}
        </AnimatedSection>
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-300 opacity-70 pointer-events-none select-none animate-bounce">
        Scroll to explore ↓
      </div>
    </div>
  );
}
