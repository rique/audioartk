from django.shortcuts import render
from django.template import loader
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
# Create your views here.


@ensure_csrf_cookie
def index(request):
    return HttpResponse(loader.get_template("index.html").render({}, request))
