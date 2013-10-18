using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;

namespace GlitterTunes.Models
{
    public class GlitterDataContext : DbContext
    {
        // Constructor to use custom database
        public GlitterDataContext() : base("GlitterData") { }

        // Database tables
        public DbSet<MusicFile> MusicFiles { get; set; }
        public DbSet<Playlist> Playlists { get; set; }
    }
}