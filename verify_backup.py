from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
manifest = json.loads((root / "backup-checksums.json").read_text(encoding="utf-8"))
errors = []
for name, entry in manifest.items():
    path = root / name
    if not path.is_file():
        errors.append("Missing: " + name)
        continue
    data = path.read_bytes()
    if entry["text"]:
        data = data.replace(b"\r\n", b"\n")
    if hashlib.sha256(data).hexdigest() != entry["sha256"]:
        errors.append("Changed: " + name)
if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"Verified {len(manifest)} files, including project resources and completed builds.")
