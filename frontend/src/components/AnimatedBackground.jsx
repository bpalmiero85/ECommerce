import { useRef, useEffect } from "react";

/**
 * AnimatedBackground Component
 *
 * Renders a full-screen animated starry background using an HTML5 canvas.
 * The stars gently move, flicker, and wrap around the screen edges.
 *
 * @component
 *
 * @param {Object} [props] - Optional component properties.
 * @param {number} [props.numStars=200] - Number of stars to render in the background.
 * @param {string[]} [props.colors=["rgb(144, 0, 255)", "rgba(0, 255, 0, 0.7)", "rgb(0, 42, 255)", "rgba(255, 217, 0, 0.76)"]]
 *    - Array of star colors, chosen randomly for each star.
 *
 * @returns {JSX.Element} A fixed position canvas element displaying an animated background.
 */

export default function AnimatedBackground({
  numStars = 200,
  colors = [
    "rgb(144, 0, 255)",
    "rgba(0,255,0,0.7)",
    "rgb(0, 42, 255)",
    "rgba(255, 217, 0, 0.76)",
  ],
}) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.max(width, height);
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    radGrad.addColorStop(0, "rgb(11, 11, 121)");
    radGrad.addColorStop(1, "rgb(179, 0, 255)");
    const stars = [];

    // build starfield
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        flicker: Math.random() * 0.05 + 0.02,
      });
    }

    function draw() {
      // semi-transparent black to fade trails
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      for (const s of stars) {
        // flicker radius
        s.r += Math.sin(Date.now() * s.flicker) * 0.03;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.abs(s.r), 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        // move
        s.x += s.dx;
        s.y += s.dy;

        // wrap around
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;
      }

      requestAnimationFrame(draw);
    }

    draw();

    // handle resize
    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [numStars, colors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
