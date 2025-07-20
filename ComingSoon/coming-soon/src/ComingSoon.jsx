import { useState, useEffect, useRef } from "react";
import "./ComingSoon.css";
import AnimatedBg from "./AnimatedBg";

const ComingSoon = () => {
  return (
    <div className="product-page-container">
      {/* 1. SVG banner at top (fixed) */}
      <div className="banner-container">
        <svg
          className="banner"
          viewBox="0 0 2000 200"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* original background */}
            <radialGradient id="bg-radial" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#39FF14" />
              <stop offset="50%" stopColor="#1a001a" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* original text fill */}
            <linearGradient
              id="text-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#222222" />
              <stop offset="50%" stopColor="#5f0aa6" />
              <stop offset="100%" stopColor="#222222" />
            </linearGradient>

            {/* glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* animated pink band */}
            <linearGradient
              id="shine-grad"
              gradientUnits="userSpaceOnUse"
              x1="-150%"
              y1="0%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#39FF14" stopOpacity="0" />
              <stop offset="30%" stopColor="#39FF14" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#39FF14" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />

              <animate
                attributeName="x1"
                values="-150%;200%"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0%;350%"
                dur="4s"
                repeatCount="indefinite"
              />
            </linearGradient>

            {/* mask to reveal just that band */}
            <mask
              id="shine-mask"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="2000"
              height="500"
            >
              <rect width="2000" height="500" fill="black" />
              <rect width="2000" height="500" fill="url(#shine-grad)" />
            </mask>
          </defs>

          {/* background */}
          <rect width="100%" height="100%" fill="url(#bg-radial)" />

          {/* text + glow */}
          <g
            fontFamily="Creepster, Griffy, cursive"
            fontSize="120"
            textAnchor="middle"
            dominantBaseline="middle"
            filter="url(#glow)"
          >
            {/* base gradient text */}
            <text
              x="50%"
              y="50%"
              fill="url(#text-gradient)"
              className="main-title"
            >
              Goth &amp; Glitter
            </text>

            {/* white overlay text, masked so only the shine band shows */}
            <text
              x="50%"
              y="50%"
              fill="#FF007F"
              mask="url(#shine-mask)"
              className="main-title"
            >
              Goth &amp; Glitter
            </text>

            {/* rocking animation */}
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-3 1000 250; 3 1000 250; -3 1000 250"
              dur="5s"
              repeatCount="indefinite"
            />
            {/* original sparkles */}
          </g>
          <text
            x="150"
            y="105"
            font-size="24"
            fill="#E1BEE7"
            text-anchor="middle"
            className="banner-star"
          >
            <animate
              attributeName="x"
              from="-50"
              to="435"
              dur="15.5s"
              begin="0s; shooting.restart+3s"
              id="shooting"
              repeatCount="indefinite"
            />
            ⭐
          </text>

          <text
            x="1600"
            y="155"
            font-size="24"
            fill="#E1BEE7"
            text-anchor="middle"
            className="shooting-star"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              keyTimes="0;0.5;1"
              dur="3.2s"
              begin="1s"
              repeatCount="indefinite"
            />
            ⭐
          </text>

          <text
            x="50"
            y="80"
            fontSize="32"
            fill="#39FF14"
            filter="url(#glow)"
            className="color-star"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="2s"
              repeatCount="indefinite"
            ></animate>
          </text>

          {/* Neon Blue ★ */}
          <text
            x="1910"
            y="70"
            fontSize="32"
            fill="#00FFFF"
            filter="url(#glow)"
            opacity="0.6"
            className="color-star"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="7.2s"
              begin="1s"
              repeatCount="indefinite"
            ></animate>
          </text>
          <text
            x="1860"
            y="120"
            fontSize="32"
            fill="#D000FF"
            filter="url(#glow)"
            opacity="0.6"
            className="color-star"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="1s"
              repeatCount="indefinite"
            ></animate>
          </text>

          {/* Neon Purple ★ */}
          <text
            x="350"
            y="60"
            fontSize="32"
            fill="#D000FF"
            filter="url(#glow)"
            className="color-star"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.4;0.2"
              keyTimes="0;0.5;1"
              dur="2.2s"
              begin="1.7s"
              repeatCount="indefinite"
            ></animate>
          </text>

          {/* Neon Orange ★ */}
          <text
            x="230"
            y="115"
            fontSize="32"
            fill="#FF7F00"
            filter="url(#glow)"
            className="color-star"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1.7s"
              repeatCount="indefinite"
            ></animate>
          </text>

          <text
            x="1710"
            y="75"
            fontSize="32"
            fill="#FF7F00"
            filter="url(#glow)"
            className="color-star"
          >
            ★
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1.7s"
              repeatCount="indefinite"
            ></animate>
          </text>

          <text x="450" y="110" font-size="24" fill="#E1BEE7">
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              keyTimes="0;0.5;1"
              dur="2.5s"
              repeatCount="indefinite"
            />
            ✨
          </text>

          <text x="1500" y="110" font-size="24" fill="#E1BEE7">
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              keyTimes="0;0.5;1"
              dur="2.5s"
              repeatCount="indefinite"
            />
            ✨
          </text>

          <circle
            cx="300"
            cy="100"
            r="5"
            fill="#00FF00"
            filter="url(#glow)"
            className="circle1"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="1600"
            cy="145"
            r="7"
            fill="#1E90FF"
            filter="url(#glow)"
            className="circle2"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="1715"
            cy="120"
            r="6"
            fill="#FFD700"
            filter="url(#glow)"
            className="circle3"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="3.2s"
              begin="0.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="800"
            cy="150"
            r="4"
            fill="#4A148C"
            filter="url(#glow)"
            className="circle4"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="1800"
            cy="60"
            r="5"
            fill="#E1BEE7"
            filter="url(#glow)"
            className="circle5"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="3.6s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="150"
            cy=" 50"
            r="3"
            fill="#E1BEE7"
            filter="url(#glow)"
            className="circle6"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="70"
            cy="160"
            r="4"
            fill="#FFD700"
            filter="url(#glow)"
            className="circle7"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="5.2s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="200"
            cy=" 120"
            r="6"
            fill="#39FF14"
            filter="url(#glow)"
            className="circle8"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="140"
            cy="120"
            r="2"
            fill="#FF007F"
            filter="url(#glow)"
            className="circle9"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="3.2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="1790"
            cy="160"
            r="5"
            fill="#00FF00"
            filter="url(#glow)"
            className="circle10"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>

          <circle
            cx="1770"
            cy="105"
            r="5"
            fill="#00FF00"
            filter="url(#glow)"
            className="circle11"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.5;0.2"
              keyTimes="0;0.5;1"
              dur="4.2s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
      {/* 2. Animated background */}
      <div className="animated-bg">
        <AnimatedBg />
      </div>
      {/* 3. Main content wrapper */}
      <div className="coming-soon-master-wrapper">
        <div className="coming-soon-desc-container">
          {/* Falling stars overlay */}
          <div className="glitter-effect">
            <div className="glitter-particle">✨</div>
            <div className="glitter-particle">✦</div>
            <div className="glitter-particle">✧</div>
            <div className="glitter-particle">✨</div>
          </div>

          {/* Descriptive text */}
          <div className="coming-soon-desc">
            <p>
              <strong>Goth & Glitter</strong> is where spooky meets sparkly and
              cute meets creepy. Blending gothic edge with neon brights,
              glitter, and just the right amount of dark. From eerie accessories
              to scary-cute fidgets and monsters, it&apos;s a brand that
              celebrates the weird, the whimsical, and the wonderfully glam!
              <br />
              <br />
              (…oh, and I guess some normal stuff too!)
            </p>
          </div>

          {/* "Coming Soon" ribbon */}
          <div className="coming-soon-wrapper">
            <img src="./tape.svg" className="ribbon"></img>
            <h3 className="coming-soon">Coming Soon!</h3>
          </div>

          {/* Product categories grid */}
          <div className="coming-soon-grid">
            <div className="category-wrapper">
              {/* Category: Monsters Figurines */}
              {/* <div className="monster-container">
                <h3 className="monsters-title">Monsters Figurines:</h3>
                <div className="monster-figures">
                  <img
                    className="sludge-monster1"
                    src="./sludge-monster-clipped.png"
                  ></img>
                  <img className="monstrella1" src="./monstrella.png"></img>
                </div>
              </div> */}

              {/* Category: Fidget Buddies */}
              {/* <div className="fidget-container">
                <h3 className="monsters-title">Fidget Buddies:</h3>
                <div className="fidget-figures">
                  <img
                    className="sludge-monster"
                    src="./sludge-monster-clipped.png"
                  />
                  <img className="monstrella" src="./monstrella.png" />
                </div>
              </div> */}
              {/* Category: Jewelry */}
              <div className="jewelry-container">
                {/* <h3 className="monsters-title">Jewelry: </h3> */}
                <div className="fidget-figures">
                  <img
                    className="sludge-monster"
                    src="./sludge-monster-clipped.png"
                  />
                  <img className="monstrella" src="./monstrella.png" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="footer">
        <div>
          <img className="gglogo" src="./gglogo.svg"></img>
        </div>

        <p className="footer-text">
          © 2025 Goth & Glitter. Conjuring cute spooky magic through 3D
          printing.
        </p>
      </footer>
    </div>
  );
};

export default ComingSoon;
