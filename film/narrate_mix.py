# Places each narration clip at its beat start (from: node narrate.mjs) into one voice track.
# Usage: python narrate_mix.py timeline.json narration/ voice.wav
import json, sys, numpy as np, soundfile as sf
tl = json.load(open(sys.argv[1])); nd = sys.argv[2]; out = sys.argv[3]
sr = 24000
total = int((tl['total'] + 1) * sr)
voice = np.zeros(total, dtype=np.float32)
for item in tl['timeline']:
    a, r = sf.read(f"{nd}/{item['key']}.wav", dtype='float32'); assert r == sr
    st = int((item['start'] + 0.3) * sr)
    voice[st:st + len(a)] += a[: max(0, total - st)]
peak = np.abs(voice).max(); voice *= 0.89 / peak
sf.write(out, voice, sr)
print('voice track', round(total / sr, 1), 's, peak normalised from', round(float(peak), 3))
