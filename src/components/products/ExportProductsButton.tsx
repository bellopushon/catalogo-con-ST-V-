import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { exportToPDF, exportToExcel } from '../../utils/export';

interface ExportProductsButtonProps {
  className?: string;
}

export default function ExportProductsButton({ className = '' }: ExportProductsButtonProps) {
  const { state } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  
  const store = state.currentStore;
  const products = store?.products || [];
  const categories = store?.categories || [];
  
  const handleExportPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsExporting('pdf');
      await exportToPDF(products, categories, store!);
      setIsExporting(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setIsExporting(null);
    }
  };
  
  const handleExportExcel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsExporting('excel');
      await exportToExcel(products, categories, store!);
      setIsExporting(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setIsExporting(null);
    }
  };
  
  // Si no hay productos, no mostrar el botón
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 admin-dark:hover:bg-gray-700 transition-colors ${className}`}
        title="Exportar productos"
      >
        <Download className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Exportar</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-48 bg-white admin-dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 admin-dark:border-gray-700 z-20">
            <div className="p-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting !== null}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 admin-dark:text-gray-300 hover:bg-red-50 admin-dark:hover:bg-red-900/20 hover:text-red-700 admin-dark:hover:text-red-300 rounded-md transition-colors disabled:opacity-50"
              >
                {isExporting === 'pdf' ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FileText className="w-4 h-4 text-red-500" />
                )}
                Exportar a PDF
              </button>
              
              <button
                onClick={handleExportExcel}
                disabled={isExporting !== null}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 admin-dark:text-gray-300 hover:bg-green-50 admin-dark:hover:bg-green-900/20 hover:text-green-700 admin-dark:hover:text-green-300 rounded-md transition-colors disabled:opacity-50"
              >
                {isExporting === 'excel' ? (
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                )}
                Exportar a Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
