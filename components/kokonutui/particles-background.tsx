"use client"

import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import "./style.css"

const GRAVITY_STRENGTH = 15000;   // un filo più alto
const GRAVITY_RADIUS = 150;     // raggio visivo più ampio
const NOISE_ACCEL = 0.25;    // vento molto dolce
const DAMPING = 1;   // attrito leggero (1.97–0.99)
const MAX_SPEED = 2;       // lascia correre la gravità
const WIND_MIN_FACTOR = 0.15;

interface CyberBackgroundProps {
  title?: string
  subtitle?: string
  particleCount?: number
  noiseIntensity?: number
  particleSize?: { min: number; max: number }
  lightMode?: boolean
}

function createNoise() {
  const permutation = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240,
    21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88,
    237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83,
    111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80,
    73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
    189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
    39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210,
    144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84,
    204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78,
    66, 215, 61, 156, 180,
  ]

  const p = new Array(512)
  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i]

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  function lerp(t: number, a: number, b: number) {
    return a + t * (b - a)
  }

  function grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  return {
    simplex3: (x: number, y: number, z: number) => {
      const X = Math.floor(x) & 255
      const Y = Math.floor(y) & 255
      const Z = Math.floor(z) & 255

      x -= Math.floor(x)
      y -= Math.floor(y)
      z -= Math.floor(z)

      const u = fade(x)
      const v = fade(y)
      const w = fade(z)

      const A = p[X] + Y
      const AA = p[A] + Z
      const AB = p[A + 1] + Z
      const B = p[X + 1] + Y
      const BA = p[B] + Z
      const BB = p[B + 1] + Z

      return lerp(
        w,
        lerp(
          v,
          lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
          lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z)),
        ),
        lerp(
          v,
          lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
          lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1)),
        ),
      )
    },
  }
}

const COLOR_SCHEME = {
  light: {
    particle: {
      color: "rgba(0, 0, 0, 0.07)",
    },
    background: "rgba(255, 255, 255, 0.12)",
  },
  dark: {
    particle: {
      color: "rgba(255, 255, 255, 0.07)",
    },
    background: "rgba(0, 0, 0, 0.12)",
  },
} as const

interface Particle {
  isColored: boolean
  x: number
  y: number
  size: number
  velocity: { x: number; y: number }
  life: number
  maxLife: number
}

export default function ParticlesBackground({
  title = "Particles Background",
  subtitle = "Make your website stand out",
  particleCount = 6000,
  noiseIntensity = 0.003,
  particleSize = { min: 0.5, max: 2 },
  lightMode = false,
}: CyberBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const noise = createNoise()
  const [className, setClassName] = useState("")

  useEffect(() => {

    setClassName(lightMode ? "light" : "dark")

    const canvas = canvasRef.current
    if (!canvas) return

    // dentro useEffect, subito dopo aver ottenuto `canvas`
    const mouse = { x: null as number | null, y: null as number | null };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      console.log(mouse.x, mouse.y)
    };

    const handleMouseLeave = () => {
      mouse.x = mouse.y = null; // disattiva gravità quando il mouse esce
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    resizeCanvas()

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * (particleSize.max - particleSize.min) + particleSize.min,
      velocity: { x: 0, y: 0 },
      life: Math.random() * 300,
      maxLife: 100 + Math.random() * 300,
      isColored: false
    }))

    const animate = () => {
      const isDark = !lightMode

      ctx.fillStyle = isDark ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.life += 1
        if (particle.life > particle.maxLife) {
          particle.life = 0
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
        }

        const opacity = Math.sin((particle.life / particle.maxLife) * Math.PI) * 0.15

        const n = noise.simplex3(particle.x * noiseIntensity, particle.y * noiseIntensity, Date.now() * 0.0001)


        // 1. vettore “vento” Perlin (come prima)
        const angle = n * Math.PI * 4;
        let vx = particle.velocity.x;
        let vy = particle.velocity.y;        // 4. eventuale contributo gravitazionale


        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distSq = dx * dx + dy * dy;


          let windFactor = 1;
          if (distSq < GRAVITY_RADIUS * GRAVITY_RADIUS) {
            const dist = Math.sqrt(distSq);
            windFactor = WIND_MIN_FACTOR + (1 - WIND_MIN_FACTOR) * (dist / GRAVITY_RADIUS);
          }

          vx += Math.cos(angle) * NOISE_ACCEL * windFactor;
          vy += Math.sin(angle) * NOISE_ACCEL * windFactor;


          if (distSq < GRAVITY_RADIUS * GRAVITY_RADIUS && distSq > 1e-2) {
            const dist = Math.sqrt(distSq);
            const force = GRAVITY_STRENGTH / distSq;      // ~1/r²
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
            particle.isColored = true
            console.log("is colored", mouse.x, mouse.y)
          }
          else {
            particle.isColored = false
          }
        }

        // 4. damping (simula attrito + stabilizza numericamente)
        vx *= DAMPING;
        vy *= DAMPING;

        // 3. limita la velocità totale per stabilità numerica
        const speedSq = vx * vx + vy * vy;
        if (speedSq > MAX_SPEED * MAX_SPEED) {
          const scale = MAX_SPEED / Math.sqrt(speedSq);
          vx *= scale;
          vy *= scale;
        }

        particle.velocity.x = vx;
        particle.velocity.y = vy;
        particle.x += vx;
        particle.y += vy;

        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        if (particle.isColored) {
          ctx.fillStyle = `rgba(255, 0, 0, ${opacity} )`
        }
        else {
          ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`
        }
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [particleCount, noiseIntensity, particleSize, noise, lightMode])

  return (
    <div className={cn("relative w-full min-h-screen overflow-auto", "bg-white dark:bg-black", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 flex flex-col items-center justify-center"
        >
          <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-black to-black/70 dark:from-white dark:to-white/70 drop-shadow-sm">
            {title}
          </h1>
          <Link target="_blank" rel="noopener noreferrer" href="http://ai.aisoft.sh" className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-black/90 to-black/50 dark:from-white/90 dark:to-white/50 flex items-center justify-center">
            {subtitle}
          </Link>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8"
          >
            <Link
              href="#about"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-300"
            >
              Discover More
            </Link>
          </motion.div>


        </motion.div>

      </div>
      {/* Content Sections */}
      <div className="sections-divs relative z-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm w-full py-20" >
        {/* About Section */}
        <section id="about" className="py-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">About Me</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                I'm Alfredo Ingraldo (AI for short), an AI Engineer and Entrepreneur passionate about leveraging artificial
                intelligence to solve complex problems and create innovative solutions that make businesses stand out.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                With extensive experience in machine learning, deep learning, and web development, I've
                developed AI systems that transform businesses and enhance user experiences.
              </p>
              <div className="flex space-x-4 pt-4">
                <Link
                  href="#contact"
                  className="px-6 py-2 rounded-full border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-400 dark:hover:text-black transition-all duration-300"
                >
                  Contact Me
                </Link>
                <Link
                  href="#projects"
                  className="px-6 py-2 rounded-full border-2 border-gray-400 text-gray-600 dark:text-gray-300 dark:border-gray-500 hover:bg-gray-600 hover:text-white dark:hover:bg-gray-500 transition-all duration-300"
                >
                  View Projects
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative aspect-square max-w-md mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full opacity-20 blur-2xl"></div>
              <img
                src="ai.jpeg"
                alt="Alfredo Ingraldo"
                className="rounded-full object-cover w-full h-full relative z-10 border-4 border-white dark:border-gray-800"
              />
            </motion.div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="py-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900/50">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              We specialize in cutting-edge integration of AI technologies for automation and optimization software,
              in short: we will make your business stand out!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Artificial Intelligence",
                description:
                  "Expert in developing and implementing AI solutions including machine learning models, neural networks, and natural language processing systems.",
                icon: "Brain",
              },
              {
                title: "Data Science",
                description:
                  "Skilled in data analysis, visualization, and extracting actionable insights from complex datasets to drive business decisions.",
                icon: "BarChart",
              },
              {
                title: "Entrepreneurship",
                description:
                  "Experienced in building and scaling tech startups, product development, and creating innovative business models.",
                icon: "Rocket",
              },
              {
                title: "Web Development",
                description:
                  "Vast experience in crafting web apps, prefereably with React, Nextjs and Python.",
                icon: "Network",
              },
              {
                title: "AI Strategy",
                description:
                  "Helping businesses integrate AI into their operations and develop comprehensive AI transformation strategies.",
                icon: "Lightbulb",
              },
              {
                title: "Technical Leadership",
                description:
                  "Leading technical teams to deliver high-quality AI products and solutions on time and within budget.",
                icon: "Users",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                  <span className="text-purple-600 dark:text-purple-400 text-2xl">
                    {/* Icon placeholder - would use Lucide icons in real implementation */}
                    {item.icon === "Brain" && "🧠"}
                    {item.icon === "BarChart" && "📊"}
                    {item.icon === "Rocket" && "🚀"}
                    {item.icon === "Network" && "🔄"}
                    {item.icon === "Lightbulb" && "💡"}
                    {item.icon === "Users" && "👥"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Featured Projects</h2>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              A selection of my most impactful work in AI and technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered documents analysis and comparison",
                description:
                  "A comprehensive python cli that enables the user to get insights over  documents in xlsx format.",
                image: "anya0.jpeg",
              },
              {
                title: "Web-Slayer",
                description:
                  "A Full Stack web-app that allows you to perform any web user sequence of actions in a programmatic way, from web scraping to logins to message sending.",
                image: "pirate.jpeg",
              },
              {
                title: "Aruba Design System",
                description: "The web components design system of the Aruba brand, powered by lit.",
                image: "anya.jpeg",
              },
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={`/${project.image}`}
                    alt={project.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                  <Link
                    href="#contact"
                    className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    Learn more →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mt-12"
          >
            <Link
              href="https://github.com/AI-4o?tab=repositories"
              className="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
            >
              View All Projects
            </Link>
          </motion.div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Get In Touch</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Interested in working together or have a question? Feel free to reach out to me directly.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">✉️</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">ai@aisoft.sh</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">📱</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">+39 3281033780</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">📍</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Viareggio, Italy</p>
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <Link
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-300"
                >
                  <span>𝕏</span>
                </Link>
                <Link
                  href="https://www.linkedin.com/in/alfredo-ingraldo-a85913217/"
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-300"
                >
                  <span>in</span>
                </Link>
                <Link
                  href="https://github.com/AI-4o?tab=repositories"
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-300"
                >
                  <span>G</span>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
            >
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your message..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} AISOFT. All rights reserved.</p>
        </footer>
      </div>

    </div>
  )
}



