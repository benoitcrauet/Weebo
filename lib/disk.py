import shutil
import os

from lib.config import config

def convert_file_size(size, from_unit, to_unit, roundPrecision=None):
    units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']  # Définir les unités de poids

    # Trouver les indices des unités source et cible
    try:
        from_index = units.index(from_unit)
        to_index = units.index(to_unit)
    except ValueError:
        raise ValueError('Unknown unit')

    # Convertir la taille en octets
    size_in_bytes = size * (1024 ** from_index)

    # Convertir de octets à l'unité cible
    converted_size = size_in_bytes / (1024 ** to_index)

    if not roundPrecision:
        return converted_size
    else:
        return round(converted_size, roundPrecision)



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


def get_disk_usage(unit="B", roundPrecision=None):
    total, used, free = shutil.disk_usage(os.path.abspath(__file__))
    return {
        "capacity": convert_file_size(total, "B", unit, roundPrecision),
        "used": convert_file_size(used, "B", unit, roundPrecision),
        "free": convert_file_size(free, "B", unit, roundPrecision),
        "percentage": (used/total if total>0 else 0) * 100
    }


def get_app_usage(unit="B", roundPrecision=None):
    media_size = convert_file_size(get_folder_size(config["directories"]["medias"]), "B", unit, roundPrecision)
    tmp_media_size = convert_file_size(get_folder_size(config["directories"]["mediasTmp"]), "B", unit, roundPrecision)
    images_size = convert_file_size(get_folder_size(config["directories"]["images"]), "B", unit, roundPrecision)
    database_size = convert_file_size(os.path.getsize(config["database"]["file"]), "B", unit, roundPrecision)

    total_size = media_size + tmp_media_size + images_size + database_size
    if roundPrecision:
        total_size = round(total_size, roundPrecision)

    return {
        "medias": {
            "size": media_size,
            "percentage": (media_size/total_size if total_size>0 else 0.0) * 100
        },
        "mediasTmp": {
            "size": tmp_media_size,
            "percentage": (tmp_media_size/total_size if total_size>0 else 0.0) * 100
        },
        "images": {
            "size": images_size,
            "percentage": (images_size/total_size if total_size>0 else 0.0) * 100
        },
        "database": {
            "size": database_size,
            "percentage": (database_size/total_size if total_size>0 else 0.0) * 100
        },
        "total": total_size
    }
