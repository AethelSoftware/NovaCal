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
  AlertTriangle,
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
  const sections = ["hero", "struggle", "solution", "features", "pioneer", "contact"];
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
          {/* Hero - Direct emotional hook */}
          {currentSection === 0 && (
            <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center px-6">
              {/* Animated Graphic */}
              <motion.div
                className="relative mb-8 lg:mb-0 lg:mr-12"
                initial={{ scale: 0.86, opacity: 0, x: -50 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
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

              {/* Text Content */}
              <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left max-w-2xl">
                <motion.h1
                  className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    Tired of fighting<br />
                    <span className="text-white">your own brain</span><br />
                    every day?
                  </span>
                </motion.h1>
                
                <motion.p
                  className="text-lg md:text-xl text-gray-300 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  What if your calendar <span className="text-sky-300 font-semibold">actually worked</span> with your focus struggles instead of against them?
                </motion.p>

                <motion.div
                  className="flex gap-4 flex-col sm:flex-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                >
                  <button className="px-6 py-3 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 rounded-full hover:scale-105 transition-transform group">
                    <a href="/signup" className="flex items-center gap-2">
                      Yes, I Need This 
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  </button>
                  <button className="px-6 py-3 text-lg font-semibold bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-all">
                    <a href="#solution">Show Me How</a>
                  </button>
                </motion.div>
              </div>
            </div>
          )}

          {/* The Struggle - Relatable pain points */}
          {currentSection === 1 && (
            <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-center mb-8"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                  Sound Familiar?
                </span>
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    icon: <Clock className="w-6 h-6" />, 
                    title: "Time Blindness", 
                    description: "2 hours feels like 20 minutes. Deadlines sneak up while you're stuck scrolling." 
                  },
                  { 
                    icon: <AlertTriangle className="w-6 h-6" />, 
                    title: "Task Paralysis", 
                    description: "You know what needs doing, but starting feels impossible. So you do nothing instead." 
                  },
                  { 
                    icon: <Brain className="w-6 h-6" />, 
                    title: "Mental Overwhelm", 
                    description: "Too many tabs in your brain. Too many choices. Too much noise. Complete shutdown." 
                  },
                  { 
                    icon: <Target className="w-6 h-6" />, 
                    title: "The Guilt Cycle", 
                    description: "You had a plan. You failed the plan. Now you feel guilty about failing. Rinse, repeat." 
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-lg hover:bg-white/10 transition-all h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div className="text-center mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <p className="text-gray-300">
                  It's not you. It's your tools. Regular calendars were built for neurotypical brains.
                </p>
              </motion.div>
            </div>
          )}

          {/* Solution - The transformation */}
          {currentSection === 2 && (
            <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto px-4">
              {/* Header with Button */}
              <motion.div 
                className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex-1 text-center lg:text-left">
                  <motion.h2
                    className="text-3xl md:text-4xl font-bold mb-3"
                  >
                    <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      Imagine This Instead
                    </span>
                  </motion.h2>
                  <motion.p
                    className="text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    What if your calendar was designed for <span className="text-emerald-300 font-semibold">how your brain actually works</span>?
                  </motion.p>
                </div>
                
                <motion.div
                  className="flex-shrink-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button className="px-6 py-3 text-lg font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full hover:scale-105 hover:shadow-2xl transition-all duration-300 group">
                    <a href="/signup" className="flex items-center gap-2 whitespace-nowrap">
                      I Want My Brain Back
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  </button>
                </motion.div>
              </motion.div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Clock className="w-8 h-8" />,
                    title: "Visual Time Understanding",
                    description: "A calendar that shows time visually so you actually understand how long things take",
                    gradient: "from-blue-500/20 to-cyan-500/10"
                  },
                  {
                    icon: <Zap className="w-8 h-8" />,
                    title: "Panic-Free Transitions", 
                    description: "Gentle reminders that help you transition between tasks without the panic",
                    gradient: "from-emerald-500/20 to-green-500/10"
                  },
                  {
                    icon: <Target className="w-8 h-8" />,
                    title: "Brain-Friendly Steps",
                    description: "A system that breaks down overwhelming projects into brain-friendly steps",
                    gradient: "from-purple-500/20 to-pink-500/10"
                  },
                  {
                    icon: <Brain className="w-8 h-8" />,
                    title: "Focus Cycle Matching",
                    description: "Tools that work with your focus cycles, not against them",
                    gradient: "from-orange-500/20 to-red-500/10"
                  },
                  {
                    icon: <HeartHandshake className="w-8 h-8" />,
                    title: "Guilt-Free Adaptability",
                    description: "No more guilt when plans change - because the system adapts with you",
                    gradient: "from-indigo-500/20 to-blue-500/10"
                  },
                  {
                    icon: <Sparkles className="w-8 h-8" />,
                    title: "Built for You",
                    description: "Every feature designed with ADHD and focus challenges in mind",
                    gradient: "from-cyan-500/20 to-emerald-500/10"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-br ${item.gradient} border border-white/10 rounded-2xl p-6 backdrop-blur-lg hover:scale-105 hover:shadow-2xl hover:border-white/20 transition-all duration-300 group h-full`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <div className="text-emerald-300">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed flex-grow">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Features - MVP status clear */}
          {currentSection === 3 && (
            <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="bg-gradient-to-r from-fuchsia-300 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                  Solid Foundation, Amazing Future
                </span>
              </motion.h2>
              
              <motion.p
                className="text-center text-gray-300 mb-4 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                We're starting with a powerful MVP and building the ADHD-friendly features <span className="text-emerald-300 font-semibold">with your feedback</span>
              </motion.p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div className="bg-gradient-to-tr from-sky-500/10 to-blue-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-sky-400/70 flex items-center justify-center">
                      <Calendar className="text-sky-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-sky-200">Smart Event System</h3>
                      <div className="text-xs text-gray-400 font-medium">COMING SOON</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Clean, intuitive scheduling that helps you stay organized without the overwhelm
                  </p>
                </motion.div>

                <motion.div className="bg-gradient-to-tr from-purple-500/10 to-pink-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-400/70 flex items-center justify-center">
                      <AppWindow className="text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-purple-200">Deep Customization</h3>
                      <div className="text-xs text-gray-400 font-medium">COMING SOON</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Tailor the app to your unique workflow and visual preferences
                  </p>
                </motion.div>

                <motion.div className="bg-gradient-to-tr from-amber-500/10 to-orange-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-400/70 flex items-center justify-center">
                      <Zap className="text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-200">Focus Tools</h3>
                      <div className="text-xs text-gray-400 font-medium">COMING SOON</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    ADHD-friendly features to minimize distractions and maintain flow state
                  </p>
                </motion.div>

                <motion.div className="bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-400/70 flex items-center justify-center">
                      <Brain className="text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-200">Smart Scheduling</h3>
                      <div className="text-xs text-gray-400 font-medium">COMING SOON</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    AI-powered scheduling that understands energy levels and focus patterns
                  </p>
                </motion.div>
              </div>
            </div>
          )}

          {/* Pioneer Benefits */}
          {currentSection === 4 && (
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4 text-center">
              <motion.h2
                className="text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  Stop Fighting Yourself
                </span>
              </motion.h2>

              <motion.p
                className="text-lg text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Join the first calendar built for focus-challenged brains
              </motion.p>

              <motion.div
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Crown className="text-amber-300 w-6 h-6" />
                  <h3 className="text-xl font-bold text-amber-200">Founding Member Benefits</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-left mb-6">
                  {[
                    { icon: Star, text: "Free forever - no subscription ever" },
                    { icon: Shield, text: "Lifetime premium features" },
                    { icon: HeartHandshake, text: "Direct influence on ADHD features" },
                    { icon: Code, text: "Early access to all updates" }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <benefit.icon className="text-amber-400 w-4 h-4" />
                      <span className="text-white text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <motion.button
                    className="w-full py-3 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 rounded-full hover:scale-105 transition-transform"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <a href="/signup">Get Early Access - It's Free</a>
                  </motion.button>
                  <p className="text-amber-200 text-xs">
                    Limited to first 500 members • No credit card required
                  </p>
                </div>
              </motion.div>

              <motion.p
                className="text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                You've tried everything else. Isn't it time you tried something that actually understands you?
              </motion.p>
            </div>
          )}

          {/* Contact */}
          {currentSection === 5 && (
            <motion.div className="relative w-full max-w-xl flex flex-col items-center px-4 text-center">
              <motion.div className="absolute -inset-2 bg-gradient-to-br from-sky-500/20 via-teal-500/20 to-blue-400/10 rounded-3xl filter blur-2xl pointer-events-none -z-10" />
              <motion.h2 className="text-2xl md:text-3xl font-extrabold bg-sky-400 bg-clip-text text-transparent mb-4">
                Help Us Build This
              </motion.h2>
              <motion.p className="text-gray-300 mb-6 leading-relaxed">
                We're looking for passionate beta testers who want to help create better time management tools for everyone.
              </motion.p>
              <motion.a
                href="mailto:aethelsoftware@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-bold rounded-full shadow-lg text-white bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 hover:scale-105 hover:shadow-2xl transition-all duration-300"
              >
                <Mail className="text-white" />
                Join Beta!
              </motion.a>
              <motion.div className="mt-6 text-sm text-gray-300 opacity-60">
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