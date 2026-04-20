import subprocess
import json
import mimetypes
import os
from uuid import uuid4

from django.http import HttpResponse, JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import Tracks, Playlist

from core.services.track_service import TrackManagerService
from core.services.fs_service import TrackFileSystemService
from core.exceptions import InvalidBrowserPath, PathNotAccessible, TrackPathDoesNotExist
from core.utils.http import XAccelResponse
from core.utils.decorators import json_api


@csrf_exempt
@json_api(method='POST')
def addTrack(request):
    params = request.params

    track = Tracks()

    track.track_name = params['track_name']    
    track_original_path = params['track_original_path']
    
    track_metadata = TrackManagerService.get_tags(track_original_path)

    track_uuid = str(uuid4())

    TrackFileSystemService.store_track(track_original_path, track_uuid)

    track.track_original_path = track_original_path
    track.track_uuid = track_uuid
    track.save()

    return JsonResponse(data={'success': True, 'track': track.dict, 'ID3': track_metadata.model_dump()})


@csrf_exempt
@json_api(method='POST')
def editTrack(request):
    params = request.params

    track_uuid = params['track_uuid']
    field_type = params['field_type']
    field_value = params['field_value']

    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'dose_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")
   
    try:
        TrackManagerService.edit_tag(field_type, field_value, track_uuid)
    except Exception as e:
        return JsonResponse(data={'success': False, 'code': 'system_error'}, status=500, reason=f"AN unknow error occured {e}")
    
    return JsonResponse(data={'success': True})


@csrf_exempt
@json_api(method='POST')
def deleteTrack(request):
    params = request.params
    track_uuid = params['track_uuid']
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'dose_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")

    print('Proceeding to delete file ', track_uuid)
    TrackFileSystemService.delete_track(track_uuid)
    print('Removed link ', track_uuid)
    track.delete()
    print('Deleted file ', track_uuid)
    
    return JsonResponse(data={'success': True, })


@csrf_exempt
@json_api(method='POST')
def fileBrowser(request):
    print('BASEDIR', settings.BASE_DIR)
    params = request.params
    base_dir = params['base_dir'] or '~'
    
    try:
        dir_listing = TrackFileSystemService.list_directory_contents(base_dir)
    except InvalidBrowserPath:
        return JsonResponse(data={'success': False, 'code': 'invalid_path'}, status=400, reason=f"The path {base_dir} is not valid.")
    except PathNotAccessible:
        return JsonResponse(data={'success': False, 'code': 'path_not_accessible'}, status=403, reason=f"The path {base_dir} is not accessible (permissions).")
    except Exception as e:
        return JsonResponse(data={'success': False, 'code': 'system_error'}, status=500, reason=f"An unknown error occurred: {e}")
    dir_listing = dir_listing.model_dump() # Convert Pydantic model to dict
    dir_listing['success'] = True
    return JsonResponse(data=dir_listing)


@csrf_exempt
@json_api(method='POST')
def loadTrackAlbumart(request):
    params = request.params
    track_uuid = params['track_uuid']

    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'dose_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")
    
    picture = TrackManagerService.load_track_album_art(TrackFileSystemService.get_track_path(track_uuid))

    return JsonResponse(data={'success': True, 'track': track.dict, 'ID3': {
        'picture': picture.model_dump() if picture else None,
    } })


@csrf_exempt
@json_api(method='GET')
def trackArtProxy(request, track_uuid):
    # 1. Verification
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        raise Http404("Track not found")

    picture = TrackManagerService.load_track_album_art(TrackFileSystemService.get_track_path(track_uuid))

    if not picture:
        # 1. Correct path joining
        default_path = os.path.join(settings.STATICFILES_DIRS[0], 'images/albumart.svg')
        
        # 2. Dynamically determine the MIME type (image/svg+xml)
        content_type, _ = mimetypes.guess_type(default_path)
        content_type = content_type or "image/jpeg" # Fallback

        try:
            with open(default_path, 'rb') as f:
                # Return the correct content type for SVG
                return HttpResponse(f.read(), content_type=content_type)
        except FileNotFoundError:
            raise Http404("Default artwork file not found on disk")
        
    picture = picture.root
    return HttpResponse(picture.data, content_type=picture.format)

@json_api(method='GET')
def trackFileProxy(request, track_uuid):
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        raise Http404("Track not found")
    
    file_path = TrackFileSystemService.get_track_path(track_uuid)
    if not os.path.exists(file_path):
        raise Http404("Audio file missing")
    
    return XAccelResponse(internal_path=f"/tracks/{track_uuid}.mp3", content_type="audio/mpeg")


@csrf_exempt
def loadTrackInfo(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")
    
    body_unicode = request.body.decode('utf-8')
    params = json.loads(body_unicode)
    track_uuid = params['track_uuid']
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'dose_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")
    
    track_metadata = TrackManagerService.get_tags(TrackFileSystemService.get_track_path(track_uuid), include_picture=False)
    return JsonResponse(data={'success': True, 'track': track.dict, 'ID3': track_metadata.model_dump()})



@csrf_exempt
def loadTrackList(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")
    
    tracks = Tracks.objects.filter().all()
    tracklist = []
    nb_tracks = len(tracks)
    duration = 0
    for trk in tracks:
        try:
            mp3_file_path = TrackFileSystemService.get_track_path(trk.track_uuid)
            track_metadata = TrackManagerService.get_tags(mp3_file_path, include_picture=False)

            if not track_metadata:
                print(f"An error occured with file {mp3_file_path=}, skipping")
                continue
            
            track_metadata = track_metadata.model_dump()

            track_metadata['picture'] = {'data': '', 'format': ''}         
            duration += track_metadata['duration']
            
            tracklist.append({'track': trk.dict, 'ID3': track_metadata})
        except Exception as e:
            print(f'Exception caugth for {mp3_file_path=}: {e}, continuing')
            continue

    print('duration', duration)
    return JsonResponse(data={
        'success': True,
        'nb_tracks': nb_tracks,
        'total_duration': duration,
        'tracklist': tracklist,
    })


@csrf_exempt
def loadBGImages(request):
    img_dir = 'imgc/'# './static/imgc/'
    img_list = TrackFileSystemService.get_background_images(img_dir).model_dump()
    return JsonResponse(data={"success": True, 'img_list': img_list['img_list']})


@csrf_exempt
def scanForMyTracksOld(request):
    base_dirs = '/mnt/c'
    shell_comand = "find " + base_dirs + " -type f -iname \"*.mp3\" -exec ls -l {} \;| awk '$5>1005128 {out = $5" "; for (i=9; i <= NF; i++) {out=out" "$i};  print  out}'" 

    res = subprocess.run(shell_comand, shell=True, capture_output=True)
    print('stderr', res.stderr.decode())
    
    res_str = res.stdout.decode().strip()

    trakslist = []

    if len(res_str) > 0:
        for track in res_str.split('\n'):
            #  track 8073963/mnt/sabrent/Music/4lieneticYoursftMadiLarson.mp3 ['8073963', 'mnt', 'sabrent', 'Music', '4lieneticYoursftMadiLarson.mp3']
            t = track.split('/')
            trakslist += [(int(t[0]), '/'.join(t[1:]))]
    
    return JsonResponse(data={
        'success': True,
        'trakslist': trakslist
    })


@csrf_exempt
def scanForMyTracks(request):
    # res_str = res.stdout.decode().strip()
    scanned_tracks = TrackFileSystemService.scan_for_tracks().model_dump()
    
    return JsonResponse(data={
        'success': True,
        'trakslist': scanned_tracks['tracklist']
    })


@csrf_exempt
def createPlaylist(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")

    body_unicode = request.body.decode('utf-8')
    params = json.loads(body_unicode)

    tracklist = params['tracklist']
    playlist_name = params['playlist_name']

    playlist = Playlist()
    playlist.playlist_name = playlist_name

    if len(tracklist) > 0:
        for tr in tracklist:
            try:
                track = Tracks.objects.get(track_uuid=tr['track_uuid'])
            except Tracks.DoesNotExist:
                continue
            playlist.tracks.add(track)

    playlist.save()

    return JsonResponse(data={
        'success': True,
        'playlist_uuid': playlist.playlist_uuid
    })


@csrf_exempt
def addTrackToPLaylist(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")

    body_unicode = request.body.decode('utf-8')
    params = json.loads(body_unicode)

    tracklist = params['tracklist']
    playlist_uuid = params['playlist_uuid']

    try:
        playlist = Playlist.objects.get(playlist_uuid=playlist_uuid)
    except Playlist.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'dose_not_exist'}, status=404, reason=f"Object or ressource with uuid {playlist_uuid} not found")

    if len(tracklist) > 0:
        for tr in tracklist:
            try:
                track = Tracks.objects.get(track_uuid=tr['track_uuid'])
            except Tracks.DoesNotExist:
                continue
            playlist.tracks.add(track)

    playlist.save()

    return JsonResponse(data={
        'success': True,
        'playlist_uuid': playlist_uuid
    })


@csrf_exempt
def loadPlaylists(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")
    
    playlists = [pl.dict() for pl in Playlist.objects.filter().all()]

    return JsonResponse(data={
        'success': True,
        'playlists': playlists
    }) 


