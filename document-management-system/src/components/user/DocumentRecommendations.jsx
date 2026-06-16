import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopRecommendations, getPopularDocuments } from '../../utils/recommendationEngine';
import { documentService } from '../../services/documentService';

// Skeleton card shown while loading
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-52 bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
    <div className="h-2 bg-gray-200 rounded w-full" />
  </div>
);

// Mini card for each recommendation
const RecommendationCard = ({ doc, category, onClick }) => {
  const fileTypeColors = {
    PDF: 'bg-red-100 text-red-600',
    DOCX: 'bg-blue-100 text-blue-600',
    XLSX: 'bg-green-100 text-green-600',
  };
  const fileTypeIcons = {
    PDF: '📄', DOCX: '📝', XLSX: '📊',
  };
  const type = doc.fileType?.toUpperCase() || 'FILE';
  const colorClass = fileTypeColors[type] || 'bg-gray-100 text-gray-600';
  const icon = fileTypeIcons[type] || '📎';

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-52 bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
        {doc.title}
      </h4>
      {category && (
        <p className="text-xs text-gray-500 mb-2 truncate">
          {category.icon} {category.name}
        </p>
      )}
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {doc.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
              {tag}
            </span>
          ))}
          {doc.tags.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
              +{doc.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

/**
 * DocumentRecommendations
 * Shows "You might also be interested in" section on the document detail page.
 */
const DocumentRecommendations = ({ currentDocument, categories = [] }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentDocument) return;

    let cancelled = false;

    const loadRecs = async () => {
      setIsLoading(true);
      try {
        const allDocs = await documentService.getDocuments();
        if (cancelled) return;

        let recs = getTopRecommendations(currentDocument, allDocs, 6);

        // Fallback to popular if not enough good recommendations
        if (recs.length < 3) {
          const popular = getPopularDocuments(allDocs, 6, currentDocument.id);
          // Merge without duplicates
          const existing = new Set(recs.map(r => r.id));
          recs = [...recs, ...popular.filter(p => !existing.has(p.id))].slice(0, 6);
        }

        setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadRecs();
    return () => { cancelled = true; };
  }, [currentDocument?.id]);

  if (!isLoading && recommendations.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h3 className="text-lg font-bold text-gray-900">You might also be interested in</h3>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-200">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : recommendations.map(doc => (
              <RecommendationCard
                key={doc.id}
                doc={doc}
                category={categories.find(c => c.id === doc.categoryId)}
                onClick={() => navigate(`/documents/${doc.id}`)}
              />
            ))}
      </div>
    </div>
  );
};

export default DocumentRecommendations;
