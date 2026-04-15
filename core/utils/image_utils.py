from contextlib import contextmanager
from PIL import Image
import io

@contextmanager
def prepared_image_context(image_input, size: tuple=(600, 600)):
    """
    Standardizes an image for embedding.
    Accepts a file path or a file-like object (BytesIO).
    """
    img = Image.open(image_input)
    try:
        # Convert to RGB if it's RGBA (PNG with transparency) to avoid JPEG errors
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        img.thumbnail(size)
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        yield img_byte_arr.getvalue()
    finally:
        img.close()