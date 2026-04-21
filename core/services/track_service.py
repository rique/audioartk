from mutagen.id3 import ID3, APIC, error, TIT2, TPE1, TALB
from mutagen.mp3 import MP3
from base64 import b64encode

from core.utils.decorators import wrap_with_root_model
from core.utils.image_utils import prepared_image_context
from core.dtos import TrackMetadata, Picture
from core.services.fs_service import TrackFileSystemService

class TrackManagerService:
    @staticmethod
    @wrap_with_root_model
    def get_tags(file_path, include_picture=True):
        # 1. Physical Read
        mp3_file = MP3(file_path)
        audio = ID3(file_path)
        
        # 2. Extract (Pure Logic)
        metadata = TrackManagerService._extract_from_id3(audio, mp3_file.info)
        
        if include_picture:
            picture = TrackManagerService.load_track_album_art(file_path)
            if picture:
                metadata.picture = picture.root
        return metadata
    
    @staticmethod
    def edit_tag(tag_name, tag_value, track_uuid, return_metadata=False):
        file_path = TrackFileSystemService.get_track_path(track_uuid)
        
        # SINGLE READ START
        mp3_file = MP3(file_path) # We need this for the duration
        audio = ID3(file_path)

        # Update logic
        FRAME_MAP = {'title': TIT2, 'artist': TPE1, 'album': TALB}
        if tag_name in FRAME_MAP:
            audio.add(FRAME_MAP[tag_name](encoding=3, text=tag_value))
            audio.save() # Disk Write
        
        if return_metadata:
            # NO SECOND READ: We pass the 'audio' object we already have in memory
            return TrackManagerService._extract_from_id3(audio, mp3_file.info)

    @staticmethod
    def set_art(file_path, image_source):
        """
        Adds or replaces the front cover art.
        image_source can be a file path or a Django UploadedFile object.
        """
        # 1. Prepare the image (Resize/Convert) via our Context Manager
        with prepared_image_context(image_source) as img_bytes_data:
            
            try:
                audio = ID3(file_path)
            except error:
                audio = ID3()

            audio.update_to_v24() 
            audio.delall("APIC")  
            
            audio.add(APIC(
                encoding=3,          # UTF-8
                mime='image/jpeg',   # Always JPEG because of our utility
                type=3,              # Front Cover
                desc=u'Front Cover',
                data=img_bytes_data  # Already bytes, no .read() needed
            ))
            audio.save(file_path)

    @staticmethod
    @wrap_with_root_model
    def load_track_album_art(track_path):
        apict, pic_format = TrackManagerService._get_album_art_data(track_path)
        
        return Picture(
            data=apict, 
            format=pic_format
        ) if apict else None

    @staticmethod
    def remove_art(file_path):
        """Removes all images from the track."""
        try:
            audio = ID3(file_path)
            audio.delall("APIC")
            audio.save()
            return True
        except error:
            return False
        
    @staticmethod
    def _get_album_art_data(track_path):
        audio = ID3(track_path)
        keys = audio.keys()

        apict = None
        pic_format = None

        if 'APIC:' in keys:
            apict = audio.get('APIC:').data
            pic_format = audio.get('APIC:').mime
        else:
            for k in keys:
                if k.startswith('APIC:'):
                    apic_frame = audio.get(k)
                    if apic_frame.mime:
                        apict = apic_frame.data
                        pic_format = apic_frame.mime
                        break
        
        return (apict, pic_format)

    @staticmethod
    def _extract_from_id3(audio: ID3, mp3_info=None):
        """
        Private helper that turns an ID3 object into a TrackMetadata object.
        Does NOT touch the disk.
        """
        title, artist, album = TrackManagerService._get_id3_metadata(audio)
        
        return TrackMetadata(
            duration=mp3_info.length if mp3_info else 0,
            title=title,
            artist=artist,
            album=album,
        )

    @staticmethod
    def _get_id3_metadata(audio: ID3):
        keys = audio.keys()
        
        title = ''
        if 'TIT2' in keys:
            title = audio.get('TIT2').text[0]
        
        artist = ''
        if 'TPE1' in keys:
            artist = audio.get('TPE1').text[0]
        
        album = ''
        if 'TALB' in keys:
            album = audio.get('TALB').text[0]

        """
        if title == '':
            title = file_path.split('/')[-1]
        """

        return title, artist, album
        
    