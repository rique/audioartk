from django.conf import settings
import os
from pathlib import Path

def ensure_directory_exists(dir_path):
    Path(dir_path).mkdir(parents=True, exist_ok=True)

def create_symlink(source, destination, remove_if_exists=True):
    if os.path.islink(destination) or os.path.exists(destination):
        if remove_if_exists:
            os.remove(destination)
        else:
            raise FileExistsError(f"Destination {destination} already exists and remove_if_exists is False.")
    
    os.symlink(source, destination)


def delete_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
