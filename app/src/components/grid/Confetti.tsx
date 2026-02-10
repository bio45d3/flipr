'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useBetStore } from '@/store/betStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
}

const COLORS = ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#facc15', '#a855f7', '#ec4899'];

export function Confetti() {
  const bets = useBetStore((s) => s.bets);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevWonCountRef = useRef(0);
  
  useEffect(() => {
    const wonBets = bets.filter((b) => b.status === 'won' && b.isOwn);
    const wonCount = wonBets.length;
    
    // Only trigger on new wins
    if (wonCount > prevWonCountRef.current) {
      // Create explosion of particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        newParticles.push({
          id: Date.now() + i,
          x: 50, // center
          y: 40,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          scale: 0.4 + Math.random() * 0.6,
          velocityX: Math.cos(angle) * (15 + Math.random() * 20),
          velocityY: Math.sin(angle) * (15 + Math.random() * 20) - 10,
        });
      }
      setParticles(newParticles);
      
      // Clear after animation
      setTimeout(() => setParticles([]), 2500);
    }
    
    prevWonCountRef.current = wonCount;
  }, [bets]);

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="fixed pointer-events-none z-[100]"
          initial={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            left: `${particle.x + particle.velocityX}%`,
            top: `${particle.y + particle.velocityY + 30}%`,
            opacity: 0,
            scale: particle.scale,
            rotate: particle.rotation + 180,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2 + Math.random() * 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div
            className="w-4 h-4"
            style={{ 
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
