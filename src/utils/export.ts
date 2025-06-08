import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Product, Category, Store } from '../contexts/StoreContext';
import { formatCurrency } from './constants';

// Tipos para jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Función para truncar texto que exceda el límite de Excel
const truncateText = (text: string | null | undefined, maxLength: number = 32767): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Función para obtener el nombre de la categoría
const getCategoryName = (product: Product, categories: Category[]): string => {
  if (!product.categoryId) return 'Sin categoría';
  const category = categories.find(c => c.id === product.categoryId);
  return category ? category.name : 'Sin categoría';
};

// Función para obtener el estado del producto
const getProductStatus = (product: Product): string => {
  if (!product.isActive) return 'Inactivo';
  if (product.isFeatured) return 'Destacado';
  return 'Activo';
};

// Función para exportar a PDF
export const exportToPDF = (products: Product[], categories: Category[], store: Store): void => {
  // Crear nuevo documento PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configurar fuentes y colores
  const primaryColor = '#6366f1'; // Indigo
  const textColor = '#1f2937'; // Gray-800
  const lightGray = '#f3f4f6'; // Gray-100

  // Añadir encabezado con información de la tienda
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Catálogo de Productos - ${store.name}`, 105, 12, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, 18, { align: 'center' });

  // Añadir información de la tienda
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información de la Tienda:', 14, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${store.name}`, 14, 42);
  doc.text(`URL: tutaviendo.com/store/${store.slug}`, 14, 48);
  if (store.description) {
    doc.text(`Descripción: ${store.description}`, 14, 54);
  }
  
  // Añadir resumen de productos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen:', 14, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de productos: ${products.length}`, 14, 72);
  doc.text(`Productos activos: ${products.filter(p => p.isActive).length}`, 14, 78);
  doc.text(`Productos destacados: ${products.filter(p => p.isFeatured).length}`, 14, 84);
  
  // Preparar datos para la tabla
  const tableData = products.map(product => [
    product.name,
    getCategoryName(product, categories),
    formatCurrency(product.price, store.currency),
    getProductStatus(product),
    product.shortDescription || ''
  ]);
  
  // Añadir tabla de productos
  doc.autoTable({
    startY: 95,
    head: [['Nombre', 'Categoría', 'Precio', 'Estado', 'Descripción']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 60 }
    },
    margin: { top: 95 },
    didDrawPage: (data) => {
      // Añadir pie de página
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Tutaviendo - Catálogo de ${store.name} - Página ${doc.getNumberOfPages()}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });

  // Guardar el PDF
  doc.save(`catalogo-${store.slug}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Función para exportar a Excel
export const exportToExcel = (products: Product[], categories: Category[], store: Store): void => {
  // Preparar datos para Excel
  const excelData = products.map(product => ({
    'Nombre': truncateText(product.name),
    'Categoría': getCategoryName(product, categories),
    'Precio': product.price,
    'Precio Formateado': formatCurrency(product.price, store.currency),
    'Estado': getProductStatus(product),
    'Activo': product.isActive ? 'Sí' : 'No',
    'Destacado': product.isFeatured ? 'Sí' : 'No',
    'Descripción Corta': truncateText(product.shortDescription),
    'Descripción Larga': truncateText(product.longDescription),
    'Imagen Principal': truncateText(product.mainImage),
    'Fecha de Creación': new Date(product.createdAt).toLocaleDateString('es-ES'),
    'Última Actualización': new Date(product.updatedAt).toLocaleDateString('es-ES')
  }));

  // Crear libro de trabajo
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  
  // Ajustar anchos de columna
  const columnWidths = [
    { wch: 30 }, // Nombre
    { wch: 20 }, // Categoría
    { wch: 10 }, // Precio
    { wch: 15 }, // Precio Formateado
    { wch: 15 }, // Estado
    { wch: 10 }, // Activo
    { wch: 10 }, // Destacado
    { wch: 40 }, // Descripción Corta
    { wch: 50 }, // Descripción Larga
    { wch: 50 }, // Imagen Principal
    { wch: 15 }, // Fecha de Creación
    { wch: 15 }  // Última Actualización
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // Añadir hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Guardar archivo
  XLSX.writeFile(workbook, `catalogo-${store.slug}-${new Date().toISOString().split('T')[0]}.xlsx`);
};
