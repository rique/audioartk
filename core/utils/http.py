import mimetypes
from django.http import HttpResponse

class XAccelResponse(HttpResponse):
    """
    Returns an Nginx X-Accel-Redirect response to offload file serving.
    """
    def __init__(self, internal_path, content_type=None, **kwargs):
        if not content_type:
            content_type, _ = mimetypes.guess_type(internal_path)
            content_type = content_type or "application/octet-stream"

        super().__init__(content_type=content_type, **kwargs)
        
        self['X-Accel-Redirect'] = internal_path