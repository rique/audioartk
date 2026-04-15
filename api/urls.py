from django.urls import path

from . import views

urlpatterns = [
    path("file-browser", views.fileBrowser, name="filebrowser"),
    path("add-track", views.addTrack, name="addtrack"),
    path("load-track-list", views.loadTrackList, name="loadtracklist"),
    path("load-bg-img", views.loadBGImages, name="loadbgimages"),
    path("scan-for-my-tracks", views.scanForMyTracks, name="scanformytracks"),
    path("delete-track", views.deleteTrack, name="deleteTrack"),
    path("create-playlist", views.createPlaylist, name="createPlaylist"),
    path("edit-track", views.editTrack, name="editTrack"),
    path("add-track-to-playlist", views.addTrackToPLaylist, name="addTrackToPLaylist"),
    path("load-track-albumart", views.loadTrackAlbumart, name="loadTrackAlbumart"),
    path("load-track-info", views.loadTrackInfo, name="loadTrackInfo"),
    path("load-playlists", views.loadPlaylists, name="loadPlaylists"),
    path('track-art/<str:track_uuid>/', views.trackArtProxy, name='track_art_proxy'),
    path('track-file/<str:track_uuid>/', views.trackFileProxy, name='track_file_proxy'),
]

