import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Select from '../common/Select';
import { importService } from '../../services/importService';
import { useUsers } from '../../hooks/useUsers';

const ImportUsersWizard = ({ isOpen, onClose }) => {
  const { departments, fetchUsers } = useUsers();
  const [step, setStep] = useState(1);
  
  // State for Step 1
  const [file, setFile] = useState(null);
  const [rawCsvData, setRawCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const fileInputRef = useRef(null);

  // State for Step 2
  const [columnMap, setColumnMap] = useState({});
  
  // State for Step 3
  const [validatedRows, setValidatedRows] = useState([]);
  const [importOnlyValid, setImportOnlyValid] = useState(true);

  // State for Step 4 & 5
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setRawCsvData([]);
    setCsvHeaders([]);
    setColumnMap({});
    setValidatedRows([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResults(null);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // --- STEP 1 LOGIC ---
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File too large (Max 5MB)');
      return;
    }

    setFile(selectedFile);
    try {
      const parsed = await importService.parseCSV(selectedFile);
      setRawCsvData(parsed.data);
      setCsvHeaders(parsed.headers);
      
      // Auto-map logic based on common column names
      const initialMap = {};
      const targetFields = ['firstName', 'lastName', 'email', 'role', 'status', 'departmentName'];
      
      parsed.headers.forEach(header => {
        const hLow = header.toLowerCase().replace(/[^a-z]/g, '');
        targetFields.forEach(field => {
          if (field.toLowerCase().includes(hLow) || hLow.includes(field.toLowerCase())) {
            if (!initialMap[field]) initialMap[field] = header;
          }
        });
      });
      setColumnMap(initialMap);
      
      setStep(2);
    } catch (err) {
      alert('Failed to parse CSV file');
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'firstName,lastName,email,role,status,departmentName\nJohn,Doe,john@example.com,user,active,Engineering\nJane,Smith,jane@example.com,admin,active,HR';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
  };

  // --- STEP 2 LOGIC ---
  const handleMappingChange = (targetField, csvHeader) => {
    setColumnMap(prev => ({ ...prev, [targetField]: csvHeader }));
  };

  const processMappingAndValidate = async () => {
    if (!columnMap.firstName || !columnMap.lastName || !columnMap.email) {
      alert('You must map First Name, Last Name, and Email.');
      return;
    }

    // Map raw data to standardized objects
    const mappedData = rawCsvData.map(rawRow => {
      const mapped = {
        firstName: rawRow[columnMap.firstName],
        lastName: rawRow[columnMap.lastName],
        email: rawRow[columnMap.email],
        role: columnMap.role ? rawRow[columnMap.role] : 'user',
        status: columnMap.status ? rawRow[columnMap.status] : 'active',
      };
      
      // Handle department string -> ID matching
      if (columnMap.departmentName && rawRow[columnMap.departmentName]) {
        const dName = rawRow[columnMap.departmentName].trim().toLowerCase();
        const foundDept = departments.find(d => d.name.toLowerCase() === dName);
        if (foundDept) mapped.departmentId = foundDept.id;
      }
      return mapped;
    });

    const validated = await importService.validateAllRows(mappedData);
    setValidatedRows(validated);
    setStep(3);
  };

  // --- STEP 3 & 4 LOGIC ---
  const executeImport = async () => {
    setStep(4);
    setIsImporting(true);
    
    const rowsToImport = importOnlyValid ? validatedRows.filter(r => r._isValid) : validatedRows;
    
    try {
      const results = await importService.importUsers(rowsToImport, (progress) => {
        setImportProgress(progress);
      });
      
      setImportResults(results);
      setStep(5);
      fetchUsers(); // Refresh background list
    } catch (err) {
      alert('Import failed critically.');
      handleClose();
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrors = () => {
    const errorRows = validatedRows.filter(r => !r._isValid).map(r => ({
      row: r._index,
      email: r.email,
      reason: r._errors
    }));
    importService.generateErrorReport(errorRows);
  };

  return (
    <Modal isOpen={isOpen} onClose={isImporting ? undefined : handleClose} title="Import Users via CSV" size="xl">
      
      {/* STEPS INDICATOR */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step === i ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
              step > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > i ? '✓' : i}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-medium text-gray-500 mt-2 px-1">
          <span>Upload</span>
          <span>Map</span>
          <span>Validate</span>
          <span>Import</span>
          <span>Done</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
            Upload a CSV file to bulk create users. The file should at minimum contain columns for First Name, Last Name, and Email.
            <button onClick={handleDownloadTemplate} className="ml-2 underline font-bold">Download Template</button>
          </div>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              accept=".csv"
            />
            <div className="text-4xl mb-2">📁</div>
            <p className="text-blue-600 font-medium">Click to select CSV file</p>
            <p className="text-gray-500 text-sm mt-1">Maximum size: 5MB</p>
          </div>
        </div>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Map CSV Columns to User Fields</h3>
          <p className="text-sm text-gray-500 mb-4">We've auto-detected some mappings based on your headers. Please verify them.</p>

          <div className="grid grid-cols-2 gap-4">
            {['firstName', 'lastName', 'email', 'role', 'status', 'departmentName'].map(targetField => (
              <div key={targetField} className="flex items-center gap-3">
                <span className="w-1/3 text-sm font-medium text-gray-700 capitalize">
                  {targetField.replace(/([A-Z])/g, ' $1').trim()}
                  {['firstName', 'lastName', 'email'].includes(targetField) && <span className="text-red-500 ml-1">*</span>}
                </span>
                <select 
                  className="flex-1 rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={columnMap[targetField] || ''}
                  onChange={(e) => handleMappingChange(targetField, e.target.value)}
                >
                  <option value="">-- Ignore --</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6 border-t mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={processMappingAndValidate}>Validate Data</Button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION */}
      {step === 3 && (() => {
        const validCount = validatedRows.filter(r => r._isValid).length;
        const invalidCount = validatedRows.length - validCount;

        return (
          <div className="space-y-4 h-96 flex flex-col">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-medium text-gray-900">Validation Results</h3>
                <p className="text-sm text-gray-500">Found {validatedRows.length} rows.</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="success">{validCount} Valid</Badge>
                {invalidCount > 0 && <Badge variant="danger">{invalidCount} Invalid</Badge>}
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Row</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validatedRows.map(row => (
                    <tr key={row._index} className={row._isValid ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-gray-500">{row._index}</td>
                      <td className="px-4 py-2">{row.firstName} {row.lastName}</td>
                      <td className="px-4 py-2">{row.email}</td>
                      <td className="px-4 py-2">
                        {row._isValid ? (
                          <span className="text-green-600 font-medium">✓ Ready</span>
                        ) : (
                          <span className="text-red-600 font-medium">✗ {row._errors}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="flex items-center gap-4">
                <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                {invalidCount > 0 && (
                  <button onClick={handleDownloadErrors} className="text-sm text-blue-600 hover:underline">
                    Download Error Log
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-sm text-gray-700">
                  <input type="checkbox" checked={importOnlyValid} onChange={(e) => setImportOnlyValid(e.target.checked)} className="mr-2" />
                  Import valid rows only
                </label>
                <Button variant="primary" onClick={executeImport} disabled={validCount === 0}>
                  Start Import
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* STEP 4: IMPORTING PROGRESS */}
      {step === 4 && (
        <div className="py-12 text-center space-y-6">
          <h3 className="text-xl font-medium text-gray-900">Importing Users...</h3>
          <p className="text-sm text-gray-500">Please do not close this window.</p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm font-medium mb-1">
              <span>{importProgress.current} / {importProgress.total}</span>
              <span>{Math.round((importProgress.current / importProgress.total) * 100 || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" 
                style={{ width: `${(importProgress.current / importProgress.total) * 100 || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SUMMARY */}
      {step === 5 && importResults && (
        <div className="py-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Import Complete</h3>
          
          <div className="flex justify-center gap-8 py-4 border-t border-b border-gray-100">
            <div>
              <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
              <p className="text-sm text-gray-500 uppercase font-medium">Successfully Created</p>
            </div>
            {importResults.failed.length > 0 && (
              <div>
                <p className="text-3xl font-bold text-red-600">{importResults.failed.length}</p>
                <p className="text-sm text-gray-500 uppercase font-medium">Failed to Create</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            {importResults.failed.length > 0 && (
              <Button variant="secondary" onClick={() => importService.generateErrorReport(importResults.failed)}>
                Download Failure Log
              </Button>
            )}
            <Button variant="primary" onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}

    </Modal>
  );
};

export default ImportUsersWizard;
