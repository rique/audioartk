import {MetadataIndex} from '../../domain/MetadataIndex.js';
import {TrackListManager} from "../../domain/TrackList.js";

export const AutocompleteMediator = {
    _lastLength: 0,
    _activeInput: null, // Track the current DOM element
    init(trackGrid) {
        this.trackGrid = trackGrid;
        this._lastLength = 0;

        // Subscribe to the events defined in your TracklistGrid config
        this.trackGrid.onTrackArtistEditing((track, inputEl, val) => 
            this.handleInlineCompletion('artist', inputEl, val)
        , this);
        
        this.trackGrid.onTrackAlbumEditing((track, inputEl, val) => 
            this.handleInlineCompletion('album', inputEl, val)
        , this);

        TrackListManager.onTrackAddedToTrackList(MetadataIndex.addTrack.bind(MetadataIndex), this);
        TrackListManager.onRemoveTrackFromTrackList(MetadataIndex.removedTrack.bind(MetadataIndex), this);
    },

    handleInlineCompletion(field, inputEl, value, evt) {
        if (this._activeInput !== inputEl) {
            this._activeInput = inputEl;
            this._lastLength = 0; // Reset length tracking for new input
        }
        // 1. If user is deleting (backspace/selection delete), don't autocomplete
        if (value.length <= this._lastLength) {
            this._lastLength = value.length;
            return;
        }

        this._lastLength = value.length;

        // 2. Find a match in our local index
        const match = MetadataIndex.findMatch(field, value);

        if (match && match.length > value.length) {
            const originalLength = value.length;

            // 3. Update the value (programmatic change doesn't re-trigger 'input' usually)
            inputEl.value(match);

            // 4. The iTunes Magic: Select only the suggested part
            // Selection starts where the user stopped typing, and ends at the end of the match
            inputEl.setSelectionRange(originalLength, match.length);
        }
    },


};