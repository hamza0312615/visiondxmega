import { useState, useEffect } from 'react'

export default function CursorEffect() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      // Spawn 1 subtle, beautiful magical spark on mouse move to keep it clean and elegant
      if (Math.random() > 0.3) {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 4 + 2,
          life: 1, // 1 to 0
        };

        setParticles((prev) => [...prev.slice(-20), newParticle]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const updateParticles = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.05, // Fast fade out to prevent long cluttering trails
          }))
          .filter((p) => p.life > 0)
      );
      animationFrameId = requestAnimationFrame(updateParticles);
    };

    animationFrameId = requestAnimationFrame(updateParticles);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Subtle Floating Mouse Sparks */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-r from-medical-green to-cyan-400 transition-opacity duration-75 shadow-[0_0_6px_#00d4aa]"
          style={{
            left: `${p.x - p.size / 2}px`,
            top: `${p.y - p.size / 2}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.life,
            transform: `scale(${p.life})`,
          }}
        />
      ))}
    </div>
  )
}
