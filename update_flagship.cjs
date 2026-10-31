const fs = require('fs');

function updateFlagshipScenes() {
  let code = fs.readFileSync('Z:/dreamfire/src/engine/FlagshipScenes.js', 'utf8');

  // 1. Update PALETTE in FlagshipScenes.js: eliminate neon cyan and pastel green
  code = code.replace(
    /silks:\s*\[new T\.Color\(0x0284c7\),\s*new T\.Color\(0x059669\),\s*new T\.Color\(0xbe123c\)\]/,
    'silks: [new T.Color(0xfef3c7), new T.Color(0xd97706), new T.Color(0x991b1b)]'
  );

  // 2. Update createDevoteeFigureGeometry with human proportions & 16 segments
  const oldGeoRegex = /export function createDevoteeFigureGeometry\(T\) \{[\s\S]*?return geo;\s*\}/;
  const newGeo = `export function createDevoteeFigureGeometry(T) {
  const { Vector2, LatheGeometry } = getThreeHelpers(T);
  const points = [];
  points.push(new Vector2(0.02, 0.00));
  points.push(new Vector2(0.36, 0.05));
  points.push(new Vector2(0.32, 0.40));
  points.push(new Vector2(0.24, 0.85));
  points.push(new Vector2(0.35, 1.25));
  points.push(new Vector2(0.38, 1.42));
  points.push(new Vector2(0.14, 1.58));
  points.push(new Vector2(0.20, 1.72));
  points.push(new Vector2(0.18, 1.84));
  points.push(new Vector2(0.04, 1.92));
  points.push(new Vector2(0.01, 1.95));

  const geo = new LatheGeometry(points, 16);
  if (geo.computeVertexNormals) geo.computeVertexNormals();
  return geo;
}`;
  code = code.replace(oldGeoRegex, newGeo);

  // 3. Update createSandstoneTexture to load real photograph
  const oldSandstoneRegex = /export function createSandstoneTexture\(ThreeInstance\) \{[\s\S]*?return mat;\s*\}/;
  const newSandstone = `export function createSandstoneTexture(ThreeInstance) {
  const T = ThreeInstance || THREE_GLOBAL;
  if (typeof document === 'undefined') {
    return new T.MeshStandardMaterial({
      color: 0xcc8465,
      roughness: 0.78,
      metalness: 0.08,
      flatShading: true
    });
  }

  let diffuseTex = null;
  try {
    const loader = new T.TextureLoader();
    diffuseTex = loader.load('public/assets/images/ram_mandir_real.jpg');
    if (diffuseTex) {
      diffuseTex.wrapS = T.RepeatWrapping || 1000;
      diffuseTex.wrapT = T.RepeatWrapping || 1000;
      diffuseTex.repeat.set(3, 3);
    }
  } catch {}

  const mat = new T.MeshStandardMaterial({
    color: 0xdf9a75,
    map: diffuseTex,
    roughness: 0.78,
    metalness: 0.06
  });

  return mat;
}`;
  code = code.replace(oldSandstoneRegex, newSandstone);

  // 4. Update devoteeMat to use aarti_devotees_real.jpg texture
  const oldMatRegex = /const devoteeMat = new T\.MeshStandardMaterial\(\{\s*roughness:\s*0\.75,\s*metalness:\s*0\.12\s*\}\);/;
  const newMat = `let devoteeTex = null;
  if (typeof document !== 'undefined') {
    try {
      const loader = new T.TextureLoader();
      devoteeTex = loader.load('public/assets/images/aarti_devotees_real.jpg');
      if (devoteeTex) {
        devoteeTex.wrapS = T.RepeatWrapping || 1000;
        devoteeTex.wrapT = T.RepeatWrapping || 1000;
        devoteeTex.repeat.set(1, 1);
      }
    } catch {}
  }
  const devoteeMat = new T.MeshStandardMaterial({
    color: 0xffffff,
    map: devoteeTex,
    roughness: 0.72,
    metalness: 0.05
  });`;
  code = code.replace(oldMatRegex, newMat);

  // 5. Widen central aisle for free walking: change [-2.2, 2.2] to [-3.8, 3.8]
  code = code.replace(/\[-2\.2,\s*2\.2\]\.forEach/, '[-3.8, 3.8].forEach');

  fs.writeFileSync('Z:/dreamfire/src/engine/FlagshipScenes.js', code, 'utf8');
  console.log('FlagshipScenes.js updated successfully!');
}

updateFlagshipScenes();

