import { motion } from 'motion/react';

export const V60EasterEgg = () => {
  return (
    <div className="v60-wrapper flex items-center gap-10 group cursor-default select-none">
      <span className="v60-text text-[12px] uppercase tracking-[1px] text-white/50 opacity-0 -translate-x-[10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 pointer-events-none text-right whitespace-nowrap leading-relaxed font-sans">
        COFFEE'S READY. LET'S WORK. <br />
        <span className="text-brand-accent">mariabordiuh@gmail.com</span>
      </span>
      
      <div className="relative w-[180px] h-[240px]">
        <svg viewBox="0 0 100 120" fill="none" className="w-full h-full overflow-visible">
          {/* Organic Steam */}
          <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M ${45 + i * 5} 25 Q ${50 + i * 5} ${15 - i * 5} ${45 + i * 5} ${5 - i * 5}`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{
                  d: [
                    `M ${45 + i * 5} 25 Q ${50 + i * 5} ${15 - i * 5} ${45 + i * 5} ${5 - i * 5}`,
                    `M ${48 + i * 5} 25 Q ${45 + i * 5} ${12 - i * 5} ${50 + i * 5} ${2 - i * 5}`,
                    `M ${45 + i * 5} 25 Q ${50 + i * 5} ${15 - i * 5} ${45 + i * 5} ${5 - i * 5}`,
                  ],
                  opacity: [0.1, 0.4, 0.1],
                  y: [0, -15, -30],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.8,
                }}
              />
            ))}
          </g>

          {/* Trigger Dot */}
          <motion.circle 
            cx="50" 
            cy="30" 
            r="3" 
            className="fill-brand-accent"
            whileHover={{ scale: 1.5 }}
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Falling Drip (Organic Drip Physics) */}
          <motion.circle
            cx="50"
            cy="70"
            r="1.5"
            className="fill-brand-accent opacity-0 group-hover:opacity-100"
            animate={{
              y: [0, 35],
              opacity: [0, 1, 0],
              scale: [1, 1.2, 0.8]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.5
            }}
          />

          {/* Coffee Liquid (Behind) with Ripple Effect */}
          <g className="coffee-liquid-group">
            <motion.path
              d="M 36 106 Q 50 106 64 106 L 64 106 Q 50 106 36 106 Z"
              fill="var(--accent-color)"
              className="coffee-liquid-fill"
              animate={{
                d: [
                  "M 36 106 Q 50 104 64 106 L 64 106 Q 50 106 36 106 Z",
                  "M 36 106 Q 50 108 64 106 L 64 106 Q 50 106 36 106 Z",
                  "M 36 106 Q 50 104 64 106 L 64 106 Q 50 106 36 106 Z",
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Main Liquid Body */}
            <motion.rect 
              x="36" y="90" width="28" height="16" rx="2" 
              fill="var(--accent-color)" 
              className="coffee-liquid-fill"
            />
          </g>

          {/* Water Stream (Behind) */}
          <motion.line 
            x1="50" y1="70" 
            x2="50" y2="105" 
            stroke="var(--accent-color)" 
            strokeWidth="3" 
            className="water-stream-line"
            initial={{ strokeDashoffset: 35 }}
            whileInView={{ strokeDashoffset: 0 }}
          />
          
          {/* V60 Dripper (Tactile Settle) */}
          <motion.path 
            d="M 25 40 L 75 40 M 30 40 L 45 70 L 55 70 L 70 40" 
            fill="none" 
            stroke="rgba(255,255,255,0.4)" 
            strokeWidth="1.5" 
            className="group-hover:stroke-white/60 transition-colors duration-700"
            whileHover={{ y: 2 }}
          />
          
          {/* Glass Mug with Zero-Overlap Handle */}
          <g>
            <path 
              d="M 35 75 Q 35 72 38 72 L 62 72 Q 65 72 65 75 L 65 80 C 75 80 75 95 65 95 L 65 104 Q 65 107 62 107 L 38 107 Q 35 107 35 104 Z" 
              fill="none" 
              stroke="rgba(255,255,255,0.4)" 
              strokeWidth="1.5" 
              className="group-hover:stroke-white/60 transition-colors duration-700"
            />
          </g>
          
          <style>{`
            .water-stream-line {
              stroke-dasharray: 35;
              stroke-dashoffset: 35;
              transition: stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .group:hover .water-stream-line {
              stroke-dashoffset: 0;
            }
            .coffee-liquid-fill {
              transform: scaleY(0);
              transform-origin: bottom;
              transition: transform 2s 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .group:hover .coffee-liquid-fill {
              transform: scaleY(1);
            }
          `}</style>
        </svg>
      </div>
    </div>
  );
};
