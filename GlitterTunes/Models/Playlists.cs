using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace GlitterTunes.Models
{
    // Playlist record
    public class Playlist
    {
        public Guid Id { get; set; }
        public String Title { get; set; }
        public ICollection<MusicFile> MusicFiles { get; set; }
    }
}