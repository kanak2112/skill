// Tailwind build for the skill vault inside the standalone manual: the repo theme, scoped to #vault,
// with no base reset so it can't restyle the manual around it.
import base from '../tailwind.config.js';

export default {
  ...base,
  content: ['./vault-entry.jsx', '../src/frames/MarketplaceFrame.jsx', '../src/components/*.jsx'],
  important: '#vault',
  corePlugins: { preflight: false },
};
