from mutagen.id3 import ID3, APIC, error
from mutagen.mp3 import MP3
import mimetypes
from core.utils.image_utils import prepared_image_context

class TrackArtManager:
    @staticmethod
    def get_tags(file_path):
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
        
        apict = ''
        pic_format = ''
        if 'APIC:' in keys:
            apict = b64encode(audio.get('APIC:').data).decode('ASCII')
            pic_format = audio.get('APIC:').mime
        else:
            for k in keys:
                if k.startswith('APIC:'):
                    APIC = audio.get(k)
                    if APIC.mime:
                        apict = b64encode(APIC.data).decode('ASCII')
                        pic_format = APIC.mime
                        break

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
    def remove_art(file_path):
        """Removes all images from the track."""
        try:
            audio = ID3(file_path)
            audio.delall("APIC")
            audio.save()
            return True
        except error:
            return False
