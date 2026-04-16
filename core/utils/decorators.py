from functools import wraps
from pydantic import RootModel

def wrap_with_root_model(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if result is None:
            return None
        return RootModel(result)# .model_dump() # mode='json'
    return wrapper