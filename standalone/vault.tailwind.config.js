// Tailwind build for the skill vault inside the standalone manual: the repo theme, scoped to #vault,
// with no base reset so it can't restyle the manual around it. Colours and radii are swapped for the
// manual's own, so the vault reads as part of the same product.
import base from '../tailwind.config.js';

const manual = { canvas: '#0B0F17', surface: '#161F2E', line: '#243044', ink: '#F8FAFC', muted: '#94A3B8' };

export default {
  ...base,
  content: ['./vault-entry.jsx', './vault-icon.jsx', '../src/frames/MarketplaceFrame.jsx', '../src/components/*.jsx'],
  important: '#vault',
  corePlugins: { preflight: false },
  theme: {
    ...base.theme,
    extend: {
      ...base.theme.extend,
      colors: { ...base.theme.extend.colors, ...manual },
      borderRadius: { DEFAULT: '12px', md: '12px', lg: '12px', xl: '12px', '2xl': '16px' },
    },
  },
};
