/**
 * Main entry point for the application. This file is responsible for initializing the application and loading the necessary resources.
 * It sets up the audio player, track list, notifications, and other components of the application.
 * The main responsibilities include:
 * - Loading the track list and album art from the server.
 * - Initializing the audio player and its display.
 * - Setting up event listeners for user interactions and keyboard controls.
 * - Managing the state of the application and coordinating between different components.
 * The code is organized to ensure a clear separation of concerns and maintainability, allowing for easy updates and feature additions in the future.
 * It also integrates with the Notifications Center to provide feedback to the user about various actions and states of the application.
 * Overall, this file serves as the central hub for orchestrating the different parts of the music player application.
 */
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
import Api from './src/core/HttpClient.js';

const imgList = [];
const audioPlayerProgressBar = new AudioPlayerProgressBar();
const audioPlayer = new AudioPlayer(audioPlayerProgressBar);
const audioPlayerDisplay = new AudioPlayerDisplay(audioPlayer);
audioPlayerProgressBar.setAudioPlayer(audioPlayer);

const playerControls = new PlayerControls(audioPlayer);
const playerButtons = new PlayerButtons(document.getElementById('player-controls'), playerControls);
playerButtons.setUp();
const api = new Api();

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

api.loadBGImages((res) => {
    imgList.push(...res['img_list']);
    draw(audioPlayer, imgList);
});

api.loadTrackList((res) => {
    audioPlayer.init();
    library.bootstrap(res['tracklist']).then(() => {
        TrackListManager.setPlaylist(library.getPlaylist());
    
        if (TrackListManager.getTracksNumber() > 0) {
            audioPlayer.setCurrentTrackFromTrackList(false);
            MetadataIndex.initialize(TrackListManager.getTrackList());
        }
        
        NotificationCenter.updateAndShow('tracks.loaded', `<p>${TrackListManager.getTracksNumber()} tracks have been loaded!!<p>`, 6200);
        // NotificationCenter.displayNotification('tracks.loaded', 6000);
        MetadataMediator.init();
    }); 
});

api.loadPlaylists((res) => {
    console.log('load playlists',{res});
});

