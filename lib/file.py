from pathlib import Path
import shutil


def clean_media_dir(dir):
    for item in Path(dir).iterdir():
        try:
            if not item.name.startswith("."):
                if item.is_file() or item.is_symlink():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
        except Exception as e:
            print(f"Failed to delete {item}: {e}")