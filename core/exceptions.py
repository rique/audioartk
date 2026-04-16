class AudioArtkError(Exception):
    """Base exception for the entire application."""
    pass

class FileSystemError(AudioArtkError):
    """Base for file-system related issues."""
    pass

class PathNotAccessible(FileSystemError):
    """The path exists but the engine cannot read it (Permissions)."""
    pass

class InvalidBrowserPath(FileSystemError):
    """The user tried to 'browse' something that isn't a directory."""
    pass

class TrackPathDoesNotExist(FileSystemError):
    """The track's file path does not exist."""
    pass
