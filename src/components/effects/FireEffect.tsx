import React, { useEffect, useRef } from 'react';

const FireEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const particleCount = Math.floor(containerRect.width / 20); // Adjust particle density
    
    // Create fire particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.classList.add('fire-particle');
      
      // Random position along the bottom edge
      const posX = Math.random() * containerRect.width;
      
      // Random particle size
      const size = Math.random() * 3 + 1;
      
      // Apply styles
      particle.style.left = `${posX}px`;
      particle.style.bottom = '0';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random animation duration
      const duration = Math.random() * 2 + 2;
      particle.style.animation = `riseAndFade ${duration}s ease-out`;
      
      // Add to container
      container.appendChild(particle);
      
      // Remove after animation completes
      setTimeout(() => {
        particle.remove();
      }, duration * 1000);
    };
    
    // Initial particles
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => createParticle(), Math.random() * 2000);
    }
    
    // Continuous particle creation
    const interval = setInterval(() => {
      createParticle();
    }, 300);
    
    return () => {
      clearInterval(interval);
      
      // Clean up all particles when component unmounts
      const particles = container.querySelectorAll('.fire-particle');
      particles.forEach(particle => particle.remove());
    };
  }, []);
  
  return <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden"></div>;
};

export default FireEffect;