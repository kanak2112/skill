# Eight Days: the Knack scenario film

A 3-minute scenario film of the Knack interface (`standalone/Knack.html`), told as a story:
Asha Rao, a home cook in Pune, has eight days to learn knife skills before a restaurant trial shift.

The film is the real interface, driven by a script and captured frame by frame at 30 fps and
1920×1080. A virtual clock (`clock.js`) stops time between frames, so the 3D head, the vault and
the debrief animate smoothly however slow the machine is. Captions, chapter cards and the cursor
are overlays the script adds; nothing in the app itself is faked.

## Rendering

1. Copy the page's libraries into `film/.libs` (the browser has no CDN access), for example:
   ```sh
   cd film/.libs
   for p in react@18.3.1 react-dom@18.3.1 lucide-react@0.263.1 three@0.147.0 @babel/standalone@7.24.7 @fontsource-variable/google-sans-flex@5.3.2; do npm pack "$p"; done
   for f in *.tgz; do mkdir -p "${f%.tgz}" && tar xzf "$f" -C "${f%.tgz}"; done
   mv fontsource-variable-google-sans-flex-5.3.2 gsf
   ```
2. Serve the page: `cd standalone && python3 -m http.server 5301`
3. Render, in three parallel slices (needs Playwright with its Chromium; if it is installed
   globally, set `NODE_PATH=$(npm root -g)`):
   ```sh
   cd film
   for k in 0 1 2; do SHARDS=3 SHARD=$k TOTAL=5500 node direct.mjs & done; wait
   ffmpeg -framerate 30 -i frames/%06d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 eight-days.mp4
   ```
   `DRY=1 node direct.mjs` saves every 15th frame only, for checking the story quickly.

The last slice also writes `eight-days.srt`: every caption and card with its timing.
