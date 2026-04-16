from mutagen.id3 import ID3, APIC, error, TIT2, TPE1, TALB
from mutagen.mp3 import MP3
from base64 import b64encode

from core.utils.decorators import wrap_with_root_model
from core.utils.image_utils import prepared_image_context
from core.dtos import TrackMetadata, Picture

class TrackManagerService:
    @staticmethod
    @wrap_with_root_model
    def get_tags(file_path, include_picture=True):
        audio = ID3(file_path)
        mp3_file = MP3(file_path)
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
        
        if title == '':
            title = file_path.split('/')[-1]
        
        track_metadata = TrackMetadata(
            duration=mp3_file.info.length,
            title=title,
            artist=artist,
            album=album,
        )
        if include_picture:
            track_metadata.picture = TrackManagerService.load_track_album_art(file_path)
        
        return track_metadata
    
    @staticmethod
    def edit_tag(tag_name, tag_value, track_uuid):
        audio = ID3(f'./frontend/assets/tracks/{track_uuid}.mp3')

        try:
            if tag_name == 'title':
                audio.add(TIT2(encoding=3, text=tag_value))
            elif tag_name == 'artist':
                audio.add(TPE1(encoding=3, text=tag_value))
            elif tag_name == 'album':
                audio.add(TALB(encoding=3, text=tag_value))
            audio.save()
        except Exception as e:
            raise Exception(e)

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
    
    