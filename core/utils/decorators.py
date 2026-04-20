from functools import wraps
from pydantic import RootModel
import json
from django.http import JsonResponse


def json_api(method='POST'):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if request.method != method:
                return JsonResponse({'success': False, 'code': 'wrong_method'}, status=405)
            
            # Pre-parse params for the view
            if request.body:
                try:
                    request.params = json.loads(request.body.decode('utf-8'))
                except json.JSONDecodeError:
                    return JsonResponse({'success': False, 'code': 'invalid_json'}, status=400)
            else:
                request.params = {}
                
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def wrap_with_root_model(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if result is None:
            return None
        return RootModel(result)# .model_dump() # mode='json'
    return wrapper