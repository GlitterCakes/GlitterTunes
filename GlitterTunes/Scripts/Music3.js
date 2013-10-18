YUI().use('dd', 'dd-delegate', 'datatype', 'slider', 'datasource', 'json', 'model', 'model-list', 'autocomplete', 'yui2-utilities', 'yui2-datatable', 'yui2-datasource', 'yui2-paginator', function (Y) {

    // Reference to audio tag
    var audioTag = document.getElementById('audioTag');

    // Mapping of GUIDs to DT row indexes
    var audioFileMap = {};

    // Function to play audio
    var playAudio = function () {
        audioTag.play();
    }

    // Function to pause audio
    var pauseAudio = function () {
        audioTag.pause();
    }

    // Bind play/pause event
    Y.one('#playPause').on('click', playAudio);

    // Play event
    audioTag.addEventListener('play', function () {
        Y.one('#playPause').detach('click', playAudio);
        Y.one('#playPause').on('click', pauseAudio);
        Y.one('#playPause').replaceClass('btn-success', 'btn-danger');
        Y.one('#playPauseIcon').replaceClass('icon-play', 'icon-pause');
        Y.one('#trackProgress>.bar').addClass('bar-success');       
    });

    // Pause event
    audioTag.addEventListener('pause', function () {
        Y.one('#playPause').detach('click', pauseAudio);
        Y.one('#playPause').on('click', playAudio);
        Y.one('#playPause').replaceClass('btn-danger', 'btn-success');
        Y.one('#playPauseIcon').replaceClass('icon-pause', 'icon-play');
        Y.one('#trackProgress>.bar').removeClass('bar-success');
    });

    // Duration change event
    audioTag.addEventListener('durationchange', function () {
        hours = parseInt(audioTag.duration / 3600) % 24;
        minutes = parseInt(audioTag.duration / 60) % 60;
        seconds = Math.floor(audioTag.duration) % 60;
        result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
        Y.one('#totalTime').setHTML(result);
    });

    // Progress event
    audioTag.addEventListener('timeupdate', function () {

        // If we have a track duration value
        if (audioTag.currentTime > 0) {
            
            // Calculate HH:MM:SS value
            hours = parseInt(audioTag.currentTime / 3600) % 24;
            minutes = parseInt(audioTag.currentTime / 60) % 60;
            seconds = Math.floor(audioTag.currentTime) % 60;
            result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);

            // Update HH:MM:SS value
            Y.one('#trackTime').setHTML(result);

            // Update progress bar
            var value = Math.floor((100 / audioTag.duration) * audioTag.currentTime);
            Y.one('#trackProgress>.bar').setStyle('width', value + '%');
        }
        
    });

    // Setup volume slider
    var volumeSlider = new Y.Slider({
        min: 0,
        max: 100,
        value: 100
    });

    volumeSlider.on('thumbMove', function (e) {
        audioTag.volume = this.get('value') / 100;
    });

    volumeSlider.render('#volumeSlider');

    // Set instance of YUI2
    YAHOO = Y.YUI2;

    // Setup datasource for datatable
    var ds = new YAHOO.util.DataSource('/Home/Load?', {
        responseType: YAHOO.util.DataSource.TYPE_JSON,
        connXhrMode: 'queueRequests',
        //connMethodPost: true,
        responseSchema: {
            resultsList: "Results",
            fields: ['Id', 'Title', 'Album', 'Artists', 'Genres'],
            metaFields: {
                totalRecords: 'totalRecords',
                startIndex: 'itemIndexStart'
            }
        }
    });

    // Generates request
    var generateRequest = function (oState, oSelf) {

        // Get states or use defaults
        oState = oState || { pagination: null, sortedBy: null };
        var sort        = (oState.sortedBy) ? oState.sortedBy.key : "Title";
        var dir         = (oState.sortedBy && oState.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? "DESC" : "ASC";
        var startIndex  = (oState.pagination) ? oState.pagination.recordOffset : 0;
        var numPerPage  = (oState.pagination) ? oState.pagination.rowsPerPage : 50;
        var page        = (oState.pagination) ? oState.pagination.page : 1;

        // Build custom request
        var requestString = "page=" + page + 
                "&sortBy=" + sort +
                "&sortDirection=" + dir +
                "&itemIndexStart=" + startIndex +
                "&itemsPerPage=" + numPerPage + 
                "&searchQuery=" + YAHOO.util.Dom.get('searchQuery').value;

        return requestString;
    };

    // Setup autocomplete
    Y.one('#searchQuery').plug(Y.Plugin.AutoComplete, {});
    Y.one('#searchQuery').ac.on('query', function (e) {
        dt.load({
            request: generateRequest()
        });
    });

    // Setup paginator
    var paginator = new YAHOO.widget.Paginator({
        rowsPerPage: 50,
        containers: ['paginatorTop', 'paginatorBottom'],

        // Custom labels
        firstPageLinkLabel: "«",
        lastPageLinkLabel: "»",

        previousPageLinkLabel: "<",
        nextPageLinkLabel: ">",

        // Custom classes
        containerClass: 'pagination yui-custom-paginator',

        currentPageClass: 'linkBlock active',

        firstPageLinkClass: 'linkBlock',
        lastPageLinkClass: 'linkBlock',

        previousPageLinkClass: 'linkBlock',
        nextPageLinkClass: 'linkBlock',

        pageLinksContainerClass: '',
        pageLinkClass: 'linkBlock pageLink'
    });

    // Define a custom row formatter function
    var dtRowFormatter = function (elTr, oRecord) {
        return true;
    };

    // Custom formatter for options column
    var optionsFormatter = function (elCell, oRecord, oColumn, sData) {
        elCell.innerHTML = '<button type="button" class="btn btnPlayRow"><i class="icon-play"></i></button>'
    }

    // Setup datatable
    dt = new YAHOO.widget.DataTable('musicDt',
        [
            { key: 'options', label: '', className: 'columnOptions', formatter: optionsFormatter },
            { key: 'Title', sortable: true },
            { key: 'Album', sortable: true },
            { key: 'Artists', sortable: true },
            { key: 'Genres', sortable: true }
        ],
        ds,
        {
            generateRequest: generateRequest,
            initialRequest: generateRequest(),
            dynamicData: true,
            paginator: paginator,
            //selectionMode: 'single',
            formatRow: dtRowFormatter
        }
    );

    // Render event
    dt.subscribe('initEvent', function (e) {
        
        // Setup drag sources
        var del = new Y.DD.Delegate({
            container: '#musicDt tbody.yui-dt-data',
            nodes: 'tr'
        });

        // When dragging begins
        del.on('drag:start', function (e) {
            Y.all('.playlist-drop').addClass('playlist-drop-highlight');
        });

        // When dragging ends
        del.on('drag:end', function () {
            Y.all('.playlist-drop').removeClass('playlist-drop-highlight');
        });

        // When we hit a valid target
        del.on('drag:drophit', function (e) {
            console.log(e);
        });

        // When we miss a valid target
        del.on('drag:dropmiss', function (e) {
            console.log(e);
        });
    });

    // Update total records on the fly from the server
    dt.doBeforeLoadData = function (oRequest, oResponse, oPayload) {

        // Update paginator things
        oPayload.totalRecords = oResponse.meta.totalRecords;
        oPayload.pagination.recordOffset = oResponse.meta.startIndex;

        // Set number of tracks display
        var numTracks = Y.Number.format(oResponse.meta.totalRecords, {
            thousandsSeparator: ",",
            decimalSeparator: ".",
        });
        //dt.set('caption', 'Found ' + numTracks + ' tracks.');
        Y.one('#totalTracks').setHTML('Found ' + numTracks + ' tracks.');

        return oPayload;
    };

    // Subscribe to events for row selection
    dt.subscribe("rowMouseoverEvent", dt.onEventHighlightRow);
    dt.subscribe("rowMouseoutEvent", dt.onEventUnhighlightRow);

    // Row click event
    dt.subscribe("rowClickEvent", function (e) {

        dt.onEventSelectRow(e);

        // If this is the currently playing track, don't highlight it.
        //if (!Y.one('#' + e.target.id).hasClass('playingTrackRow')) {
        //    dt.onEventSelectRow(e);
        //}
    });

    // Row double click event
    dt.subscribe('rowDblclickEvent', function (e) {
        
        //// Select the current record
        //dt.onEventSelectRow(e);

        //// Remove the class from any other playing elements
        //Y.all('.playingTrackRow').removeClass('playingTrackRow');

        //// Add the playing track row class
        //Y.one('#' + e.target.id).addClass('playingTrackRow');

        //// Update current track info and play audio
        //var record = dt.getRecord(e.target);
        //Y.one('#currentTitle').setHTML(record.getData('Title') ? record.getData('Title') : '[Untitled]');
        //Y.one('#currentArtist').setHTML((record.getData('Artists') ? record.getData('Artists') : '[No Artist]') + ' --- ' + (record.getData('Album') ? record.getData('Album') : '[No Album]'));
        //Y.one('#audioTag').set('src', '/Home/StreamFile/' + dt.getRecord(e.target).getData('Id'));
        //Y.one('#audioTag').setData('guid', record.getData('Id'));
        //playAudio();
    });

    // Do this when the datatables DOM structure has changed
    dt.subscribe('renderEvent', function () {

        // Determine if there is a record that represents the currently playing track, if there is, highlight it as currently playing.
        var records = dt.getRecordSet().getRecords();
        for (var i = 0; i < records.length; i++) {
            if (records[i].getData('Id') == Y.one('#audioTag').getData('guid')) {
                Y.one('#' + dt.getTrEl(records[i]).id).addClass('playingTrackRow');
                break;
            }
        }
    });
    
    // Option click events
    Y.one('#musicDt').delegate('click', function (e) {

        // Remove the class from any other playing elements
        Y.all('.playingTrackRow').removeClass('playingTrackRow');

        // Add the playing track row class
        Y.one('#' + this.ancestor('tr').get('id')).addClass('playingTrackRow');

        // Update current track info and play audio
        var record = dt.getRecord(this.get('id'));
        Y.one('#currentTitle').setHTML(record.getData('Title') ? record.getData('Title') : '[Untitled]');
        Y.one('#currentArtist').setHTML((record.getData('Artists') ? record.getData('Artists') : '[No Artist]') + ' --- ' + (record.getData('Album') ? record.getData('Album') : '[No Album]'));
        Y.one('#audioTag').set('src', '/Home/StreamFile/' + dt.getRecord(this.get('id')).getData('Id'));
        Y.one('#audioTag').setData('guid', record.getData('Id'));
        playAudio();

    }, '.btnPlayRow');

    // Bind share button events
    Y.one('#shareSong').on('click', function (e) {

        // Update modal contents
        Y.one('#currentTrackLink').set('value', location.protocol + "//" + location.host + "/Home/Index/?guid=" + Y.one('#audioTag').getData('guid'));

        // Show the modal
        $('#shareModal').modal('show');
    });

    // Create playlist model list and load playlist data
    //playlists = new Y.PlaylistModelList();
    playlists = new glitter.models.PlaylistModelList();
    playlists.load();
});