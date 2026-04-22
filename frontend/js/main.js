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
import draw from './src/ui/visuals/Visualizer.js';
import {AudioPlayerDisplay, PlayerControls, PlayerButtons} from './src/ui/player/PlayerUI.js';
import {AudioPlayer} from './src/domain/AudioPlayer.js'
import {keyCotrols} from './src/core/EventBus.js';
import {LeftMenu, FileBrowser, Layout, layoutHTML, FileBrowserRenderer, TrackListBrowser} from './src/ui/grid/RowTemplates.js';
import {AudioPlayerProgressBar} from './src/ui/player/ProgressBar.js';
import {PlaylistCreator} from './src/domain/models/Playlist.js';
import {API} from './src/core/HttpClient.js';


const audioPlayerProgressBar = new AudioPlayerProgressBar();
const audioPlayer = new AudioPlayer(audioPlayerProgressBar);
const audioPlayerDisplay = new AudioPlayerDisplay(audioPlayer);
audioPlayerProgressBar.setAudioPlayer(audioPlayer);

const playerControls = new PlayerControls(audioPlayer);
const playerButtons = new PlayerButtons(document.getElementById('player-controls'), playerControls);
playerButtons.setUp();
const api = new API();

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

PlayerControlMediator.init(
    audioPlayer, 
    audioPlayerDisplay, 
    audioPlayerProgressBar, 
    PlayerNotifier,
    playerControls,
    keyCotrols,
    {tracklistGrid, playlistCreation, fileBrowser, trackListBrowser}
);

PlaybackNotificationMediator.init(
    audioPlayer,
    playerControls,
    audioPlayerProgressBar
);

AutocompleteMediator.init(tracklistGrid);

const leftMenu = new LeftMenu();
leftMenu.init();

NotificationCenter.register('tracks.loaded', 'Tracks Loaded!!', 'info');

api.loadBGImages().then((res) => {
    draw(audioPlayer, res['img_list']);
}).catch(error => console.error(error));

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

api.loadPlaylists().then((res) => {
    console.log('load playlists',{res});
}).catch(error => console.error(error));
