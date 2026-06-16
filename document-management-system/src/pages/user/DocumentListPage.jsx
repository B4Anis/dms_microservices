import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import DocumentCard from '../../components/user/DocumentCard';
import FilterPanel from '../../components/user/FilterPanel';
import SmartSearchBar from '../../components/user/SmartSearchBar';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Select from '../../components/common/Select';
import DocumentUploadModal from '../../components/user/DocumentUploadModal';
import { getPopularDocuments, getTrendingDocuments } from '../../utils/recommendationEngine';
import { documentMatchesDateRange } from '../../utils/searchQueryParser';
import { fuzzyMatch } from '../../utils/fuzzyMatch';

// -----------------------------------------------------------------------
// Horizontal scroll strip for Popular / Trending
// -----------------------------------------------------------------------
const MiniDocCard = ({ doc, category, onClick }) => {
  const fileTypeIcons = { PDF: '📄', DOCX: '📝', XLSX: '📊' };
  const fileTypeColors = {
    PDF: 'bg-red-100 text-red-600',
    DOCX: 'bg-blue-100 text-blue-600',
    XLSX: 'bg-green-100 text-green-600',
  };
  const type = doc.fileType?.toUpperCase() || 'FILE';
  const icon = fileTypeIcons[type] || '📎';
  const color = fileTypeColors[type] || 'bg-gray-100 text-gray-600';

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-48 bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-base mb-2`}>
        {icon}
      </div>
      <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight mb-1">
        {doc.title}
      </h4>
      <p className="text-[10px] text-gray-500 truncate">{category?.name || ''}</p>
      <p className="text-[10px] text-gray-400 mt-1">
        {doc.viewCount || 0} views
      </p>
    </button>
  );
};

const HorizontalStrip = ({ title, icon, docs, categories, onDocClick }) => {
  if (!docs?.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
        {docs.map(doc => (
          <MiniDocCard
            key={doc.id}
            doc={doc}
            category={categories.find(c => c.id === doc.categoryId)}
            onClick={() => onDocClick(doc.id)}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------
const DocumentListPage = () => {
  const {
    documents,
    categories,
    departments,
    isLoading,
    error,
    filters,
    pagination,
    sortBy,
    sortOrder,
    fetchDocuments,
    fetchMetadata,
    updateFilters,
    updateSort,
    updatePagination,
    clearFilters,
    setDateRange,
  } = useDocuments();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Initial Fetch & URL Sync
  useEffect(() => {
    fetchDocuments();
    fetchMetadata();

    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page')) || 1;
    const urlSort = searchParams.get('sort') || 'createdAt';
    const urlOrder = searchParams.get('order') || 'desc';
    const urlCats = searchParams.get('category') ? searchParams.get('category').split(',') : [];
    const urlDepts = searchParams.get('department') ? searchParams.get('department').split(',') : [];
    const urlTypes = searchParams.get('type') ? searchParams.get('type').split(',') : [];

    updateFilters({ search: urlSearch, categories: urlCats, departments: urlDepts, fileTypes: urlTypes });
    updatePagination({ currentPage: urlPage });
    updateSort({ sortBy: urlSort, sortOrder: urlOrder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync Context -> URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.categories?.length) params.set('category', filters.categories.join(','));
    if (filters.departments?.length) params.set('department', filters.departments.join(','));
    if (filters.fileTypes?.length) params.set('type', filters.fileTypes.join(','));
    if (pagination.currentPage > 1) params.set('page', pagination.currentPage.toString());
    if (sortBy !== 'createdAt') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);

    setSearchParams(params, { replace: true });
  }, [filters, pagination.currentPage, sortBy, sortOrder, setSearchParams]);

  // Handle smart search bar output (NLP parsed filters)
  const handleParsedFilters = (parsed) => {
    updateFilters({
      search: parsed.search,
      categories: parsed.categories?.length ? parsed.categories : filters.categories,
      departments: parsed.departments?.length ? parsed.departments : filters.departments,
      fileTypes: parsed.fileTypes?.length ? parsed.fileTypes : filters.fileTypes,
    });
    setDateRange(parsed.dateRange || null);
  };

  // Client-Side Filtering & Sorting
  const filteredDocuments = useMemo(() => {
    return documents
      .filter(doc => {
        // Search (fuzzy)
        const searchMatch =
          !filters.search ||
          fuzzyMatch(filters.search, doc.title) ||
          fuzzyMatch(filters.search, doc.description || '') ||
          (doc.tags || []).some(t => fuzzyMatch(filters.search, t));

        // Categories
        const catMatch = !filters.categories?.length || filters.categories.includes(doc.categoryId);

        // Departments
        const deptMatch = !filters.departments?.length || filters.departments.includes(doc.departmentId);

        // File Types
        const typeMatch =
          !filters.fileTypes?.length ||
          filters.fileTypes.some(t => {
            if (t === 'PNG,JPG,JPEG') return ['PNG', 'JPG', 'JPEG'].includes(doc.fileType?.toUpperCase());
            return doc.fileType?.toUpperCase() === t;
          });

        // Date Range (from NLP parser)
        const dateMatch = documentMatchesDateRange(doc, filters.dateRange);

        return searchMatch && catMatch && deptMatch && typeMatch && dateMatch;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [documents, filters, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

  const currentDocuments = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredDocuments.slice(start, start + pagination.itemsPerPage);
  }, [filteredDocuments, pagination.currentPage, pagination.itemsPerPage]);

  // Popular & Trending (computed from all documents)
  const popularDocs = useMemo(() => getPopularDocuments(documents, 8), [documents]);
  const trendingDocs = useMemo(() => getTrendingDocuments(documents, 7, 8), [documents]);

  const handleSortChange = (e) => {
    const [newSortBy, newSortOrder] = e.target.value.split('-');
    updateSort({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const isFiltered =
    filters.search ||
    filters.categories?.length ||
    filters.departments?.length ||
    filters.fileTypes?.length ||
    filters.dateRange;

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon="⚠️"
          title="Error Loading Documents"
          description={error}
          action={<Button onClick={fetchDocuments}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <Button variant="secondary" size="sm" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
          {isMobileFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Filter Sidebar */}
      <aside className={`w-full md:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
        <FilterPanel
          filters={filters}
          categories={categories}
          departments={departments}
          onFilterChange={updateFilters}
          onClearFilters={() => { clearFilters(); setDateRange(null); }}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden md:flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
          <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            + Upload Document
          </Button>
        </div>

        {/* Smart Search Bar */}
        <div className="mb-4">
          <SmartSearchBar
            value={filters.search}
            onChange={(val) => updateFilters({ search: val })}
            onParsedFilters={handleParsedFilters}
            categories={categories}
            departments={departments}
            documents={documents}
          />
        </div>

        {/* Popular & Trending Strips (only when not filtered) */}
        {!isFiltered && !isLoading && (
          <>
            <HorizontalStrip
              title="Trending This Week"
              icon="🔥"
              docs={trendingDocs}
              categories={categories}
              onDocClick={(id) => navigate(`/documents/${id}`)}
            />
            <HorizontalStrip
              title="Popular Documents"
              icon="⭐"
              docs={popularDocs}
              categories={categories}
              onDocClick={(id) => navigate(`/documents/${id}`)}
            />
          </>
        )}

        {/* Sort Toolbar */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <p className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${totalItems} document${totalItems !== 1 ? 's' : ''}`}
            {filters.dateRange && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                📅 Date filtered
                <button
                  className="ml-1 hover:text-blue-900"
                  onClick={() => setDateRange(null)}
                  aria-label="Remove date filter"
                >×</button>
              </span>
            )}
          </p>
          <div className="w-44 flex-shrink-0">
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
              options={[
                { label: 'Newest First', value: 'createdAt-desc' },
                { label: 'Oldest First', value: 'createdAt-asc' },
                { label: 'Name (A-Z)', value: 'title-asc' },
                { label: 'Name (Z-A)', value: 'title-desc' },
                { label: 'Most Viewed', value: 'viewCount-desc' },
                { label: 'Size (Largest)', value: 'fileSize-desc' },
              ]}
            />
          </div>
        </div>

        {/* Document Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="py-20"><LoadingSpinner size="lg" /></div>
          ) : currentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {currentDocuments.map(doc => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  category={categories.find(c => c.id === doc.categoryId)}
                  department={departments.find(d => d.id === doc.departmentId)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              title="No documents found"
              description="Try adjusting your search or filters. Smart search understands natural language — try 'PDFs from last week'."
              action={<Button variant="ghost" onClick={() => { clearFilters(); setDateRange(null); }}>Clear Filters</Button>}
            />
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="mt-auto">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={(page) => updatePagination({ currentPage: page })}
              onItemsPerPageChange={(size) => updatePagination({ itemsPerPage: size, currentPage: 1 })}
            />
          </div>
        )}
      </div>

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchDocuments()}
        categories={categories}
        departments={departments}
      />
    </div>
  );
};

export default DocumentListPage;
