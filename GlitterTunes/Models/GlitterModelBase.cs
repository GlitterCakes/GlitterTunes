using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace GlitterTunes.Models
{
    // Base model for all database table models to extend from
    public class GlitterModelBase
    {
        // Data access
        protected GlitterDataContext gdc = new GlitterDataContext();

        // Current database table name
        protected String TableName { get; set; }
    }

    // Parameters object used in conjunction with calling FetchDt
    public class FetchDtParams
    {
        // Search text to filter results by
        public string searchQuery { get; set; }

        // The column to sort results by
        public string sortColumn { get; set; }

        // The direction to sort by
        public string sortDirection { get; set; }

        // The page number
        public int pageNumber { get; set; }

        // The number of items per page
        public int pageNumItems { get; set; }
    }

    // Represents data that will be sent back over JSON for datatable
    public class FetchDtResults<ResultRowType>
    {
        // Database results
        public List<ResultRowType> Results = new List<ResultRowType>();

        // Total number of rows available for given filters with the exception of pagination
        public int totalRecords = 0;

        // The number of items to show per page
        public int itemsPerPage = 0;

        // The row number of the first row returned
        public int itemIndexStart = 0;

        // Constructor
        public FetchDtResults(List<ResultRowType> _results, int _totalItems, int _itemsPerPage, int _itemIndexStart)
        {
            Results = _results;
            totalRecords = _totalItems;
            itemsPerPage = _itemsPerPage;
            itemIndexStart = _itemIndexStart;
        }
    }


}