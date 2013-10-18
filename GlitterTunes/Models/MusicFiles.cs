using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using Id3;
using Id3.Id3v2;
using Id3.Id3v1;
using System.Diagnostics;
using System.Data;
using System.Data.Entity.Infrastructure;
using System.Reflection;
using System.Data.Entity;

namespace GlitterTunes.Models
{
    // Music file record
    public class MusicFile
    {
        public Guid Id { get; set; }
        public String Filename { get; set; }
        public String Title { get; set; }
        public String Album { get; set; }
        public String Artists { get; set; }
        public String Genres { get; set; }
        public String Duration { get; set; }
        public ICollection<Playlist> Playlists { get; set; }
    }

    // Represents a music file record for YUI datatable
    public class MusicFileDtRow
    {
        public Guid Id { get; set; }
        public String Title { get; set; }
        public String Album { get; set; }
        public String Artists { get; set; }
        public String Genres { get; set; }
    }

    // Represents a fetch dt results object for music files
    public class FetchDtResultsMusic
    {
        // Database results
        public List<MusicFileDtRow> Results = new List<MusicFileDtRow>();

        // Total number of rows available for given filters with the exception of pagination
        public int totalRecords = 0;

        // The number of items to show per page
        public int itemsPerPage = 0;

        // The row number of the first row returned
        public int itemIndexStart = 0;

        // The schema for the full results
        public Dictionary<String, MusicFileDtRow> ResultsFull = new Dictionary<String, MusicFileDtRow>();

        // Constructor
        public FetchDtResultsMusic(List<MusicFileDtRow> _results, Dictionary<String, MusicFileDtRow> _resultsFull, int _totalItems, int _itemsPerPage, int _itemIndexStart)
        {
            Results = _results;
            ResultsFull = _resultsFull;
            totalRecords = _totalItems;
            itemsPerPage = _itemsPerPage;
            itemIndexStart = _itemIndexStart;   
        }
    }

    // Class methods for use with the music files database table
    public class MusicFiles : GlitterModelBase
    {
        // Set database table name?
        public String TableName = "MusicFiles";

        // Used to retrieve info about a certain music item
        public MusicFile GetMusicFileData(Guid guid)
        {
            return gdc.MusicFiles.Find(guid);
        }

        // Fetch records for datatable
        public FetchDtResultsMusic fetchDt(FetchDtParams parameters)
        {
            // Get datatable column list
            PropertyInfo[] infoDt = typeof(MusicFileDtRow).GetProperties();
            List<String> columnListDt = (from r in infoDt select r.Name).ToList();

            // Explode if we don't have any columns
            if (columnListDt.Count < 1) {
                throw new GlitterException("No columns have been specified for datatable query.");
            }

            // Check sort column
            if (!columnListDt.Contains(parameters.sortColumn)) {
                throw new GlitterException("Invalid sort column for datatable query.");
            }

            // Check sort direction
            if (parameters.sortDirection != "ASC" && parameters.sortDirection != "DESC") {
                throw new GlitterException("Invalid sort direction for datatable query.");
            }

            // Check page number
            if (parameters.pageNumber < 1) {
                throw new GlitterException("Invalid page number for datatable query.");
            }

            // Check number of items per page
            if (parameters.pageNumItems < 1 || parameters.pageNumItems > 2000) {
                throw new GlitterException("Invalid number of items per page for datatable query.");
            }

            // Make sure we didn't specify an insane length for search query
            if (parameters.searchQuery != null)
            {
                if (parameters.searchQuery.Length > 100)
                {
                    throw new GlitterException("Invalid search query length for datatable query.");
                }
            }

            // Generate WHERE clause
            List<String> wheres = new List<String>();
            foreach (String columnDt in columnListDt) {
                wheres.Add("(" + columnDt + " LIKE {0})");
            }

            // Construct query to get total rows
            String queryFullResults = @"SELECT " + string.Join(", ", columnListDt.ToArray()) + " FROM " + TableName;

            // Construct query to retrieve records
            String query = @"SELECT " + string.Join(", ", columnListDt.ToArray()) + " FROM " + TableName;

            // Add the search query if it is populated
            if (parameters.searchQuery != null)
            {
                queryFullResults += " WHERE " + string.Join(" OR ", wheres.ToArray());
                query += " WHERE " + string.Join(" OR ", wheres.ToArray());
            }

            queryFullResults += " ORDER BY " + parameters.sortColumn + " " + parameters.sortDirection;
            query += " ORDER BY " + parameters.sortColumn + " " + parameters.sortDirection + @"
                OFFSET " + ((parameters.pageNumber - 1) * parameters.pageNumItems).ToString() + @" ROWS
                FETCH NEXT " + parameters.pageNumItems.ToString() + " ROWS ONLY";

            Debug.WriteLine("Fail in query: " + queryFullResults);

            // Get the total number of rows available
            List<MusicFileDtRow> rowCountResults = gdc.Database.SqlQuery<MusicFileDtRow>(queryFullResults, "%" + parameters.searchQuery + "%").ToList();
            int numRows = rowCountResults.Count;

            // Model database results for full results
            Dictionary<String, MusicFileDtRow> dbResultsFull = new Dictionary<String, MusicFileDtRow>();
            foreach (MusicFileDtRow row in rowCountResults)
            {
                //dbResultsFull.Add(row.Id.ToString(), row);
            }

            // Get database results
            var dbResults = gdc.Database.SqlQuery<MusicFileDtRow>(query, "%" + parameters.searchQuery + "%").ToList();

            // Create results object
            return new FetchDtResultsMusic(dbResults, dbResultsFull, numRows, parameters.pageNumItems, parameters.pageNumItems * (parameters.pageNumber - 1));
        }

        // Used to remove records that no longer have existing files
        public int syncMusicFiles()
        {
            // Directories to add
            List<String> directories = new List<String>();
            directories.Add(@"D:\Music");
            directories.Add(@"D:\mp3s");

            // Get all files
            List<String> files = new List<String>();
            foreach (String directory in directories) {
                List<String> items = Directory.GetFiles(directory, "*.mp3", SearchOption.AllDirectories).ToList<String>();
                foreach(String item in items) {
                    files.Add(item);
                }
            }

            Debug.WriteLine("Found: " + files.Count + " Files");

            // Get ALL records in database
            List<MusicFile> rows = gdc.MusicFiles.ToList<MusicFile>();
            Debug.WriteLine(rows.Count());

            // Mark items for deletion
            foreach (MusicFile row in rows)
            {
                // If the physical file doesn't exist, remove it from the database
                if (!files.Contains(row.Filename))
                {
                    Debug.WriteLine("Deleting File: '" + row.Filename + "'");
                    gdc.MusicFiles.Remove(row);
                }
            }

            // Process deletion
            gdc.SaveChanges();

            // Edit existing records
            foreach (MusicFile row in rows)
            {
                // Skip files that don't already exist
                if (!files.Contains(row.Filename))
                {
                    continue;
                }

                // Get ID3 tag information
                Mp3File mp3 = new Mp3File(row.Filename);
                Id3Tag tag = mp3.GetTag(Id3TagFamily.FileStartTag);
                
                try {
                    // Set ID3 tag information
                    row.Title = tag.Title.Value;
                    row.Album = tag.Album.Value;
                    row.Artists = tag.Artists.Value;
                    row.Genres = tag.Genre.Value;
                    //row.Duration = mp3.Audio.Duration.ToString("g");

                    // Dispose object?
                    mp3.Dispose(); 

                    Debug.WriteLine("Editing file: '" + row.Filename + "'");
                    Debug.WriteLine("File Duration: '" + mp3.Audio.Duration.ToString("g") + "'");

                }
                catch (NullReferenceException e) {
                    // Remove problematic files
                    gdc.MusicFiles.Remove(row);
                }
            }

            // Get all filenames currently in the data set
            var existingFilenames = from row in rows
                                    select row.Filename;

            // Add new records
            foreach (String file in files)
            {
                // Skip adding items that already exist
                if(existingFilenames.Contains(file)) {
                    continue;
                }

                try
                {
                    // Get ID3 tag information
                    Mp3File mp3 = new Mp3File(file);
                    Id3Tag tag = mp3.GetTag(Id3TagFamily.FileStartTag);

                    // Set ID3 tag information
                    MusicFile mf = gdc.MusicFiles.Create();
                    mf.Id = Guid.NewGuid();
                    mf.Filename = file;
                    mf.Title = tag.Title.Value;
                    mf.Album = tag.Album.Value;
                    mf.Artists = tag.Artists.Value;
                    mf.Genres = tag.Genre.Value;
                    //mf.Duration = mp3.Audio.Duration.ToString("g");

                    // Dispose object?
                    mp3.Dispose();

                    // Add the new record
                    gdc.MusicFiles.Add(mf);

                    Debug.WriteLine("Adding file: '" + file + "'");
                }
                catch (Exception e) {
                    Debug.WriteLine("Unable to add file: '" + file + "'");
                }
            }

            // Write changes to database
            return gdc.SaveChanges();
        }
    }
}