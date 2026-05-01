import {NotificationCenter, PlayerNotifier} from './src/ui/Notifier.js';
import {PlaybackMediator} from './src/ui/mediators/PlaybackMediator.js';
import {PlayerControlMediator} from './src/ui/mediators/PlayerControlMediator.js'
import {AutocompleteMediator} from './src/ui/mediators/AutoCompleteMediator.js';
import {PlaybackNotificationMediator} from './src/ui/mediators/PlaybackNotificationMediator.js'
import {MetadataMediator} from './src/ui/mediators/MetadataMediator.js';
import {AudioPlayerControlsMediator} from './src/ui/mediators/AudioPlayerControlsMediator.js';
import {TrackListManager} from './src/domain/TrackList.js';
import {MetadataIndex} from './src/domain/MetadataIndex.js';
import {TracklistGrid, library} from './src/ui/grid/GridView.js';
import {AudioPlayerDisplay, PlayerControls, PlayerButtons} from './src/ui/player/PlayerUI.js';
import {AudioPlayer} from './src/domain/AudioPlayer.js'
import {keyCotrols} from './src/core/EventBus.js';
import {FileBrowser, Layout, layoutHTML, FileBrowserRenderer, TrackListBrowser} from './src/ui/grid/RowTemplates.js';
import {AudioPlayerProgressBar} from './src/ui/player/ProgressBar.js';
import {PlaylistCreator} from './src/domain/models/Playlist.js';
import {API} from './src/core/HttpClient.js';
import {
    SideBarItem, SideBarSectionItem, RawVolumeControlSection, 
    ActionButtonsItem, PlaylistItem
} from './src/ui/components/SideBarItem.js';
import {VisualizerManager, BGImagesProcessor, GraphProcessor, visualizerManifest} from "./src/ui/visuals/Main.js"


const api = new API();

try {
    const sideBar = new SideBarItem();
    const actionSection = new SideBarSectionItem('action-buttons');

    actionSection.addSectionItems(
        new ActionButtonsItem('Browse Files').classAdd("open-file-browser"), 
        new ActionButtonsItem('View tracks').classAdd("open-tracklist-browser"), 
        new ActionButtonsItem('Create new playlist').classAdd("open-playlist-create"),
        new ActionButtonsItem('Last FM').classAdd("open-last-fm")
    );

    const playlistSection = new SideBarSectionItem('playlist-list');
    
    const res = await api.loadPlaylists();
    const playlists = res['playlists'];
    if (playlists.length > 0) {
        playlists.forEach((pl) => {
            playlistSection.addSectionItems(new PlaylistItem(pl.playlist_name, pl.playlist_uuid));
        });

        actionSection.appendItems();
        playlistSection.appendItems();
        sideBar.addComponent(actionSection);
        sideBar.addComponent(playlistSection);
        sideBar.addComponent(new RawVolumeControlSection());
        sideBar.init(document.getElementById('player'));
    }

} catch(e) {
    console.error(e);
}


const audioPlayerProgressBar = new AudioPlayerProgressBar();
const audioPlayer = new AudioPlayer(audioPlayerProgressBar);
const audioPlayerDisplay = new AudioPlayerDisplay(audioPlayer);
audioPlayerProgressBar.setAudioPlayer(audioPlayer);

const playerControls = new PlayerControls(audioPlayer);
const playerButtons = new PlayerButtons(document.getElementById('player-controls'), playerControls);
playerButtons.setUp();


AudioPlayerControlsMediator.init(keyCotrols);
AudioPlayerControlsMediator.setPlayerControls(playerControls);
AudioPlayerControlsMediator.onFastForward(audioPlayerProgressBar.updateProgress.bind(audioPlayerProgressBar), audioPlayerProgressBar);
AudioPlayerControlsMediator.onRewind(audioPlayerProgressBar.updateProgress.bind(audioPlayerProgressBar), audioPlayerProgressBar);

const trackListBrowser = new TrackListBrowser(audioPlayer, audioPlayerDisplay);
const tracklistGrid = new TracklistGrid('#table-content', audioPlayer, trackListBrowser);
const playlistCreation = new PlaylistCreator();
trackListBrowser.setGrid(tracklistGrid);

const windowContentElem = document.getElementById('window-folder');
const fileBrowserLayout = new Layout(windowContentElem, 'folderBroser');
const fileBrowser = new FileBrowser(fileBrowserLayout);
const fileBrowserRenderer = new FileBrowserRenderer(fileBrowser, fileBrowserLayout);
layoutHTML.addHTMLLayout(fileBrowserLayout);

fileBrowser.onSongAdded(tracklistGrid.appendTrackToGrid.bind(tracklistGrid));

PlaybackMediator.init(
    trackListBrowser, 
    tracklistGrid, 
    tracklistGrid.getQueueGrid(),
    audioPlayer
);

PlaybackNotificationMediator.init(
    audioPlayer,
    playerControls,
    audioPlayerProgressBar
);

AutocompleteMediator.init(tracklistGrid);

PlayerControlMediator.init(
    audioPlayer, 
    audioPlayerDisplay, 
    audioPlayerProgressBar, 
    PlayerNotifier,
    playerControls,
    keyCotrols,
    {tracklistGrid, playlistCreation, fileBrowser, trackListBrowser}
);

/*const sideBar = new SideBar();
sideBar.init();*/

NotificationCenter.register('tracks.loaded', 'Tracks Loaded!!', 'info');

/*api.loadBGImages().then((res) => {
    draw(audioPlayer, res['img_list']);
}).catch(error => console.error(error));*/
const bgImgProcessor = new BGImagesProcessor();
const graphProcessor = new GraphProcessor(audioPlayer);
VisualizerManager.addProcessor(bgImgProcessor);
VisualizerManager.addProcessor(graphProcessor);
await VisualizerManager.executeProcessors();

api.loadTrackList().then((res) => {
    audioPlayer.init();
    library.bootstrap(res['tracklist']).then(() => {
        TrackListManager.setPlaylist(library.getPlaylist());
    
        if (TrackListManager.getTracksNumber() > 0) {
            audioPlayer.setCurrentTrackFromTrackList(false);
            MetadataIndex.initialize(TrackListManager.getTrackList());
        }
        
        NotificationCenter.updateAndShow('tracks.loaded', `<p>${TrackListManager.getTracksNumber()} tracks have been loaded!!<p>`, 6200);
        MetadataMediator.init();
    }); 
}).catch(error => console.error(error));


