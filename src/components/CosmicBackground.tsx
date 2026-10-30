import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CosmicBackgroundProps {
  themeColor?: string;
  intensity?: number;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ 
  themeColor = '#f59e0b',
  intensity = 1.0 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Particle Stars Geometry
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseColor = new THREE.Color(themeColor);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Cylindrical/spherical field
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 80;
      positions[i + 2] = (Math.random() - 0.5) * 60;

      // Color variation
      const tint = (Math.random() - 0.5) * 0.3;
      const c = baseColor.clone().offsetHSL(tint, 0, (Math.random() - 0.5) * 0.2);
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const material = new THREE.PointsMaterial({
      size: 0.18 * intensity,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Dynamic Floating Lanterns / Energy Orbs
    const orbGroup = new THREE.Group();
    const orbCount = 25;
    const orbs: { mesh: THREE.Mesh; speedY: number; wobbleSpeed: number; offset: number }[] = [];

    const orbGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(themeColor),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < orbCount; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );
      orbGroup.add(mesh);
      orbs.push({
        mesh,
        speedY: 0.02 + Math.random() * 0.03,
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2
      });
    }
    scene.add(orbGroup);

    // Mouse Tracking for Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Window Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = targetX * 3;
      camera.position.y = -targetY * 3;
      camera.lookAt(scene.position);

      // Rotate cosmic dust
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = elapsed * 0.01;

      // Animate floating lanterns/diyas
      orbs.forEach(({ mesh, speedY, wobbleSpeed, offset }) => {
        mesh.position.y += speedY;
        mesh.position.x += Math.sin(elapsed * wobbleSpeed + offset) * 0.02;
        if (mesh.position.y > 20) {
          mesh.position.y = -20;
          mesh.position.x = (Math.random() - 0.5) * 40;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [themeColor, intensity]);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0" />;
};
