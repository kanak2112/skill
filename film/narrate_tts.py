# Generates one narration clip per spoken beat with Kokoro (kokoro-onnx, voice af_heart).
# Usage: python narrate_tts.py say.json narration/   (say.json from: node narrate.mjs)
import json, sys, soundfile as sf
from kokoro_onnx import Kokoro
say = json.load(open(sys.argv[1]))['say']
out = sys.argv[2]
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
durs = {}
for line in say:
    a, sr = k.create(line['text'], voice="af_heart", speed=0.96, lang="en-us")
    sf.write(f"{out}/{line['key']}.wav", a, sr)
    durs[line['key']] = round(len(a) / sr, 3)
json.dump(durs, open(f"{out}/durations.json", "w"), indent=1)
print(len(durs), "lines", round(sum(durs.values()), 1), "s of speech, sr", sr)
