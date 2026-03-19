"use client"

/**
 * Pure CSS animated background — replaces the Canvas-based particle animation
 * that was causing repeated memory crashes and page freezes.
 * Uses CSS keyframes with hardware-accelerated transforms only.
 */
export function MoleculeCanvas() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" style={{ opacity: 0.35 }}>
      {/* Floating dots using pure CSS */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            background: "rgba(0,198,255,0.5)",
            left: `${8 + (i * 7.5) % 90}%`,
            top: `${5 + (i * 13.3) % 85}%`,
            animation: `floatDot${i % 4} ${18 + (i % 5) * 4}s ease-in-out infinite`,
            animationDelay: `${i * -2.5}s`,
            boxShadow: "0 0 6px rgba(0,198,255,0.3)",
          }}
        />
      ))}

      {/* Connecting line illusions using gradients */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`line-${i}`}
          className="absolute"
          style={{
            width: `${80 + i * 30}px`,
            height: "1px",
            background: `linear-gradient(90deg, transparent, rgba(0,198,255,${0.08 + i * 0.02}), transparent)`,
            left: `${10 + i * 16}%`,
            top: `${20 + i * 14}%`,
            transform: `rotate(${-30 + i * 25}deg)`,
            animation: `floatLine ${20 + i * 5}s ease-in-out infinite`,
            animationDelay: `${i * -3}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes floatDot0 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -20px); }
          50% { transform: translate(-10px, -35px); }
          75% { transform: translate(20px, -15px); }
        }
        @keyframes floatDot1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-20px, 15px); }
          50% { transform: translate(10px, 30px); }
          75% { transform: translate(-15px, 10px); }
        }
        @keyframes floatDot2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(25px, 10px); }
          50% { transform: translate(-15px, -20px); }
          75% { transform: translate(10px, 25px); }
        }
        @keyframes floatDot3 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-10px, -25px); }
          50% { transform: translate(20px, 15px); }
          75% { transform: translate(-25px, -10px); }
        }
        @keyframes floatLine {
          0%, 100% { opacity: 0.5; transform: rotate(var(--r, 0deg)) translateY(0); }
          50% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(-15px); }
        }
      `}</style>
    </div>
  )
}
