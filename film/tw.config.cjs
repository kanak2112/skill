module.exports = {
  content: [require('path').resolve(__dirname, '../standalone/manual-app.jsx'), require('path').resolve(__dirname, '../standalone/experts.jsx')],
  theme: { extend: { colors: { slate0: '#0B0F17', card: '#161F2E', line: '#243044', brass: '#E2B168', ink: '#F8FAFC', mute: '#94A3B8', ok: '#4ADE80', warn: '#F5B84B', crit: '#F87171' }, fontFamily: { sans: ['"Google Sans Flex"', 'system-ui', 'sans-serif'] } } },
};
