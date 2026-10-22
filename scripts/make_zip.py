import os
import zipfile

zip_path = '/tmp/worldbox-source.zip'
exclude = {'node_modules', '.git', 'dist', '__pycache__', '.aistudio', '.cache'}

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude]
        for f in files:
            p = os.path.join(root, f)
            zipf.write(p, os.path.relpath(p, '.'))

print(f"Archive created: {zip_path}")
