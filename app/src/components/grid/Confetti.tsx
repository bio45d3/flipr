'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useBetStore } from '@/store/betStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

const COLORS = ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#facc15'];

export function Confetti() {
  const bets = useBetStore((s) => s.bets);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    const wonBets = bets.filter((b) => b.status === 'won');
    
    if (wonBets.length > 0) {
      // Create new particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: 50 + (Math.random() - 0.5) * 40,
          y: 50,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
        });
      }
      setParticles(newParticles);
      
      // Clear after animation
      setTimeout(() => setParticles([]), 2000);
    }
  }, [bets.filter((b) => b.status === 'won').length]);

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="fixed pointer-events-none z-50"
          initial={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            left: `${particle.x + (Math.random() - 0.5) * 30}%`,
            top: `${particle.y + 40 + Math.random() * 20}%`,
            opacity: 0,
            scale: particle.scale,
            rotate: particle.rotation,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5 + Math.random() * 0.5,
            ease: 'easeOut',
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: particle.color }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
