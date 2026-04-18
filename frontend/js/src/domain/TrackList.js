/**
 * Track List Module
 * Provides a comprehensive implementation of the track list management system for the music player application.
 * The module includes the TrackList class, which manages the list of tracks, their order, and playback state, as well as the TrackListManager, which orchestrates the overall behavior of the track list and its interactions with other components of the application.
 * The TrackList class extends a base IndexList class that provides basic list management functionalities such as adding, removing, and navigating through items. The TrackList class adds specific logic for handling tracks, including loop mode, total duration calculation, and index management.
 * The TrackListManager handles higher-level operations such as shuffling the track list, managing the queue of upcoming tracks, and triggering events when tracks are added to the queue or when the track index changes. It also provides methods for retrieving the current track and its index, as well as checking if the current track is from the queue.
 * The module is designed to be easily integrated with other components of the application, such as the audio player and notifications, allowing for seamless management of the track list and its interactions with the user interface.
 * Overall, this module serves as a crucial component of the music player application, providing a robust and flexible system for managing the track list while ensuring efficient interactions with other components and enhancing the overall user experience.
 * The design allows for easy maintenance and scalability, as new features can be added to the track list management system without affecting existing functionality, ensuring that the application can continue to evolve and provide a rich user experience as new features are introduced.
 * In summary, this module provides a comprehensive implementation of the track list management system for the music player application, ensuring seamless integration with other components and enhancing the overall user experience through efficient track list management and interactions.
 */
import {ListEvents} from '../core/EventBus.js';
import {shuffle} from '../core/Utils.js';


const IndexList = function() {
    this.index = -1;
    this.items = [];
};
IndexList.prototype = {
    getItems() {
        return this.items;
    },
    setItems(items) {
        this.items = items;
    },
    addItem(item) {
        this.items.push(item);
    },
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index === -1) return;

        const [removed] = this.items.splice(index, 1);

        if (!removed)
            return {track: undefined, index: undefined};

        if (index <= this.index && this.index > 0)
            --this.index;

        return removed;

    },
    removeItemByIndex(index) {
        if (index >= this.items.length || index < 0) return;
        
        const [item] = this.items.splice(index, 1);

        if (index <= this.index && this.index > 0)
            --this.index;

        return {item, index};
    },
    moveItem(index, item) {
        this.items.splice(index, 0, item);
    },
    getIndex() {
        return this.index;
    },
    indexOf(item) {
        return this.items.indexOf(item);
    },
    maxIndex() {
        if (this.items.length == 0)
            return 0;
        return this.items.length - 1;
    },
    current() {
        if (this.index < 0) {
            this.index = 0;
        }
        
        const item = this.items[this.index];
        const index = this.items.indexOf(item);
        return {item, index};
    },
    next() {
        if (this.index < this.maxIndex()) {
            ++this.index;
            const item = this.items[this.index];
            const index = this.items.indexOf(item);
            return {item, index};
        }

        return false;
    },
    previous() {
        if (this.index > 0) {
            --this.index;
            const item = this.items[this.index];
            const index = this.items.indexOf(item);
            return {item, index};
        }

        return false;
    },
    reset() {
        this.index = -1;
    },
    getItemByIndex(index) {
        const maxIndex = this.maxIndex();
        
        if (index < 0) {
            index = 0;
        } else if (index > maxIndex) {
            index = maxIndex;
        }
        
        this.index = index;

        return this.current();
    },
    getIndex() {
        return this.index;
    },
    length() {
        return this.items.length;
    },
    *[Symbol.iterator]() {
        yield* this.items;
    }
};


const TrackList = function() {
    IndexList.call(this);
    this.loop = false;
    this.tracklistTotalDuration = 0;
    this.UUIDTrackMap = new Map();
};
TrackList.prototype = {
    addItem(track) {
        const newIndex = this.items.length;
        this.items.push(track);
        this.UUIDTrackMap.set(track.getTrackUUID(), {track, index: newIndex});
        this.addToTrackListTotalDuration(track.getTrackDuration());
    },
    setItems(items) {
        IndexList.prototype.setItems.call(this, items);
        this.UUIDTrackMap.clear();

        if (items.length == 0) {
            this.setTrackListTotalDuration(0);
            return;
        }

        let totalDuration = 0;
        items.forEach((track, index) => {
            this.UUIDTrackMap.set(track.getTrackUUID(), {track, index});
            totalDuration += track.getTrackDuration();
        });

        this.setTrackListTotalDuration(totalDuration);
    },
    removeItem(item) {
        const entry = this.UUIDTrackMap.get(item.getTrackUUID());
        if (!entry) {
            console.error('Track not found in tracklist', item);
            return {track: undefined, index: undefined};
        }

        return this.removeItemByIndex(entry.index);
    },
    removeItemByIndex(index) {
        const removedItem = IndexList.prototype.removeItemByIndex.call(this, index);
    
        if (removedItem && removedItem.item) {
            const track = removedItem.item;
            this.UUIDTrackMap.delete(track.getTrackUUID());
            this.substractTracklistTotalDuration(track.getTrackDuration());

            // RE-SYNC: Only tracks from the deleted index to the end need updating
            for (let i = index; i < this.items.length; i++) {
                const t = this.items[i];
                this.UUIDTrackMap.set(t.getTrackUUID(), { track: t, index: i });
            }
            return { track, index };
        }
        return { track: undefined, index: undefined };
    },
    setCurrent({track, index}) {
        if (typeof index === 'number') {
            if (index >= 0 && index < this.length()) {
                this.index = index;
                return;
            }
            console.error('Index is out of bounds', {index, length: this.length()});
            return;
        }
        
        if (!track) {
            console.error('invalid parameters, at least one of track or index should be provided', {track, index});
            return;
        }

        const entry = this.UUIDTrackMap.get(track.getTrackUUID());
        
        if (!entry) {
            console.error('Track not found in tracklist', track);
            return;
        }

        this.index = entry.index;
    },
    enableLoop() {
        this.loop = true;
    },
    disableLoop() {
        this.loop = false;
    },
    current() {
        let track = IndexList.prototype.current.call(this);
        return {track: track.item, index: track.index};
    },
    next() {
        let result = IndexList.prototype.next.call(this);

        if (!result && this.loop) {
            this.index = 0;
            return {track: this.items[0], index: 0};
        }

        return result ? {track: result.item, index: result.index} : false;
    },
    previous() {
        let track = IndexList.prototype.previous.call(this);

        if (!track && this.loop) {
            this.index = this.maxIndex();
            const item = this.items[this.index];
            return {track: item, index: this.index};
        }

        return track ? {track: track.item, index: track.index} : false;
    },
    readNextTrack() {
        let track, 
            index;
        
        if (this.index < this.maxIndex())
            index = this.index + 1;
        else if (this.loop)
            index = 0;

        track = this.items[index];
        return {track, index};
    },
    readCurrentTrack() {
        const track = this.items[this.index];
        return {track, index: this.index};
    },
    isLastTrack() {
        return this.index >= this.maxIndex();
    },
    setTrackIndex(newIdx) {
        this.index = newIdx;
    },
    switchTrackIndex(oldIndex, newIndex) {
        if (oldIndex === newIndex) return;

        // 1. Get a reference to the track that is CURRENTLY playing
        const playingTrack = this.items[this.index];

        // 2. Perform the move in the Array.
        const [movedTrack] = this.items.splice(oldIndex, 1);
        this.items.splice(newIndex, 0, movedTrack);

        // 3. Update of the pointer this.index at the new position
        // of the currently playing track. 
        if (playingTrack) {
            this.index = this.items.indexOf(playingTrack);
        }

        // 4. Update the Map (O(1) sync)
        const start = Math.min(oldIndex, newIndex);
        const end = Math.max(oldIndex, newIndex);
        
        for (let i = start; i <= end; i++) {
            const trk = this.items[i];
            this.UUIDTrackMap.set(trk.getTrackUUID(), { track: trk, index: i });
        }
    },
    setTrackListTotalDuration(duration) {
        duration = parseFloat(duration);
        if (!isNaN(duration))
            this.tracklistTotalDuration = duration;
    },
    addToTrackListTotalDuration(duration) {
        duration = parseFloat(duration);
        if (!isNaN(duration))
            this.tracklistTotalDuration += duration;
    },
    substractTracklistTotalDuration(duration) {
        duration = parseFloat(duration);
        if (!isNaN(duration))
            this.tracklistTotalDuration -= Math.max(0, duration)    ;
    },
    getTrackListTotalDuration(formated) {
        if (formated) 
            return this._formatTime(this.tracklistTotalDuration);
        return this.tracklistTotalDuration;
    },
    getTrackByUUID(uuid) {
        const track = this.UUIDTrackMap.get(uuid);
        if (!track) {
            console.error(`Track with uuid ${uuid} not found!`);
            return {track: undefined, index: undefined};
        }
        
        return track;
    },
    filterBy(key, value) {
        return this.items.filter(track => track[key] === value);
    },
    _formatTime(secTime) {
        if (isNaN(secTime)) return '00:00:00';

        const houres = parseInt(secTime / 3600);
        const mins = parseInt((secTime % 3600) / 60);
        const secs = parseInt(secTime % 60); 

        return [houres, mins, secs].map(unit => unit.toString()
                .padStart(2, '0'))
                .join(':');
    }
};


const QeueuList = function() {
    this.trackList = new TrackList();
};
QeueuList.prototype = {
    addToQueue({track}) {
        this.trackList.addItem(track);
    },
    getCurrentItem() {
        return this.currentItem;
    },
    removeFromQueue(index = 0) {
        return this.trackList.removeItemByIndex(index);
    },
    nexInQueue() {
        this.currentItem = this.trackList.removeItemByIndex(0);
        return this.currentItem;
    },
    getByIndex(index) {
        return this.trackList.getItemByIndex(index);
    },
    hasQueue() {
        return this.trackList.length() > 0;
    },
    length() {
        return this.trackList.length();
    },
    clearQueue() {
        this.trackList.setItems([]);
    },
    getIndex() {
        return this.trackList.getIndex();
    },
    switchTrackIndex(oldIndex, newIndex) {
        this.trackList.switchTrackIndex(oldIndex, newIndex);
    },
    *[Symbol.iterator]() {
        yield* this.trackList.getItems();
    }
};


const TrackListManager =  {
    playStates: {
        CONTEXT_MAIN: 'main',
        CONTEXT_QUEUE: 'queue'
    },
    currentPlayState: 'main',
    activeListType: 'main',
    queueList: new QeueuList(),
    queueDepleted: true,
    trackListEvents: new ListEvents(),
    setTracklist(tracklist) {
        this.tracklist = tracklist;
        if (this.isShuffle()) {
            this.shuffledTracklist = undefined;
            this._isShuffle = false;
        }
        this.trackListEvents.trigger('onTrackListLoaded', tracklist);
    },
    setPlaylist(playlist) {
        this.setTracklist(playlist.getTracklist());
    },
    getTrackList() {
        if (this.isShuffle())
            return this.shuffledTracklist;
        return this.tracklist;
    },
    reset() {
        this.getTrackList().reset();
    },
    addTrackToList(track) {
        if (!this.tracklist)
            this.tracklist = new TrackList();

        this.tracklist.addItem(track);
        if (this.isShuffle())
            this.shuffledTracklist.addItem(track);
        this.trackListEvents.trigger('onTrackAddedToTrackList', track, this.tracklist.length());
    },
    addToQueue(track) {
        this.queueList.addToQueue(track);
        this.trackListEvents.trigger('onAddedToQueue', track, this.queueList.length());
    },
    getNexTrack() {
        let track = {track: undefined, index: undefined};
        const tracklist = this.getTrackList();

        // Priority 1: Repeat current track?
        if (this.doRepeatTrack) {
            track = this.getCurrentTrack();
            this.currentPlayState = this.playStates.CONTEXT_MAIN;
        // Priority 2: Next track in queue?
        } else if (this.queueList.hasQueue()) {

            if (!this.queueIsPlaying) {
                tracklist.next();
            }

            this.currentPlayState = this.playStates.CONTEXT_QUEUE;
            this.queueIsPlaying = true;
            track = this.queueList.nexInQueue();
            
            if (!this.queueList.hasQueue())
                this.queueDepleted = true;
            
        // Priority 3: Normal Sequential Playback
        } else {
            if (this.queueIsPlaying || this.queueDepleted) {
                track = tracklist.current();
                this.trackListEvents.trigger('onQueueFinished', track.track, track.index);
            } else {
                track = tracklist.next();
            }
            this.currentPlayState = this.playStates.CONTEXT_MAIN;
            this.queueIsPlaying = false;
            this.queueDepleted = false;
            this.lastTrack = tracklist.isLastTrack();

            if (!track) {
                track = {track: undefined, index: undefined};
            }
        }
        
        console.log('nextTrack', {track, queueDepleted: this.queueDepleted});
        this.trackListEvents.trigger('onTrackChanged', track.track, track.index, this.queueIsPlaying, this.queueList.hasQueue());
        return track;
    },
    getPreviousTrack() {
        const tracklist = this.getTrackList();
        const track = tracklist.previous();

        if (this.queueIsPlaying) {
            this.queueList.removeFromQueue();
            if (!this.queueList.hasQueue()) {
                this.queueDepleted = true;
                this.queueIsPlaying = false;
                this.queueDepleted = false;
                this.queueList.clearQueue();
                this.trackListEvents.trigger('onQueueFinished', track.track, track.index);
            }
        }
        this.currentPlayState = this.playStates.CONTEXT_MAIN;
        this.lastTrack = tracklist.isLastTrack();
        this.trackListEvents.trigger('onTrackChanged', track.track, track.index, false, this.queueList.hasQueue());
        return track;
    },
    reShuffle() {
        this.shuffleTracklist();
        const tracklist = this.getTrackList();
        const currentTrack = tracklist.current();
        this.trackListEvents.trigger('onShuffleTracklist', currentTrack.track, currentTrack.index, this.isShuffle());
        tracklist.reset();
    },
    shuffle(conserveCurrentTrack) {
        let currentTrack;
        if (this.isShuffle()) {
            const currentShuffle = this.shuffledTracklist.current();
            this.tracklist.setCurrent({track: currentShuffle.track, index: this.tracklist.indexOf(currentShuffle.track)});
            this.shuffledTracklist = null;
            this._isShuffle = false;
            currentTrack = this.tracklist.current();
        } else {
            let trackIndex,
                curIndex = -1;
            if (conserveCurrentTrack === true) {
                trackIndex = this.tracklist.getIndex();
                curIndex = 0;
            }
            this.shuffleTracklist(trackIndex);
            this.shuffledTracklist.setTrackIndex(curIndex);
            currentTrack = this.shuffledTracklist.current();
        }

        this.trackListEvents.trigger('onShuffleTracklist', currentTrack.track, currentTrack.index, this.isShuffle());
    },
    shuffleTracklist(trackIndex) {
        this.shuffledTracklist = new TrackList();
        this.shuffledTracklist.enableLoop();
        const shuffledItems = shuffle([...this.tracklist.getItems()], trackIndex).map((track, index) => {
            track.setIndex(index);
            return track;
        });

        this._isShuffle = true;
        this.shuffledTracklist.setItems(shuffledItems);
    },
    getNextTrackInList() {
        let track = this.queueList.getByIndex(0);
        if (!track.track) {
            if (this.currentPlayState === this.playStates.CONTEXT_MAIN) {
                track = this.getTrackList().readNextTrack();
            } else {
                track = this.getTrackList().readCurrentTrack();
            }
        }
        return track;
    },
    isLastTrack() {
        return this.lastTrack && !this.queueList.hasQueue();
    },
    getCurrentTrack() {
        if (this.queueIsPlaying)
            return this.queueList.getCurrentItem();
        return this.getTrackList().current();
    },
    getCurrentTrackIndex(forceDefaultTracklist) {
        if (forceDefaultTracklist || !this.queueIsPlaying) {
            return this.getTrackList().getIndex();
        }
        
        // If queue IS playing, return the queue's internal index
        return this.queueList.getIndex();
    },
    getAnchorIndex() {
        const index = this.getTrackList().getIndex();
        
        // If we are currently playing from the queue, the "Anchor" 
        // in the main grid is the track we just came from.
        if (this.queueIsPlaying) {
            return Math.max(0, index - 1);
        }
        
        return index;
    },
    isCurrentTrackFromQueue() {
        // return this.queueDepleted;
        return this.queueIsPlaying === true;
    }, 
    switchRepeatMode(repeatMode) {
        this.setRepeatTrack(repeatMode == 2);
        this.trackListLoop(repeatMode == 1);
    },
    setRepeatTrack(repeate) {
        this.doRepeatTrack = repeate;
    },
    trackListLoop(loop) {
        if (loop === true)
            this.tracklist.enableLoop();
        else
            this.tracklist.disableLoop();
    },
    switchTrackIndex(oldIdx, newIdx, isQueue) {
        let tracklist;
        if (isQueue ) {
            if (this.queueIsPlaying) {
                --oldIdx;
                --newIdx;
            }
            tracklist = this.queueList;
        } else {
            tracklist = this.getTrackList();
        }

        tracklist.switchTrackIndex(oldIdx, newIdx);
        this.trackListEvents.trigger('onTrackIndexSwitch', oldIdx, newIdx);
    },
    isShuffle() {
        return this._isShuffle;
    },
    *forEachTrack() {
        for (let track of this.getTrackList()) {
            yield track;
        }
    },
    *forEachTrackInQueue() {
        let index = 0;
        for (let track of this.queueList) {
            yield {track, index};
            ++index;
        }
    },
    setTrackIndex(newIdx) {
        const tracklist = this.getTrackList();
        let oldIdx = tracklist.getIndex();
        tracklist.setTrackIndex(newIdx - 1);
        this.trackListEvents.trigger('onTrackManagerIndexChange', oldIdx, newIdx);
    },
    getTracksNumber() {
        return this.tracklist.length();
    },
    getTrackListTotalDuration(formated) {
        return this.tracklist.getTrackListTotalDuration(formated);
    },
    removeTrackFromTracklistByUUID(trackUUid) {
        const {index, track} = this.getTrackByUUID(trackUUid);

        if (typeof index !== 'undefined') {
            const removed = this.tracklist.removeItemByIndex(index);
            if (this.isShuffle()) {
                this.shuffledTracklist.removeItem(removed.track);
            }
            this.trackListEvents.trigger('onRemoveTrackFromTrackList', {index, track}, trackUUid, index);
            return {index, track};
        }

        return false;
    },
    triggerGridRefresh() {
        const {track, index} = this.getCurrentTrack();
        const isQueue = this.isCurrentTrackFromQueue();
        this.trackListEvents.trigger('onGridSyncRequired', track, index, isQueue, this.queueList.length() > 0);
    },
    getTrackByUUID(trackUUid) {
        return this.tracklist.getTrackByUUID(trackUUid);
    },
    onAddedToQueue(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onAddedToQueue');
    },
    onTrackManagerIndexChange(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackManagerIndexChange');
    },
    onShuffleTracklist(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onShuffleTracklist');
    },
    onRemoveTrackFromTrackList(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onRemoveTrackFromTrackList');
    },
    onTrackAddedToTrackList(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackAddedToTrackList');
    },
    onTrackChanged(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackChanged');
    },
    onGridSyncRequired(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onGridSyncRequired');
    },
    onTrackListLoaded(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackListLoaded');
    },
    onQueueFinished(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onQueueFinished');
    },
    onTrackIndexSwitch(cb, subscriber) {
        this.trackListEvents.onEventRegister({cb, subscriber}, 'onTrackIndexSwitch');
    }
};

Object.setPrototypeOf(TrackList.prototype, IndexList.prototype);

export {TrackListManager, TrackList};
