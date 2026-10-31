const fs = require('fs');

function applyFix() {
  // 1. Update NavigationEngine.js
  let navCode = fs.readFileSync('Z:/dreamfire/src/engine/NavigationEngine.js', 'utf8');

  // Fix sacred_river height in NavigationEngine.js
  const oldSacredRiver = /case 'sacred_river':\s*\{[\s\S]*?return \(bank < 6\.5 \? bank : 6\.5\) \+ Math\.sin\(x \* 0\.04\) \* 0\.6;\s*\}/;
  const newSacredRiver = `case 'sacred_river': {
        if (z <= 16) {
          if (z < 0 && (x < 0 ? -x : x) < 22) return 1.0;
          return 0.5;
        }
        if (z > 16 && z <= 28) {
          const stepRatio = (z - 16) / 12;
          return 0.5 - stepRatio * 0.45;
        }
        return 0.05 + Math.sin(x * 0.04) * 0.1;
      }`;
  navCode = navCode.replace(oldSacredRiver, newSacredRiver);

  // Fix onRealmChanged in NavigationEngine.js to safely teleport above ground
  const oldOnRealmChanged = /onRealmChanged\(realmData\) \{[\s\S]*?this\.isGrounded = true;\s*\}\s*\}/;
  const newOnRealmChanged = `onRealmChanged(realmData) {
    this.currentRealm = realmData;
    const env = (realmData && realmData.environment) || {};
    const biome = env.biome || 'sanctuary';

    if (realmData && (realmData.id === 'ayodhya-ram-mandir' || (realmData.tags && realmData.tags.includes('ram')))) {
      this.teleport(0, 2.3, 16, 0, 0.05);
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.velocity.z = 0;
      this.isGrounded = true;
      return;
    }

    if (biome === 'cosmic') {
      if (this.mode === 'first_person') {
        this.setMode('free_fly');
      }
      this.teleport(0, 5, 25, 0, 0);
      return;
    }

    const groundY = this.getGroundHeight(this.camera ? this.camera.position.x : 0, this.camera ? this.camera.position.z : 16);
    const startY = Math.max(1.8, groundY + this.eyeHeight);
    if (this.camera && this.camera.position) {
      if (this.camera.position.y < startY) {
        this.camera.position.y = startY;
      }
    }
    this.velocity.y = 0;
    this.isGrounded = true;
  }`;
  navCode = navCode.replace(oldOnRealmChanged, newOnRealmChanged);

  fs.writeFileSync('Z:/dreamfire/src/engine/NavigationEngine.js', navCode, 'utf8');
  console.log('NavigationEngine.js updated!');

  // 2. Update index.html and preview.html
  let html = fs.readFileSync('Z:/dreamfire/index.html', 'utf8');

  // Fix sacred_river height in html
  html = html.replace(oldSacredRiver, newSacredRiver);

  // Fix onRealmChanged in html
  html = html.replace(oldOnRealmChanged, newOnRealmChanged);

  // Position river plane at z = 45 and diyas at z = 30 to 65
  html = html.replace(
    /sarayuRiverMesh\.position\.y = -0\.5;/,
    'sarayuRiverMesh.position.set(0, -0.4, 45);'
  );
  html = html.replace(
    /-10 \+ \(Math\.random\(\) - 0\.5\) \* 60/,
    '32 + Math.random() * 30'
  );

  // Improve Ayodhya sky & fog in synthesizeCustomManifestedCard
  html = html.replace(
    /skyColor:\s*0x1a0f05,[\s\S]*?fogDensity:\s*0\.002,/,
    'skyColor: 0x2e1808,\n          sunPosition: [100, 55, 80],\n          fogDensity: 0.0008,'
  );

  fs.writeFileSync('Z:/dreamfire/index.html', html, 'utf8');
  fs.writeFileSync('Z:/dreamfire/preview.html', html, 'utf8');
  console.log('index.html and preview.html updated!');
}

applyFix();
