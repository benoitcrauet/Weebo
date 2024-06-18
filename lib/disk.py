import shutil
import os

from lib.config import config

def get_folder_size(folder_path):
    total_size = 0
    with os.scandir(folder_path) as iterator:
        for entry in iterator:
            try:
                if entry.is_file():
                    total_size += entry.stat().st_size
                elif entry.is_dir():
                    total_size += get_folder_size(entry.path)
            except OSError:
                pass  # handle permission errors or other issues

    return total_size


def get_disk_usage():
    total, used, free = shutil.disk_usage(os.path.abspath(__file__))
    return {
        "capacity": total,
        "used": used,
        "free": free,
        "percentage": used/total if total>0 else 0
    }


def get_app_usage():
    media_size = get_folder_size(config["directories"]["medias"])
    tmp_media_size = get_folder_size(config["directories"]["mediasTmp"])
    images_size = get_folder_size(config["directories"]["images"])
    database_size = os.path.getsize(config["database"]["file"])

    total_size = media_size + tmp_media_size + images_size + database_size

    return {
        "medias": {
            "size": media_size,
            "percentage": media_size/total_size if total_size>0 else 0.0
        },
        "mediasTmp": {
            "size": tmp_media_size,
            "percentage": tmp_media_size/total_size if total_size>0 else 0.0
        },
        "images": {
            "size": images_size,
            "percentage": images_size/total_size if total_size>0 else 0.0
        },
        "database": {
            "size": database_size,
            "percentage": database_size/total_size if total_size>0 else 0.0
        },
        "total": total_size
    }
