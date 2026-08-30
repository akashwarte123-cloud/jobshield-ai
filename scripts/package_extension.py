import os
import sys
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def package_extension():
    # Resolve repository root
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    ext_dir = os.path.join(base_dir, 'extension')
    target_dir = os.path.join(base_dir, 'apps', 'web', 'public')
    target_zip = os.path.join(target_dir, 'jobshield-guard-extension.zip')

    if not os.path.exists(ext_dir):
        print(f"Error: Extension directory {ext_dir} not found.", file=sys.stderr)
        sys.exit(1)

    manifest_path = os.path.join(ext_dir, 'manifest.json')
    if not os.path.exists(manifest_path):
        print(f"Error: manifest.json not found in {ext_dir}.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(target_dir, exist_ok=True)

    # Required files verification list
    required_files = ['manifest.json', 'background.js', 'content.js', 'popup.html', 'popup.js']
    for req in required_files:
        p = os.path.join(ext_dir, req)
        if not os.path.exists(p):
            print(f"Error: Required runtime file {req} is missing from {ext_dir}.", file=sys.stderr)
            sys.exit(1)

    # Write ZIP with files directly at root of the archive
    with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, ext_dir)
                zipf.write(file_path, arcname)

    size_kb = os.path.getsize(target_zip) / 1024
    print(f"✓ Packaged extension into {target_zip} ({size_kb:.1f} KB)")

    # Verify root of the archive contains manifest.json
    with zipfile.ZipFile(target_zip, 'r') as zipf:
        namelist = zipf.namelist()
        if 'manifest.json' not in namelist:
            print("Error: manifest.json not at root of generated ZIP!", file=sys.stderr)
            sys.exit(1)
        print(f"✓ ZIP verified: contains {len(namelist)} items, manifest.json is at root.")

if __name__ == '__main__':
    package_extension()
