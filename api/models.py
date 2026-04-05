import json
from django.db import models
from uuid import uuid4

# Create your models here.

class Tracks(models.Model):
    track_name = models.CharField(max_length=256)
    track_uuid = models.CharField(max_length=36)
    track_original_path = models.CharField(max_length=256)
    track_date_added = models.DateTimeField(auto_now_add=True)
    
    @property
    def dict(self) -> dict:
        return {
            'track_name': self.track_name,
            'track_uuid': self.track_uuid,
            'track_original_path': self.track_original_path,
            'track_date_added': self.track_date_added,
        }


PLAYLIST_TYPES = (
    ('USER', 'user'),
    ('SYSTEM', 'system'),
)
class Playlist(models.Model):
    playlist_name = models.CharField(max_length=256)
    tracks = models.ManyToManyField(Tracks)
    playlist_type = models.CharField(max_length=12, choices=PLAYLIST_TYPES, default="USER")
    playlist_uuid = models.CharField(max_length=36, default=uuid4)
    playlist_created_date = models.DateTimeField(auto_now_add=True)

    def dict(self):
        return {
            'playlist_name': self.playlist_name,
            'playlist_type': self.playlist_type,
            'playlist_uuid': self.playlist_uuid,
            'playlist_created_date': self.playlist_created_date.strftime('%Y/%m/%d %H:%M:%S'),
            'tracks': [tr.__dict__ for tr in self.tracks.all()]
        }



class TrackInfo(models.Model):
    track = models.OneToOneField(Tracks, on_delete=models.CASCADE)
    track_title = models.CharField(max_length=256)
    track_artist = models.CharField(max_length=256)
    track_album = models.CharField(max_length=256)
    track_duration = models.FloatField()
    track_minutes = models.IntegerField()
    track_seconds = models.IntegerField()
    
