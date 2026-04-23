import subprocess
import mimetypes
import os
from uuid import uuid4
from traceback import print_exc

from django.http import HttpResponse, JsonResponse, Http404
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Tracks, Playlist, TrackInfo

from core.services.track_service import TrackManagerService
from core.services.fs_service import TrackFileSystemService
from core.exceptions import InvalidBrowserPath, PathNotAccessible, TrackPathDoesNotExist
from core.utils.http import XAccelResponse
from core.utils.decorators import json_api
from core.utils.tracks_utils import extract_track_uuid_from_path



@json_api(method='POST')
def addTrack(request):
    params = request.params

    track = Tracks()

    track.track_name = params['track_name']    
    track_original_path = params['track_original_path']
    
    track_metadata = TrackManagerService.get_tags(track_original_path)

    track_uuid = str(uuid4())

    TrackFileSystemService.store_track(track_original_path, track_uuid)

    track_metadata = track_metadata.model_dump()

    track.track_original_path = track_original_path
    track.track_uuid = track_uuid
    track.save()

    track_info = TrackInfo(
        track=track,
        track_title=track_metadata['title'],
        track_artist=track_metadata['artist'],
        track_album=track_metadata['album'],
        track_duration=track_metadata['duration']
    )

    track_info.save()
    return JsonResponse(data={'success': True, 'track': track.dict, 'ID3': track_metadata})



@json_api(method='POST')
@transaction.atomic
def editTrack(request):
    # 1. Use .get() with defaults to avoid KeyErrors
    params = request.params
    track_uuid = params.get('track_uuid')
    field_type = params.get('field_type')
    field_value = params.get('field_value')

    # 2. Validation Whitelist
    ALLOWED_FIELDS = {
        'title': 'track_title',
        'artist': 'track_artist',
        'album': 'track_album'
    }

    if field_type not in ALLOWED_FIELDS:
        return JsonResponse({'success': False, 'code': 'invalid_field'}, status=400, reason=f"Invalid field {field_type}")

    track = get_object_or_404(Tracks, track_uuid=track_uuid)

    try:
        metadata = TrackManagerService.edit_tag(field_type, field_value, track_uuid, return_metadata=True)

        TrackInfo.objects.update_or_create(
            track=track,
            defaults={
                'track_title': metadata.title,
                'track_artist': metadata.artist,
                'track_album': metadata.album,
                'track_duration': metadata.duration
            }
        )
    except Exception as e:
        print(f"Sync error for {track_uuid}: {e}")
        return JsonResponse({'success': False, 'code': 'system_error'}, status=500, reason=f"An error occure while syncing the track")

    return JsonResponse({'success': True})



@json_api(method='POST')
def deleteTrack(request):
    params = request.params
    track_uuid = params['track_uuid']
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'does_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")

    print('Proceeding to delete file ', track_uuid)
    TrackFileSystemService.delete_track(track_uuid)
    print('Removed link ', track_uuid)
    track.delete()
    print('Deleted file ', track_uuid)
    
    return JsonResponse(data={'success': True, })



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



@json_api(method='POST')
def loadTrackAlbumart(request):
    params = request.params
    track_uuid = params['track_uuid']

    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'does_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")
    
    picture = TrackManagerService.load_track_album_art(TrackFileSystemService.get_track_path(track_uuid))

    return JsonResponse(data={'success': True, 'track': track.dict, 'ID3': {
        'picture': picture.model_dump() if picture else None,
    } })



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



@json_api(method='POST')
def loadTrackInfo(request):
    params = request.params
    track_uuid = params['track_uuid']
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'does_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")
    
    
    track_metadata =  track.trackinfo.dict if hasattr(track, 'trackinfo') else {}
    return JsonResponse(data={'success': True, 'track': track.dict, 'ID3': track_metadata})




@json_api(method='POST')
def loadTrackList(request):
    
    tracks = Tracks.objects.filter().all()
    tracklist = []
    nb_tracks = len(tracks)
    duration = 0
    for trk in tracks:
        try:
            track_metadata = trk.trackinfo.dict if hasattr(trk, 'trackinfo') else {}

            if not track_metadata:
                print(f"An error occured with file {trk=}, skipping")
                continue

            track_metadata['picture'] = {'data': '', 'format': ''}         
            duration += track_metadata['duration']
            
            tracklist.append({'track': trk.dict, 'ID3': track_metadata})
        except Exception as e:
            print(f'Exception caugth for {trk=}: {e}, continuing')
            continue

    print('duration', duration)
    return JsonResponse(data={
        'success': True,
        'nb_tracks': nb_tracks,
        'total_duration': duration,
        'tracklist': tracklist,
    })



@json_api(method='GET')
def loadBGImages(request):
    img_dir = 'imgc/'# './static/imgc/'
    img_list = TrackFileSystemService.get_background_images(img_dir).model_dump()
    return JsonResponse(data={"success": True, 'img_list': img_list['img_list']})



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



def scanForMyTracks(request):
    # res_str = res.stdout.decode().strip()
    scanned_tracks = TrackFileSystemService.scan_for_tracks().model_dump()
    
    return JsonResponse(data={
        'success': True,
        'trakslist': scanned_tracks['tracklist']
    })



@json_api(method='POST')
@transaction.atomic
def createPlaylist(request):
    params = request.params

    tracklist = params['tracklist']
    playlist_name = params.get('playlist_name', 'Untitled Playlist')

    playlist = Playlist.objects.create(
        playlist_name=playlist_name
    )

    uuids = {tr['track_uuid'] for tr in tracklist}
    valid_tracks = Tracks.objects.filter(track_uuid__in=uuids)

    if valid_tracks.exists():
        playlist.tracks.add(*valid_tracks)

    return JsonResponse(data={
        'success': True,
        'playlist_uuid': playlist.playlist_uuid
    })



@json_api(method='POST')
@transaction.atomic
def addTracksToPlaylist(request):
    params = request.params

    tracklist = params['tracklist']
    playlist_uuid = params['playlist_uuid']

    try:
        playlist = Playlist.objects.get(playlist_uuid=playlist_uuid)
    except Playlist.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'does_not_exist'}, status=404, reason=f"Object or ressource with uuid {playlist_uuid} not found")

    uuids = {tr['track_uuid'] for tr in tracklist}
    valid_tracks = Tracks.objects.filter(track_uuid__in=uuids)

    playlist.tracks.add(*valid_tracks)

    return JsonResponse(data={
        'success': True,
        'playlist_uuid': playlist_uuid
    })



@json_api(method='POST')
def loadPlaylists(request):
    
    playlists = [pl.dict for pl in Playlist.objects.filter().all()]

    return JsonResponse(data={
        'success': True,
        'playlists': playlists
    }) 



@json_api(method='GET')
def sync_all_tracks_with_db(request):
    track_list = TrackFileSystemService.list_track_links()

    if not track_list:
        return JsonResponse(data={'success': False, 'code': 'no_tracks_found'}, status=404)

    error_messages = []

    with transaction.atomic():
        synced_count = 0
        for track_file in track_list:
            try:
                track_uuid = extract_track_uuid_from_path(track_file)
                if not track_uuid:
                    continue

                track = Tracks.objects.get(track_uuid=track_uuid)
                metadata = TrackManagerService.get_tags(TrackFileSystemService.get_track_path(track_uuid))
                track_metadata = metadata.model_dump()
                
                obj, created = TrackInfo.objects.update_or_create(
                    track=track,
                    defaults={
                        'track_title': track_metadata['title'],
                        'track_artist': track_metadata['artist'],
                        'track_album': track_metadata['album'],
                        'track_duration': track_metadata['duration']
                    }
                )
                synced_count += 1

            except Tracks.DoesNotExist:
                print_exc()
                print(f"Skipping: Track {track_uuid} not found in database.")
                error_messages.append(f"Skipping: Track {track_uuid} not found in database.")
                continue
            except Exception as e:
                print_exc()
                print(f"Error processing {track_file}: {e}")
                error_messages.append(f"Error processing {track_file}: {e}")
                continue

    return JsonResponse({'success': True, 'synced_count': synced_count, 'error_messages': error_messages})
