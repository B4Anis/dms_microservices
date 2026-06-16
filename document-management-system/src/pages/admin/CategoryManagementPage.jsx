import React, { useEffect, useState, useMemo } from 'react';
import { categoryService } from '../../services/categoryService';
import { documentService } from '../../services/documentService';
import { useToast } from '../../contexts/ToastContext';
import CategoryTreeView from '../../components/admin/CategoryTreeView';
import CategoryFormModal from '../../components/admin/CategoryFormModal';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

const CategoryManagementPage = () => {
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'list'
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cats, docs] = await Promise.all([
        categoryService.getCategories(),
        documentService.getDocuments()
      ]);
      setCategories(cats.sort((a, b) => a.order - b.order));
      setDocuments(docs);
    } catch (err) {
      showError('Failed to load category data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute document counts per category
  const documentCounts = useMemo(() => {
    return documents.reduce((acc, doc) => {
      acc[doc.categoryId] = (acc[doc.categoryId] || 0) + 1;
      return acc;
    }, {});
  }, [documents]);

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setDefaultParentId(null);
    setIsFormOpen(true);
  };

  const handleAddChild = (parentCat) => {
    setEditingCategory(null);
    setDefaultParentId(parentCat.id);
    setIsFormOpen(true);
  };

  const handleAddRoot = () => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (cat, docCount, childCount) => {
    setCategoryToDelete({ ...cat, docCount, childCount });
    setReassignTargetId('');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (categoryToDelete.childCount > 0) {
        showError('Please delete or reassign subcategories before deleting this category.');
        setIsDeleting(false);
        return;
      }
      if (categoryToDelete.docCount > 0) {
        if (!reassignTargetId) {
          showError('Please select a target category to reassign documents.');
          setIsDeleting(false);
          return;
        }
        await categoryService.reassignDocuments(categoryToDelete.id, reassignTargetId);
      }
      await categoryService.deleteCategory(categoryToDelete.id);
      showSuccess('Category deleted successfully');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      showError('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  // Flat list view
  const buildFlatList = () => {
    const result = [];
    const visit = (parentId, level) => {
      categories
        .filter(c => c.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .forEach(cat => {
          result.push({ ...cat, level });
          visit(cat.id, level + 1);
        });
    };
    visit(null, 0);
    return result;
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  const reassignOptions = categories
    .filter(c => c.id !== categoryToDelete?.id)
    .map(c => ({ label: `${c.icon || ''} ${c.name}`, value: c.id }));

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-6">
      {/* HEADER */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Category Management</h2>
          <p className="mt-1 text-sm text-gray-500">{categories.length} categories total</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              🌳 Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              📋 List
            </button>
          </div>
          <Button variant="primary" onClick={handleAddRoot}>+ Add Category</Button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 max-w-md">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search categories..." />
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : viewMode === 'tree' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <CategoryTreeView
            allCategories={searchQuery ? filteredCategories : categories}
            documentCounts={documentCounts}
            onEdit={handleEdit}
            onAddChild={handleAddChild}
            onDelete={handleDeleteRequest}
          />
        </div>
      ) : (
        // LIST VIEW
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildFlatList()
                .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(cat => {
                  const parent = categories.find(c => c.id === cat.parentId);
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3" style={{ paddingLeft: `${cat.level * 20}px` }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                            {cat.icon || '📁'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                            {cat.description && <p className="text-xs text-gray-500 truncate max-w-xs">{cat.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parent ? `${parent.icon || ''} ${parent.name}` : <span className="italic text-gray-400">Top Level</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={documentCounts[cat.id] > 0 ? 'info' : 'default'}>
                          {documentCounts[cat.id] || 0}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => handleAddChild(cat)} className="text-gray-500 hover:text-blue-600 text-xs font-medium">+ Sub</button>
                          <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                          <button onClick={() => handleDeleteRequest(cat, documentCounts[cat.id] || 0, categories.filter(c => c.parentId === cat.id).length)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={editingCategory}
        allCategories={categories}
        defaultParentId={defaultParentId}
        onSuccess={fetchData}
      />

      {/* DELETE / REASSIGN MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={isDeleting ? undefined : () => setIsDeleteModalOpen(false)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          {categoryToDelete?.childCount > 0 ? (
            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">⚠️ Cannot Delete</p>
              <p><strong>{categoryToDelete.name}</strong> has {categoryToDelete.childCount} subcategories. Please delete or move them first.</p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                You are about to delete <strong>{categoryToDelete?.name}</strong>. This cannot be undone.
              </div>

              {categoryToDelete?.docCount > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    This category has <span className="font-bold">{categoryToDelete.docCount} documents</span>. You must reassign them before deletion.
                  </p>
                  <Select
                    label="Move documents to:"
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    options={[{ label: '-- Select target category --', value: '' }, ...reassignOptions]}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
            {categoryToDelete?.childCount === 0 && (
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={isDeleting}
                disabled={categoryToDelete?.docCount > 0 && !reassignTargetId}
              >
                {categoryToDelete?.docCount > 0 ? 'Reassign & Delete' : 'Delete Category'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;
