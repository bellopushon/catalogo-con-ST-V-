import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, Download, Info } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { exportToPDF, exportToExcel } from '../../utils/export';

interface ExportModalProps {
  onClose: () => void;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const { state } = useStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  const store = state.currentStore;
  const products = store?.products || [];
  const categories = store?.categories || [];
  
  const handleExportPDF = async () => {
    try {
      setIsExporting('pdf');
      await exportToPDF(products, categories, store!);
      setIsExporting(null);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setIsExporting(null);
    }
  };
  
  const handleExportExcel = async () => {
    try {
      setIsExporting('excel');
      await exportToExcel(products, categories, store!);
      setIsExporting(null);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 admin-dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Exportar Productos</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 admin-dark:text-gray-400 admin-dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 admin-dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 admin-dark:text-white">Selecciona formato de exportación</h3>
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className="p-1 text-gray-500 hover:text-gray-700 admin-dark:text-gray-400 admin-dark:hover:text-gray-300 rounded-full hover:bg-gray-100 admin-dark:hover:bg-gray-700"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            
            {showInfo && (
              <div className="bg-blue-50 admin-dark:bg-blue-900/20 border border-blue-200 admin-dark:border-blue-700 rounded-lg p-3 mb-4 text-sm text-blue-800 admin-dark:text-blue-200">
                <p className="mb-1"><strong>PDF:</strong> Ideal para imprimir o compartir un catálogo visual.</p>
                <p><strong>Excel:</strong> Perfecto para análisis, edición masiva o importación a otros sistemas.</p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 admin-dark:text-gray-300 mb-4">
              Se exportarán {products.length} productos de tu tienda "{store?.name}".
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF Export */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 admin-dark:border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-red-100 admin-dark:bg-red-900/30 rounded-full flex items-center justify-center">
                {isExporting === 'pdf' ? (
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FileText className="w-8 h-8 text-red-600 admin-dark:text-red-400" />
                )}
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 admin-dark:text-white">Exportar a PDF</h4>
                <p className="text-xs text-gray-500 admin-dark:text-gray-400">Catálogo visual</p>
              </div>
            </button>
            
            {/* Excel Export */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null}
              className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 admin-dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 admin-dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-green-100 admin-dark:bg-green-900/30 rounded-full flex items-center justify-center">
                {isExporting === 'excel' ? (
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FileSpreadsheet className="w-8 h-8 text-green-600 admin-dark:text-green-400" />
                )}
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 admin-dark:text-white">Exportar a Excel</h4>
                <p className="text-xs text-gray-500 admin-dark:text-gray-400">Datos completos</p>
              </div>
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 admin-dark:text-gray-400 flex items-center justify-center gap-1">
              <Download className="w-3 h-3" />
              Los archivos se descargarán automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
