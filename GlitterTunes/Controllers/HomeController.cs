using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Data.Objects;
using System.IO;

using GlitterTunes.Models;
using System.Diagnostics;

namespace GlitterTunes.Controllers
{
    public class HomeController : Controller
    {
        // Database reference to music files
        protected MusicFiles musicFiles = new MusicFiles();

        // Default index action
        public ActionResult Index()
        {
            // Set defaults
            ViewBag.Guid = "";
            ViewBag.Title = "";
            ViewBag.Artists = "";
            ViewBag.Album = "";

            return View();
        }

        // Load data action
        public JsonResult Load(int page, int itemsPerPage, string sortBy, string sortDirection, string searchQuery)
        {
            // Construct new params
            FetchDtParams parameters = new FetchDtParams();
            parameters.pageNumber = page;
            parameters.pageNumItems = itemsPerPage;
            parameters.sortColumn = sortBy;
            parameters.sortDirection = sortDirection;
            parameters.searchQuery = searchQuery;

            // Get data from database
            FetchDtResultsMusic files = musicFiles.fetchDt(parameters);

            // Return JSON data
            return Json(files, JsonRequestBehavior.AllowGet);
        }

        // Loads playlists data
        public JsonResult LoadPlaylists()
        {
            // Storage for lists
            List<Playlist> playlists = new List<Playlist>();

            // Create some test lists
            Playlist playlist = new Playlist();
            playlist.Id = Guid.NewGuid();
            playlist.Title = "Datasource Playlist 1";
            playlists.Add(playlist);

            playlist = new Playlist();
            playlist.Id = Guid.NewGuid();
            playlist.Title = "Datasource Playlist 2";
            playlists.Add(playlist);

            // Return JSON results
            return Json(playlists, JsonRequestBehavior.AllowGet);
        }

        // Streams audio file
        public FilePathResult StreamFile(Guid id)
        {
            GlitterDataContext gdc = new GlitterDataContext();
            MusicFile mf = gdc.MusicFiles.Find(id);
            return File(mf.Filename, "audio/mpeg", "test.mp3");
        }

        //public FilePathResult StreamOggFile(Guid id)
        //{
            
            
        //}

        // Syncs the database with the physical files
        public ActionResult SyncLibrary()
        {
            ViewBag.numFiles = musicFiles.syncMusicFiles();
            return View();
        }
    }
}
