import React, { useEffect, useRef } from 'react';

const FireEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.classList.add('fire-particle');
      
      // Random starting position
      const startX = Math.random() * containerRect.width;
      const drift = (Math.random() - 0.5) * 100; // Random horizontal drift
      const randomY = Math.random() * 50; // Random vertical variation
      const rotation = Math.random() * 360; // Random rotation
      const duration = 2 + Math.random() * 2; // Random duration between 2-4s
      const maxOpacity = 0.3 + Math.random() * 0.5; // Random opacity
      
      // Set custom properties
      particle.style.setProperty('--startX', `${startX}px`);
      particle.style.setProperty('--drift', `${drift}px`);
      particle.style.setProperty('--randomY', `${randomY}px`);
      particle.style.setProperty('--rotation', `${rotation}deg`);
      particle.style.setProperty('--duration', `${duration}s`);
      particle.style.setProperty('--maxOpacity', maxOpacity.toString());
      
      // Random size
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      container.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => particle.remove(), duration * 1000);
    };
    
    const createSparkle = () => {
      const sparkle = document.createElement('div');
      sparkle.classList.add('sparkle');
      
      // Random position
      const left = Math.random() * containerRect.width;
      const top = Math.random() * containerRect.height;
      sparkle.style.left = `${left}px`;
      sparkle.style.top = `${top}px`;
      
      // Random duration
      const duration = 0.5 + Math.random() * 1;
      sparkle.style.setProperty('--duration', `${duration}s`);
      
      container.appendChild(sparkle);
      
      // Remove after a few animations
      setTimeout(() => sparkle.remove(), duration * 1000 * 3);
    };
    
    // Create initial particles
    for (let i = 0; i < 15; i++) {
      setTimeout(() => createParticle(), Math.random() * 2000);
    }
    
    // Create initial sparkles
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createSparkle(), Math.random() * 2000);
    }
    
    // Continuous particle creation
    const particleInterval = setInterval(createParticle, 200);
    const sparkleInterval = setInterval(createSparkle, 500);
    
    return () => {
      clearInterval(particleInterval);
      clearInterval(sparkleInterval);
      
      // Clean up particles
      const particles = container.querySelectorAll('.fire-particle, .sparkle');
      particles.forEach(particle => particle.remove());
    };
  }, []);
  
  return <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden"></div>;
};

export default FireEffect;