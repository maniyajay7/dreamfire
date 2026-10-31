import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT_DIR, 'realms_catalog.json');

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

const updatedCatalog = catalog.map((realm) => {
  let videoLoop = '';
  if (realm.id === 'ayodhya-ram-mandir') {
    videoLoop = 'public/assets/videos/portal_ayodhya_sacred.mp4';
  } else if (realm.id === 'jays-enchanted-waterfall-retreat') {
    videoLoop = 'public/assets/videos/portal_waterfall_sanctuary.mp4';
  } else {
    switch (realm.category) {
      case 'Sacred & Spiritual':
        videoLoop = 'public/assets/videos/portal_sacred_flame.mp4';
        break;
      case 'Nature & Retreat':
        videoLoop = 'public/assets/videos/portal_waterfall_cascade.mp4';
        break;
      case 'Cosmic Odyssey':
        videoLoop = 'public/assets/videos/portal_cosmic_vortex.mp4';
        break;
      case 'Cyberpunk & Sci-Fi':
        videoLoop = 'public/assets/videos/portal_cyber_matrix.mp4';
        break;
      case 'Ancient Wonders':
        videoLoop = 'public/assets/videos/portal_ancient_dunes.mp4';
        break;
      case 'Zen Meditation':
        videoLoop = 'public/assets/videos/portal_zen_ripple.mp4';
        break;
      default:
        videoLoop = 'public/assets/videos/portal_sacred_flame.mp4';
    }
  }

  // Insert videoLoop after bgImage
  const newRealm = {};
  for (const [k, v] of Object.entries(realm)) {
    newRealm[k] = v;
    if (k === 'bgImage') {
      newRealm.videoLoop = videoLoop;
    }
  }
  return newRealm;
});

fs.writeFileSync(CATALOG_PATH, JSON.stringify(updatedCatalog, null, 2) + '\n', 'utf8');
console.log(`Updated ${updatedCatalog.length} realms in realms_catalog.json with videoLoop.`);
