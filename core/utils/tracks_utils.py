from pathlib import Path

def extract_track_uuid_from_path(track_path: str):
    path_obj = Path(track_path)
    
    # Check if it's an mp3
    if path_obj.suffix.lower() != '.mp3':
        return None
        
    # .stem returns the filename without the final extension
    return path_obj.stem