# Data Transfer Objects
from pydantic.dataclasses import dataclass
from pydantic import PlainSerializer
from typing import Optional, Annotated, List
from base64 import b64encode

Base64Field = Annotated[
    bytes, 
    PlainSerializer(lambda b: b64encode(b).decode('ascii'), return_type=str)
]

@dataclass
class Picture:
    data: Base64Field
    format: str


@dataclass
class TrackMetadata:
    duration: float
    picture: Optional[Picture] = None
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    

@dataclass(frozen=True)
class DirectoryListing:
    """A formal contract for directory data."""
    base_dir: str
    dir_list: List[str]
    file_list: List[str]


@dataclass(frozen=True)
class BackgroundImageList:
    img_list: List[str]


@dataclass(frozen=True)
class ScannedTrack:
    size: int
    path: str


@dataclass(frozen=True)
class TrackScanResult:
    tracklist: List[ScannedTrack]