import os
import random
from pathlib import Path

from django.conf import settings

from core.utils.decorators import wrap_with_root_model
from core.exceptions import InvalidBrowserPath, PathNotAccessible, TrackPathDoesNotExist
from core.dtos import (
    DirectoryListing, 
    BackgroundImageList,
    TrackScanResult,
    ScannedTrack
)
from core.utils.fs_utils import create_symlink, ensure_directory_exists, delete_file

class TrackFileSystemService:

    @staticmethod
    def store_track(track_original_path, track_uuid):
        ensure_directory_exists(settings.TRACKS_DIR)
        target_link_path = TrackFileSystemService.get_track_path(track_uuid)
        create_symlink(track_original_path, target_link_path)

        return target_link_path


    @staticmethod
    def delete_track(track_uuid):
        delete_file(TrackFileSystemService.get_track_path(track_uuid))


    @staticmethod
    def get_track_path(track_uuid):
        return f"{settings.TRACKS_DIR}/{track_uuid}.mp3"

    @staticmethod
    def list_track_links():
        listing = TrackFileSystemService.list_directory_contents(settings.TRACKS_DIR, include_folders=False)
        return listing.model_dump()['file_list']

    @staticmethod
    @wrap_with_root_model
    def list_directory_contents(base_dir='~', include_folders=True):
        # 1. Resolve path (handles ~ and relative paths safely)
        base_dir = os.path.expanduser(base_dir)

        if not os.path.exists(base_dir):
            raise InvalidBrowserPath(f"The directory {base_dir} does not exist.")
        
        path_obj = Path(base_dir).resolve()
        
        if not path_obj.is_dir():
            raise InvalidBrowserPath(f"The path {base_dir} is not a directory.")

        directories = []
        files = []

        # 2. Add '..' unless at root
        if str(path_obj) != '/':
            directories.append('..')
        # 3. High-performance iteration (single pass)
        try:
            with os.scandir(path_obj) as entries:
                for entry in entries:
                    if entry.is_dir() and include_folders:
                        directories.append(entry.name + '/')
                    elif entry.is_file() and entry.name.lower().endswith('.mp3'):
                        files.append(entry.name)
                
            # 4. Optional: Sort to match 'ls' default behavior
            directories.sort()
            files.sort()
        except PermissionError:
            raise PathNotAccessible(f"Permission denied for accessing {base_dir}.")

        return DirectoryListing(
            base_dir=str(path_obj),
            dir_list=directories,
            file_list=files
        )
    

    @staticmethod
    @wrap_with_root_model
    def get_background_images(img_dir):
        img_dir = Path(settings.BASE_DIR) / "frontend" / img_dir

        if not os.path.exists(img_dir):
            raise InvalidBrowserPath(f"The directory {img_dir} does not exist.")

        valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
        img_paths = []

        for path in img_dir.rglob('*'):
            if path.is_file() and path.suffix.lower() in valid_extensions:
                try:
                    relative_to_frontend = path.relative_to(Path(settings.BASE_DIR) / "frontend")
                    img_paths.append(f"static/{relative_to_frontend}")
                except ValueError as e:
                    print(f"Warning: Skipping {path} as it is not under the frontend directory. Error: {e}")
                    continue # Skip files not under the expected directory

        random.shuffle(img_paths)
        return BackgroundImageList(img_list=img_paths)
    

    @staticmethod
    @wrap_with_root_model
    def scan_for_tracks() -> TrackScanResult:
        """
        Recursively scans specific base directories for MP3 files 
        larger than ~1MB.
        """
        # Hardcoded business rules from your shell command
        base_dirs = ['/mnt/c']
        min_size = 1005128  # ~1MB
        found_tracks = []

        for base in base_dirs:
            if not os.path.exists(base):
                continue
            for root, _, files in os.walk(base):
                for file in files:
                    if file.lower().endswith('.mp3'):
                        full_path = os.path.join(root, file)
                        try:
                            file_size = os.path.getsize(full_path)
                            if file_size > min_size:
                                found_tracks.append(
                                    ScannedTrack(size=file_size, path=full_path)
                                )
                        except (OSError, PermissionError) as e:
                            print(f"Warning: Could not access {full_path}. Error: {e}")
                            continue
        
        return TrackScanResult(tracklist=found_tracks)