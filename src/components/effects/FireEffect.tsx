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
      const drift = (Math.random() - 0.5) * 120; // Increased drift
      const randomY = Math.random() * 60; // Increased vertical variation
      const rotation = Math.random() * 360;
      const duration = 1.5 + Math.random() * 1.5; // Faster animation
      const maxOpacity = 0.5 + Math.random() * 0.5; // Higher opacity
      
      // Set custom properties
      particle.style.setProperty('--startX', `${startX}px`);
      particle.style.setProperty('--drift', `${drift}px`);
      particle.style.setProperty('--randomY', `${randomY}px`);
      particle.style.setProperty('--rotation', `${rotation}deg`);
      particle.style.setProperty('--duration', `${duration}s`);
      particle.style.setProperty('--maxOpacity', maxOpacity.toString());
      
      // Random size (increased)
      const size = Math.random() * 6 + 3;
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
      const duration = 0.4 + Math.random() * 0.8; // Faster sparkles
      sparkle.style.setProperty('--duration', `${duration}s`);
      
      container.appendChild(sparkle);
      
      // Remove after a few animations
      setTimeout(() => sparkle.remove(), duration * 1000 * 3);
    };
    
    // Create more initial particles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => createParticle(), Math.random() * 2000);
    }
    
    // Create more initial sparkles
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createSparkle(), Math.random() * 2000);
    }
    
    // Increased particle creation frequency
    const particleInterval = setInterval(createParticle, 150);
    const sparkleInterval = setInterval(createSparkle, 400);
    
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