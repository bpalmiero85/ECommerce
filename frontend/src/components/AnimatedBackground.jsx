// import { useRef, useEffect } from "react";

// const DEFAULT_COLORS = [
//   "rgb(144, 0, 255)",
//   "rgba(0,255,0,0.7)",
//   "rgb(0, 42, 255)",
//   "rgba(255, 217, 0, 0.76)",
// ];

// export default function AnimatedBackground({
//   numStars = 200,
//   colors = DEFAULT_COLORS, // stable default
// }) {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     const resize = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//     };
//     resize();

//     // velocities in pixels-per-second (time based)
//     const stars = Array.from({ length: numStars }, () => ({
//       x: Math.random() * canvas.width,
//       y: Math.random() * canvas.height,
//       r: Math.random() * 1.5 + 0.5,
//       dx: (Math.random() - 0.5) * 18, // ~0.3px/frame at 60fps -> 18px/s
//       dy: (Math.random() - 0.5) * 18,
//       color: colors[Math.floor(Math.random() * colors.length)],
//       flickerHz: Math.random() * 2 + 0.5, // 0.5–2.5 cycles per second
//     }));

//     let rafId;
//     let last = performance.now();

//     const draw = (now) => {
//       const dt = Math.min(0.033, (now - last) / 1000); // seconds; clamp to 33ms
//       last = now;

//       // background gradient
//       const cx = canvas.width / 2;
//       const cy = canvas.height / 2;
//       const maxR = Math.max(canvas.width, canvas.height);
//       const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
//       radGrad.addColorStop(0, "rgb(11, 11, 121)");
//       radGrad.addColorStop(1, "rgb(179, 0, 255)");

//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.fillStyle = radGrad;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       for (const s of stars) {
//         // flicker
//         s.r = Math.max(0.2, s.r + Math.sin(now * 0.001 * s.flickerHz) * 0.03);

//         // move (time-based)
//         s.x = (s.x + s.dx * dt + canvas.width) % canvas.width;
//         s.y = (s.y + s.dy * dt + canvas.height) % canvas.height;

//         ctx.beginPath();
//         ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
//         ctx.fillStyle = s.color;
//         ctx.shadowColor = s.color;
//         ctx.shadowBlur = 8;
//         ctx.fill();
//       }

//       rafId = requestAnimationFrame(draw);
//     };

//     rafId = requestAnimationFrame(draw);
//     window.addEventListener("resize", resize);

//     // IMPORTANT: clean up both the listener and the rAF
//     return () => {
//       cancelAnimationFrame(rafId);
//       window.removeEventListener("resize", resize);
//     };
//     // Only recreate when the numeric count or the actual palette changes
//   }, [numStars, colors.join("|")]);

//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         position: "fixed",
//         inset: 0,
//         width: "100vw",
//         height: "100vh",
//         zIndex: -1,
//         pointerEvents: "none",
//       }}
//     />
//   );
// }