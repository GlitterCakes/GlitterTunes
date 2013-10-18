YUI({
    combine:false, filter:'raw',
    gallery: 'gallery-2012.09.05-20-01'
}).use( "node", "cssfonts", "datatype", "querystring-parse",
    "datatable-datasource", "datatable-scroll", "datatable-sort",
    "datasource-function", "datasource-jsonschema", "datasource-io",
    "gallery-datatable-paginator", "gallery-paginator-view",  
    'autocomplete', 'autocomplete-filters', 'autocomplete-highlighters',        
    function(Y) {
    
        Y.one('body').addClass("yui3-skin-sam");
    
        //
        //  Make some sample data, the DS will reference this Array
        //
        //var states = [
        //  'Alabama','Alaska','Arizona','Arkansas','California',
        //  'Colorado','Connecticut','Delaware','Florida',
        //  'Georgia','Hawaii','Idaho','Illinois','Indiana',
        //  'Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
        //  'Massachusetts','Michigan','Minnesota','Mississippi',
        //  'Missouri','Montana','Nebraska','Nevada',
        //  'New Hampshire','New Jersey','New Mexico','New York',
        //  'North Dakota','North Carolina','Ohio','Oklahoma',
        //  'Oregon','Pennsylvania','Rhode Island','South Carolina',
        //  'South Dakota','Tennessee','Texas','Utah','Vermont',
        //  'Virginia','Washington', 'West Virginia','Wisconsin','Wyoming'
        //];

        // Bind autocomplete to search query input
        Y.one('#searchQuery').plug(Y.Plugin.AutoComplete, {
            //resultFilters    : 'phraseMatch',
            //resultHighlighter: 'phraseMatch',
            //source           : states
        });

        // Get a reference to autocomplete
        var autoC = Y.one("#searchQuery").ac;
        
        var rdata = [];
        var totalRec, ndup = 10;
    
        //for(var i=0; i<states.length; i++)
        //    for(var j=0; j<ndup; j++) {
        //        rdata.push({
        //            num:       rdata.length + 1,
        //            statename: states[i] + (j+1)
        //        });
        //    }        

        totalRec = rdata.length;

        //
        //  Create a Function DS to SIMULATE a remote server data request
        //  ( DO NOT USE THIS IN PRODUCTION, This is only a DEMO )
        //   This processing would NORMALLY be done on a remote server ...            
        //
        //var myDS = new Y.DataSource.Function({
        //    source: function(requestString) {
        //        var resp    = {},
        //            qs      = Y.QueryString.parse( requestString.replace(/\?/,'')),
        //            sortBy  = Y.JSON.parse(qs.sortBy),
        //            ldata   = [];

        //        // 
        //        // if "query" is defined, filter the "statename" by it ...
        //        if(qs.query && Y.Lang.isString(qs.query) && qs.query.length>0) {
        //            var re = new RegExp(qs.query,"i");
        //            Y.Array.each(rdata,function(row){
        //                if(row.statename.search(re)!== -1)
        //                    ldata.push(row);
        //            });                
               
        //        } else {
        //            Y.Array.each(rdata,function(r){ ldata.push(r); });                         
        //        }
        //        totalRec = ldata.length;
            
            
        //        //
        //        //  Pre-process the "sortBy" querystring parameter for 
        //        //  "sortBy" BEFORE returning the results
        //        //
        //        if(Y.Lang.isArray(sortBy)) {
        //            var sortObj = sortBy[0],
        //                sortKey = Y.Object.keys(sortObj)[0],
        //                sortDir = sortObj[sortKey];

        //            //
        //            //  Sort prior to sending response back, using 
        //            //  a JavaScript custom sort function ... 
        //            //  (supports String, Number and Date sorting ...)
        //            //
        //            ldata.sort(function(a,b){
        //                var rtn;
        //                if(Y.Lang.isString(a[sortKey])) {
        //                    rtn = ( a[sortKey]<b[sortKey] ) ? -sortDir : sortDir;
        //                } else if(Y.Lang.isNumber(a[sortKey])){
        //                    rtn = (a[sortKey]-b[sortKey]<0) ? -sortDir : sortDir;
        //                } else if( a[sortKey].getTime ){
        //                    rtn = ((a[sortKey].getTime() - b[sortKey].getTime())<0) ? -sortDir : sortDir;
        //                }
        //                return rtn;
        //            });

        //        }

        //        //
        //        //  Array "rdata" is now sorted, return a slice 
        //        //    for the provided current "page"
        //        //
        //        var startIndex  = (qs.page-1)*qs.itemsPerPage,
        //            endIndex    = startIndex + qs.itemsPerPage;

        //        resp.Results    = ldata.slice(startIndex,endIndex);
        //        resp.totalItems = totalRec;

        //        // expected Response MUST include
        //        //  { totalItems:nnn, Results:[{ data row 1},{ data row 2}, ...{}] }                
        //        return resp;
        //    }

        //});

        // Create datasource
        var myDS = new Y.DataSource.IO({ source: "/Music/Load" });

        // plugin a Schema to the DataSource
        myDS.plug(Y.Plugin.DataSourceJSONSchema, {
            schema: {
                resultListLocator: "Results",
                resultFields: ['Id', 'Title', 'Album', 'Artists', 'Genres'],
                metaFields: {
                    page:         "page",
                    itemsPerPage: "itemsPerPage",
                    totalItems:   "totalItems"
                }
            }
        });

        // Query strings to use
        var qstring_init = "?page={page}&itemsPerPage={itemsPerPage}&sortBy={sortBy}",    
            qstring = qstring_init + '&searchQuery={query}';

        // Instantiate the DT with scrolling, sorting and pagination
        var myDT = new Y.DataTable({
            sortable: true,
            columns : [
                { key:'Title' },
                { key: 'Album' },
                { key: 'Artists' },
                { key: 'Genres' }
            ],
            paginator: new Y.PaginatorView({
                model: new Y.PaginatorModel({
                    itemsPerPage: 100
                }),
                container: '#pagCont'
            }),

            // define custom DS requestString ....
            requestStringTemplate: qstring_init
        });

        // Attach datasource to datatable
        myDT.plug(Y.Plugin.DataTableDataSource, { datasource: myDS });

        // When doing DS pagination, you MUST render the DT "after" instantiating the DT ... (DS only) 
        myDT.render("#tableB");

        // Bind autocomplete query event
        autoC.on('query',function(e,dt){

            // Update the request string template
            this.set('requestStringTemplate',Y.Lang.sub(qstring,{
                query:e.query
            }));

            // Load new data
            this.datasource.load({
                request:Y.Lang.sub( this.get('requestStringTemplate'),{
                    page:           1,
                    itemsPerPage:   this.paginator.model.get('itemsPerPage'),
                    sortBy:         Y.JSON.stringify( this.get('sortBy') || {} ) || null
                })
            });

        }, myDT);
   
        // Bind autocomplete highlight event
        autoC.on('select',function(o) {

            this.set('requestStringTemplate',Y.Lang.sub(qstring,{
                query: o.result.text
            }));
        
            this.datasource.load({
                request:Y.Lang.sub( this.get('requestStringTemplate'),{
                    page:           1,
                    itemsPerPage:   this.paginator.model.get('itemsPerPage'),
                    sortBy:         Y.JSON.stringify( this.get('sortBy') || {} ) || null
                })
            });        
        }, myDT);

        myDT.on('sort', function (e) {
            e.preventDefault();
            console.log(e);
            myDT.sort(e);
            return;
        });

        // Fire off the initial request from the DS ...          
        myDT.datasource.load({
            request:Y.Lang.sub( myDT.get('requestStringTemplate'),{
                page:           1,
                itemsPerPage:   myDT.paginator.model.get('itemsPerPage'),
                sortBy:         Y.JSON.stringify( myDT.get('sortBy') || {} ) || null
            })
        });
    })