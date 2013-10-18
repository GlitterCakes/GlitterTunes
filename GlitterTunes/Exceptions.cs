using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace GlitterTunes
{
    // Generic application exception
    public class GlitterException : Exception
    {
        public GlitterException(String message) : base(message) { }
    }
}