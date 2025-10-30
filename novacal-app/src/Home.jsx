"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mail,
  Users,
  Zap,
  AppWindow,
  FastForward,
  Code,
  HeartHandshake,
  Brain,
  Target,
  Clock,
  Shield,
  Crown,
  Sparkles,
  Calendar,
  CheckCircle2,
  Star,
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
      {/* Motto - Updated for focus */}
      <div className="flex-1 flex justify-center">
        <span className="text-md md:text-lg text-sky-100 font-medium opacity-80 select-none">
          focus deeper • achieve more • stress less
        </span>
      </div>
      {/* Login/Sign Up CTAs */}
      <div className="flex gap-2">
        <button className="px-5 py-2 rounded-full font-semibold bg-white/10 text-sky-100 border border-white/15 transition-all hover:bg-white/20 hover:text-sky-300 focus:outline-none">
          <a href="/login">Login</a>
        </button>
        <button className="px-5 py-2 rounded-full font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-fuchsia-500 text-white shadow-md hover:scale-105 hover:shadow-lg hover:from-pink-500 hover:to-purple-500 transition-all focus:outline-none cursor-pointer">
            <a href="/signup">Join Beta</a>
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
  const sections = ["hero", "problem", "solution", "features", "pioneer", "contact"];
  const [currentSection, setCurrentSection] = useState(0);
  const scrollLocked = useRef(false);
  const prefersReduced = useReducedMotion();

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
          {/* Hero - Updated for focus struggles */}
          {currentSection === 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
              <motion.div
                className="relative mb-10"
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              >
                <motion.div
                  className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-2xl"
                  animate={prefersReduced ? {} : { scale: [1, 1.06, 1], rotate: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* floating icons */}
                <motion.div
                  className="absolute -right-6 -top-6"
                  animate={prefersReduced ? {} : { y: [0, -12, 0], x: [0, 6, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-200/60 flex items-center justify-center shadow-lg">
                    <Brain className="text-sky-200" />
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -left-8 bottom-2"
                  animate={prefersReduced ? {} : { y: [0, 10, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                >
                  <div className="w-9 h-9 rounded-full bg-sky-200/60 flex items-center justify-center shadow-lg">
                    <Target className="text-emerald-200" />
                  </div>
                </motion.div>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-sky-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                Reclaim Your Focus
              </motion.h1>
              <motion.p
                className="mt-6 max-w-2xl text-lg md:text-xl text-gray-300 mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
              >
                For anyone who struggles with <span className="font-bold tracking-light text-emerald-400">distractions</span> and wants to master their time
              </motion.p>
              <motion.div
                className="mt-8 flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
              >
                <button className="px-6 py-3 rounded-full font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-fuchsia-500 text-white shadow-md hover:scale-105 hover:shadow-lg transition-all focus:outline-none cursor-pointer">
                  <a href="/signup">Join Beta</a>
                </button>
                <button className="px-6 py-3 rounded-full font-semibold bg-white/10 text-sky-100 border border-white/15 transition-all hover:bg-white/20 hover:text-sky-300 focus:outline-none">
                  <a href="/learn-more">Learn More</a>
                </button>
              </motion.div>
            </div>
          )}

          {/* Problem Section */}
          {currentSection === 1 && (
            <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto">
              <motion.h2
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-300 via-pink-300 to-purple-400 bg-clip-text text-transparent mb-8 text-center drop-shadow-lg"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
              >
                The Focus Struggle Is Real
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div className="bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-lg">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                    <Clock className="text-rose-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-rose-200 mb-2">Constant Distractions</h3>
                  <p className="text-gray-300 text-sm">Losing focus between tasks and struggling to get back on track</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-lg">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-purple-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-purple-200 mb-2">Task Switching</h3>
                  <p className="text-gray-300 text-sm">Constantly jumping between tasks without finishing what you started</p>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-lg">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="text-blue-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Overwhelm</h3>
                  <p className="text-gray-300 text-sm">Too many tasks, too little direction on where to start</p>
                </motion.div>
              </div>

              <motion.div 
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Traditional calendars weren't built for modern attention spans. They create more stress than they solve.
                </p>
              </motion.div>
            </div>
          )}

          {/* Solution Section */}
          {currentSection === 2 && (
            <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto">
              <motion.h2
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-8 text-center drop-shadow-lg"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
              >
                Designed for Better Focus
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-emerald-200 mb-2">Smart Event System</h3>
                      <p className="text-gray-300 text-sm">
                        Clean, intuitive scheduling that helps you stay organized without the overwhelm
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-cyan-500/10 to-sky-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-cyan-200 mb-2">Advanced Coordination</h3>
                      <p className="text-gray-300 text-sm">
                        Easy event coordination and scheduling that adapts to your workflow
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="text-violet-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-violet-200 mb-2">Deep Customization</h3>
                      <p className="text-gray-300 text-sm">
                        Tailor the app to your unique workflow and preferences
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-200 mb-2">Future Focus Features</h3>
                      <p className="text-gray-300 text-sm">
                        Advanced scheduling algorithms and focus tools in development
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Features */}
          {currentSection === 3 && (
            <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto">
              <motion.h2
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-300 via-indigo-300 to-sky-400 bg-clip-text text-transparent mb-8 text-center drop-shadow-[0_2px_12px_rgba(100,0,200,0.2)]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
              >
                What's Coming Soon
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-10 mr-10">
                <motion.div className="bg-gradient-to-tr from-pink-500/[0.13] to-indigo-500/[0.09] border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-fuchsia-400/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-fuchsia-500/60 flex items-center justify-center text-2xl">
                      <FastForward />
                    </div>
                    <span className="text-lg font-medium text-fuchsia-200">
                      Smart Event System
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    Clean event creation and coordination that helps you stay organized.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-tr from-sky-500/[0.12] to-purple-500/[0.09] border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-sky-400/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-sky-400/70 flex items-center justify-center text-2xl">
                      <Brain />
                    </div>
                    <span className="text-lg font-medium text-sky-200">
                      Deep Customization
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    Tailor the app to your workflow with extensive customization options.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-tr from-yellow-400/[0.11] to-fuchsia-400/5 border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-yellow-300/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-300/60 flex items-center justify-center text-2xl">
                      <Zap />
                    </div>
                    <span className="text-lg font-medium text-yellow-200">
                      Advanced Scheduling
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    AI-powered scheduling algorithms to optimize your time and focus.
                  </p>
                </motion.div>
                <motion.div className="bg-gradient-to-tr from-purple-400/[0.14] to-rose-400/10 border border-white/10 rounded-3xl shadow-2xl !p-8 hover:-translate-y-2 hover:scale-105 hover:shadow-purple-300/20 transition-all duration-300 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-300/75 flex items-center justify-center text-2xl">
                      <Users />
                    </div>
                    <span className="text-lg font-medium text-purple-100">
                      Focus Tools
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed">
                    Specialized features to help minimize distractions and maintain flow state.
                  </p>
                </motion.div>
              </div>
            </div>
          )}

          {/* Pioneer Benefits */}
          {currentSection === 4 && (
            <motion.div className="relative z-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center px-6">
              <motion.h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-400 bg-clip-text text-transparent mb-6 drop-shadow-lg">
                Become a Founding Pioneer
              </motion.h2>
              
              <motion.div className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 border border-amber-500/20 rounded-3xl p-8 mb-8 backdrop-blur-lg max-w-2xl">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown className="text-amber-300 w-8 h-8" />
                  <h3 className="text-2xl font-bold text-amber-200">Exclusive Beta Benefits</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
                  <div className="flex items-center gap-3">
                    <Star className="text-amber-400 w-5 h-5" />
                    <span className="text-gray-200">Free forever for beta users</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="text-amber-400 w-5 h-5" />
                    <span className="text-gray-200">Lifetime premium features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HeartHandshake className="text-amber-400 w-5 h-5" />
                    <span className="text-gray-200">Direct influence on features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Code className="text-amber-400 w-5 h-5" />
                    <span className="text-gray-200">Early access to all updates</span>
                  </div>
                </div>
                
                <p className="text-amber-100 text-lg font-semibold mb-6">
                  Limited to first 1,000 pioneers only
                </p>
                
                <motion.button
                  className="px-8 py-4 text-lg font-bold rounded-full shadow-lg text-white bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:scale-105 hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a href="/signup">Claim Your Pioneer Spot</a>
                </motion.button>
              </motion.div>

              <motion.p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
                Help us build the future of time management. Your feedback will shape the tools that help people focus better and achieve more.
              </motion.p>
            </motion.div>
          )}

          {/* Contact */}
          {currentSection === 5 && (
            <motion.div className="relative w-full max-w-3xl flex flex-col items-center !p-5">
              <motion.div className="absolute -inset-2 bg-gradient-to-br from-sky-500/20 via-teal-500/20 to-blue-400/10 rounded-3xl filter blur-2xl pointer-events-none -z-10" />
              <motion.h2 className="text-3xl md:text-4xl font-extrabold bg-sky-400 bg-clip-text text-transparent mb-5 text-center drop-shadow-lg">
                Help Us Build This
              </motion.h2>
              <motion.p className="text-lg md:text-xl text-gray-300 mb-7 leading-relaxed max-w-xl text-center">
                We're looking for passionate beta testers who want to help create better time management tools for everyone.
              </motion.p>
              <motion.a
                href="mailto:aethelsoftware@gmail.com"
                className="inline-flex items-center justify-center gap-2 !px-8 !py-4 text-lg font-bold rounded-full shadow-lg text-white bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 hover:scale-105 hover:shadow-2xl hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-500 transition-all duration-300"
              >
                <Mail className="text-white" />
                Join Beta
              </motion.a>
              <motion.div className="mt-7 text-sm text-gray-300 opacity-60">
                <a href="mailto:aethelsoftware@gmail.com">aethelsoftware@gmail.com</a>
              </motion.div>
            </motion.div>
          )}

        </AnimatedSection>
      </AnimatePresence>

      {/* Section indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {sections.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSection === index 
                ? 'bg-white scale-125' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            onClick={() => setCurrentSection(index)}
          />
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-300 opacity-70 pointer-events-none select-none animate-bounce">
        Scroll to explore ↓
      </div>
    </div>
  );
}
