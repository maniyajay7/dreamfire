/**
 * src/engine/VideoTextureManager.js - VideoTexture & Dimensional Portal Pipeline
 * DreamFire Milestone M4 / Feature F11:
 * - HTML5 Video Element Construction with Autoplay & CORS Compliance
 * - THREE.VideoTexture binding with automatic procedural CanvasTexture fallback
 * - Procedural dynamic loops for all 6 canonical categories
 * - 3D Stargate Dimensional Portal Gateway Geometry with rotating rune rings
 * - 5-Step Hardware Video Decoder Teardown Protocol
 */

import * as THREE_MODULE from 'three';

const THREE = typeof window !== 'undefined' && window.THREE ? window.THREE : THREE_MODULE;

export class VideoTextureManager {
  /**
   * @param {object} [ThreeInstance] - Optional Three.js instance
   */
  constructor(ThreeInstance) {
    this.T = ThreeInstance || THREE;
    this.videos = new Map();
    this.textures = new Map();
    this.proceduralAnimators = [];
    this.portalAnimators = [];
  }

  /**
   * 1. createVideoElement: Creates an HTML5 <video> element configured for
   * safe muted autoplay, inline mobile playback, and CORS WebGL compliance.
   *
   * @param {string} srcUrl - Path or URL to the video loop
   * @param {object} [options] - Configuration options
   * @returns {HTMLVideoElement|object}
   */
  createVideoElement(srcUrl, options = {}) {
    if (this.videos.has(srcUrl)) {
      return this.videos.get(srcUrl);
    }

    if (typeof document === 'undefined') {
      // Headless / Node.js test environment mock
      const mockVideo = {
        src: srcUrl,
        crossOrigin: 'anonymous',
        loop: true,
        muted: true,
        playsInline: true,
        autoplay: true,
        paused: false,
        play: () => Promise.resolve(),
        pause: () => {},
        removeAttribute: () => {},
        load: () => {},
        remove: () => {}
      };
      this.videos.set(srcUrl, mockVideo);
      return mockVideo;
    }

    const video = document.createElement('video');
    video.crossOrigin = options.crossOrigin || 'anonymous';
    video.loop = options.loop !== false;
    video.muted = true; // MANDATORY: Required by browser autoplay policies
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.autoplay = options.autoplay !== false;
    video.preload = options.preload || 'auto';
    video.src = srcUrl;

    // Suppress unhandled play rejections (e.g. user hasn't interacted yet)
    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Will resume automatically upon first interaction
        });
      }
    } catch {}

    this.videos.set(srcUrl, video);
    return video;
  }

  /**
   * 2. createVideoTexture: Returns a THREE.VideoTexture with graceful fallback
   * to a procedural THREE.CanvasTexture if video is unsupported or fails.
   *
   * @param {string} srcUrl - Video loop asset path
   * @param {string} [category] - Realm category for fallback visual synthesis
   * @param {object} [options] - Texture options
   * @returns {THREE.Texture}
   */
  createVideoTexture(srcUrl, category = 'Sacred & Spiritual', options = {}) {
    if (this.textures.has(srcUrl)) {
      return this.textures.get(srcUrl);
    }

    // Fallback in headless / non-DOM environments
    if (typeof document === 'undefined' || typeof HTMLVideoElement === 'undefined') {
      const fallbackTex = this.createProceduralCanvasTexture(category, 512, 512);
      this.textures.set(srcUrl, fallbackTex);
      return fallbackTex;
    }

    try {
      const video = this.createVideoElement(srcUrl, options);
      const texture = new this.T.VideoTexture(video);
      texture.minFilter = this.T.LinearFilter;
      texture.magFilter = this.T.LinearFilter;
      texture.format = this.T.RGBAFormat;
      if (this.T.sRGBEncoding) texture.encoding = this.T.sRGBEncoding;

      // Handle video load errors by smoothly falling back to procedural canvas
      video.addEventListener('error', () => {
        console.warn(`[VideoTextureManager] Video playback failed for ${srcUrl}. Falling back to procedural canvas.`);
        const fallbackTex = this.createProceduralCanvasTexture(category, 512, 512);
        if (texture.image && fallbackTex.image) {
          texture.image = fallbackTex.image;
          texture.needsUpdate = true;
        }
      }, { once: true });

      this.textures.set(srcUrl, texture);
      return texture;
    } catch (err) {
      console.warn(`[VideoTextureManager] Error creating VideoTexture:`, err);
      const fallbackTex = this.createProceduralCanvasTexture(category, 512, 512);
      this.textures.set(srcUrl, fallbackTex);
      return fallbackTex;
    }
  }

  /**
   * 3. createProceduralCanvasTexture: Dynamic procedural visual loops for all 6
   * canonical categories, providing offline, instant-rendering visual backdrops.
   *
   * @param {string} category - Canonical realm category
   * @param {number} [width=512] - Canvas width
   * @param {number} [height=512] - Canvas height
   * @returns {THREE.CanvasTexture|THREE.Texture}
   */
  createProceduralCanvasTexture(category = 'Sacred & Spiritual', width = 512, height = 512) {
    if (typeof document === 'undefined') {
      // Return a basic mock texture in Node.js test environment
      const mockTex = new this.T.Texture();
      mockTex.needsUpdate = true;
      return mockTex;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const texture = new this.T.CanvasTexture(canvas);
    texture.minFilter = this.T.LinearFilter;
    texture.magFilter = this.T.LinearFilter;

    const catKey = (category || '').toLowerCase();

    // Register procedural animation callback
    const animator = (time, delta) => {
      ctx.clearRect(0, 0, width, height);

      if (catKey.includes('sacred') || catKey.includes('spiritual')) {
        // Sacred & Spiritual: Ascending golden flame aura & divine mandorla
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.55, 10, width * 0.5, height * 0.55, width * 0.45);
        grad.addColorStop(0, '#fffbeb');
        grad.addColorStop(0.35, '#f59e0b');
        grad.addColorStop(0.7, '#d97706');
        grad.addColorStop(1, '#451a03');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Pulsing flame tongues
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const wave = Math.sin(time * 3.5 + i * 1.2) * 22;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 200, 50, ${0.25 + i * 0.08})`;
          ctx.arc(width * 0.5 + wave, height * 0.55 - i * 28, 60 - i * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

      } else if (catKey.includes('nature') || catKey.includes('retreat')) {
        // Nature & Retreat: Cascading turquoise waterfall & mist ripples
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#0d9488');
        grad.addColorStop(1, '#0891b2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Water cascade lines
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.5;
        for (let col = 0; col < 12; col++) {
          const x = width * 0.2 + col * (width * 0.05);
          const offset = Math.sin(time * 4.0 + col) * 8;
          ctx.beginPath();
          ctx.moveTo(x + offset, 0);
          ctx.lineTo(x - offset, height);
          ctx.stroke();
        }
        ctx.restore();

      } else if (catKey.includes('cosmic') || catKey.includes('odyssey')) {
        // Cosmic Odyssey: Celestial vortex spiral with nebula dust
        ctx.fillStyle = '#050210';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width * 0.5, height * 0.5);
        ctx.rotate(time * 0.35);

        for (let arm = 0; arm < 2; arm++) {
          ctx.rotate(Math.PI);
          for (let p = 0; p < 36; p++) {
            const angle = p * 0.22;
            const dist = p * 6.5;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const pSize = 1.5 + (p % 4);
            ctx.fillStyle = p % 2 === 0 ? 'rgba(236, 72, 153, 0.8)' : 'rgba(56, 189, 248, 0.8)';
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

      } else if (catKey.includes('cyber') || catKey.includes('sci-fi')) {
        // Cyberpunk & Sci-Fi: Neon cyan/green digital matrix grid
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        // Matrix rain streaks
        ctx.save();
        ctx.font = '14px monospace';
        ctx.fillStyle = '#00ff66';
        for (let c = 0; c < 16; c++) {
          const colX = c * (width / 16);
          const dropY = ((time * 80 + c * 37) % height);
          ctx.fillText('01', colX, dropY);
          ctx.fillText('10', colX, (dropY + 40) % height);
        }
        // Glowing cyan border
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, width - 16, height - 16);
        ctx.restore();

      } else if (catKey.includes('ancient') || catKey.includes('wonder')) {
        // Ancient Wonders: Desert sandstorm dunes & warm solar corona
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#f59e0b');
        grad.addColorStop(0.7, '#b45309');
        grad.addColorStop(1, '#78350f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Dune curves
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.65);
        ctx.quadraticCurveTo(width * 0.45, height * 0.55 + Math.sin(time) * 10, width, height * 0.75);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

      } else {
        // Zen Meditation: Concentric water ripples with serene emerald pond
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, width * 0.5);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(0.6, '#065f46');
        grad.addColorStop(1, '#064e3b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Ripple rings
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2.0;
        for (let r = 1; r <= 4; r++) {
          const radius = ((time * 35 + r * 50) % (width * 0.45));
          const opacity = Math.max(0, 1.0 - radius / (width * 0.45));
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.45})`;
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.5, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      texture.needsUpdate = true;
    };

    // Run first frame immediately
    animator(0, 0.016);
    this.proceduralAnimators.push(animator);
    return texture;
  }

  /**
   * 4. createDimensionalPortalMesh: 3D Stargate Portal Gateway geometry
   * with rotating rune rings, double-sided event horizon disc, plinth base,
   * and central pulsing PointLight.
   *
   * @param {THREE.Texture} texture - VideoTexture or CanvasTexture to map to event horizon
   * @param {object} [options] - Options (radius, lightColor, position)
   * @returns {THREE.Group}
   */
  createDimensionalPortalMesh(texture, options = {}) {
    const portalGroup = new this.T.Group();
    portalGroup.name = 'DimensionalPortalGateway';

    const radius = options.radius || 4.2;
    const lightColor = options.lightColor || 0x38bdf8;

    // 1. Plinth Base (carved stone pedestal platform)
    const plinthGeo = new this.T.CylinderGeometry(radius * 1.35, radius * 1.45, 1.1, 32);
    const plinthMat = new this.T.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.15
    });
    const plinth = new this.T.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -radius + 0.55;
    portalGroup.add(plinth);

    // 2. Outer Stargate Ring Arch (Celestial Torus)
    const ringGeo = new this.T.TorusGeometry(radius, 0.45, 24, 64);
    const ringMat = new this.T.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25
    });
    const ringMesh = new this.T.Mesh(ringGeo, ringMat);
    portalGroup.add(ringMesh);

    // 3. Inner Counter-Rotating Rune Rings
    // Outer Rune Ring
    const outerRuneGeo = new this.T.RingGeometry(radius * 0.88, radius * 0.98, 48);
    const outerRuneMat = new this.T.MeshBasicMaterial({
      color: 0x38bdf8,
      side: this.T.DoubleSide,
      transparent: true,
      opacity: 0.75,
      wireframe: true
    });
    const outerRuneRing = new this.T.Mesh(outerRuneGeo, outerRuneMat);
    outerRuneRing.position.z = 0.05;
    portalGroup.add(outerRuneRing);

    // Inner Rune Ring
    const innerRuneGeo = new this.T.RingGeometry(radius * 0.76, radius * 0.86, 36);
    const innerRuneMat = new this.T.MeshBasicMaterial({
      color: 0xf59e0b,
      side: this.T.DoubleSide,
      transparent: true,
      opacity: 0.7,
      wireframe: true
    });
    const innerRuneRing = new this.T.Mesh(innerRuneGeo, innerRuneMat);
    innerRuneRing.position.z = -0.05;
    portalGroup.add(innerRuneRing);

    // 4. Double-Sided Event Horizon Disc (mapped with VideoTexture / CanvasTexture)
    const horizonGeo = new this.T.CircleGeometry(radius * 0.88, 48);
    const horizonMat = new this.T.MeshBasicMaterial({
      map: texture,
      side: this.T.DoubleSide,
      transparent: true,
      opacity: 0.92
    });
    const horizonMesh = new this.T.Mesh(horizonGeo, horizonMat);
    portalGroup.add(horizonMesh);

    // 5. Central Pulsing Dimensional Light
    const portalLight = new this.T.PointLight(lightColor, 2.5, radius * 8);
    portalLight.position.set(0, 0, 1.2);
    portalGroup.add(portalLight);

    // Register rotation & pulse animator
    const portalAnimator = (time) => {
      outerRuneRing.rotation.z = time * 0.35;
      innerRuneRing.rotation.z = -time * 0.55;
      portalLight.intensity = 2.2 + Math.sin(time * 3.5) * 0.8;
    };
    this.portalAnimators.push(portalAnimator);

    // Default positioning in scene
    portalGroup.position.set(0, 4.2, -26);
    return portalGroup;
  }

  /**
   * 5. update: Render loop hook for procedural canvas animators & portal rings
   *
   * @param {number} time - Elapsed time in seconds
   * @param {number} delta - Delta time in seconds
   */
  update(time, delta) {
    for (let i = 0; i < this.proceduralAnimators.length; i++) {
      try {
        this.proceduralAnimators[i](time, delta);
      } catch (err) {
        console.warn('[VideoTextureManager] Procedural animator error:', err);
      }
    }

    for (let i = 0; i < this.portalAnimators.length; i++) {
      try {
        this.portalAnimators[i](time, delta);
      } catch (err) {
        console.warn('[VideoTextureManager] Portal animator error:', err);
      }
    }
  }

  /**
   * 6. disposeVideo: 5-step hardware video decoder teardown protocol for a single video.
   *
   * @param {string} srcUrl - Source URL of the video to release
   */
  disposeVideo(srcUrl) {
    if (this.videos.has(srcUrl)) {
      const video = this.videos.get(srcUrl);
      try {
        video.pause();
        video.removeAttribute('src');
        video.load(); // Forces Chromium/MediaFoundation decoder release
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch {}
      this.videos.delete(srcUrl);
    }

    if (this.textures.has(srcUrl)) {
      const texture = this.textures.get(srcUrl);
      try {
        if (texture.dispose) texture.dispose();
      } catch {}
      this.textures.delete(srcUrl);
    }
  }

  /**
   * 7. disposeAll: Releases all hardware video decoders, textures, and animators.
   */
  disposeAll() {
    this.videos.forEach((video) => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch {}
    });
    this.videos.clear();

    this.textures.forEach((texture) => {
      try {
        if (texture.dispose) texture.dispose();
      } catch {}
    });
    this.textures.clear();

    this.proceduralAnimators = [];
    this.portalAnimators = [];
  }
}

// Global browser registration if available
if (typeof window !== 'undefined') {
  window.VideoTextureManager = VideoTextureManager;
}

export default VideoTextureManager;
