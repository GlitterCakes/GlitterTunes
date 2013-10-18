// Library functions for site functionality :D
var glitter = {

    // Datasources namespace
    dataSources: {},

    // Model namespace
    models: {

        // Music playlist model and model list
        PlaylistModel: null,
        PlaylistModelList: null,

        // Prototypes the playlist model
        prototypePlaylistModel: function () {

            // Use YUI things
            YUI().use('node', 'dd', 'datasource', 'json', 'model', 'model-list', function (Y) {

                // Create a custom model to represent Playlists
                //Y.PlaylistModel = Y.Base.create('playlistModel', Y.Model, [], {
                glitter.models.PlaylistModel = Y.Base.create('playlistModel', Y.Model, [], {

                    // Called when the object is created
                    initializer: function () {
                        this.addToNavList();
                    },

                    // Adds the current playlist to the nav
                    addToNavList: function () {

                        // Nav list item elements
                        var eleLi = Y.Node.create('<li></li>');
                        var eleA = Y.Node.create('<a href="#" data-id="' + this.get('Id') + '" class="playlist-drop"></a>');
                        var eleI = Y.Node.create('<i class="icon-list"></i>');
                        var eleSpan = Y.Node.create('<span>' + this.get('Title') + '</span>');

                        // Append items
                        eleA.appendChild(eleI);
                        eleA.appendChild(eleSpan);
                        eleLi.appendChild(eleA);
                        Y.one('#sideNav').appendChild(eleLi);

                        // Setup drop target
                        var drag = new Y.DD.Drop({
                            node: eleA
                        });
                    }
                },
                {
                    ATTRS: {
                        Id: {
                            values: null
                        },
                        Title: {
                            values: ''
                        },
                        MusicFiles: {
                            values: null
                        }
                    }
                });
            });
        },

        // Prototypes the playlist model list
        prototypePlaylistModelList: function () {

            // Use YUI3 things
            YUI().use('datasource', 'json', 'model', 'model-list', function (Y) {

                // Create a datasource for our list model
                var playlistDs = new Y.DataSource.IO({ source: '/Home/LoadPlaylists' });
                playlistDs.plug(Y.Plugin.DataSourceJSONSchema, {
                    schema: {
                        resultFields: ["Id", "Title"]
                    }
                });

                // Define our list model
                //Y.PlaylistModelList = Y.Base.create('playlistModelList', Y.ModelList, [], {
                glitter.models.PlaylistModelList = Y.Base.create('playlistModelList', Y.ModelList, [], {
                    //model: Y.PlaylistModel,
                    model: glitter.models.PlaylistModel,
                    sync: function (action, options, callback) {

                        // Handle each type of action
                        switch (action) {
                            case 'read':
                                // Get data using datasource
                                playlistDs.sendRequest({
                                    on: {
                                        success: function (e, f) {

                                            // Update the listmodel with the results, then add each playlist to the navlist
                                            callback(null, e.response.results);

                                            //playlists.each(function () {
                                            //    this.addToNavList();
                                            //});
                                        }
                                    }
                                });
                                break;
                            default:
                                callback('Unsupported model list sync action: ' + action);
                                break;
                        }
                        return;
                    }
                });
            });
        }
    },

    // Initializes things for the application
    init: function () {

        // Prototype models and model lists
        this.models.prototypePlaylistModel();
        this.models.prototypePlaylistModelList();
    }

};

// Run initializer
glitter.init();