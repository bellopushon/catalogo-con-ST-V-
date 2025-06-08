import React, { useState } from 'react';
import { Calendar, ChevronDown, Crown } from 'lucide-react';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface DateRangeFilterProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  userPlan: string;
  disabled?: boolean;
}

const getDateRanges = (): DateRange[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  return [
    {
      start: today,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: 'Hoy'
    },
    {
      start: yesterday,
      end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: 'Ayer'
    },
    {
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: 'Últimos 7 días'
    },
    {
      start: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: 'Últimos 15 días'
    },
    {
      start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: 'Últimos 30 días'
    }
  ];
};

export default function DateRangeFilter({ 
  selectedRange, 
  onRangeChange, 
  userPlan,
  disabled = false 
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRanges = getDateRanges();
  const canUseAdvancedFilters = userPlan === 'emprendedor' || userPlan === 'profesional';

  // For free users, only show "Hoy"
  const availableRanges = canUseAdvancedFilters ? dateRanges : [dateRanges[0]];

  const handleCustomRangeSubmit = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      
      if (start <= end) {
        const customRange: DateRange = {
          start,
          end: new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
        };
        onRangeChange(customRange);
        setShowCustomRange(false);
        setIsOpen(false);
      }
    }
  };

  if (disabled || !canUseAdvancedFilters) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 admin-dark:text-gray-400 bg-gray-100 admin-dark:bg-gray-700 px-3 py-1 rounded-full">
        <Calendar className="w-4 h-4" />
        <span>{selectedRange.label}</span>
        {!canUseAdvancedFilters && (
          <Crown className="w-4 h-4 text-yellow-500" title="Filtros avanzados disponibles en planes de pago" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-500 admin-dark:text-gray-400 bg-gray-100 admin-dark:bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 admin-dark:hover:bg-gray-600 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>{selectedRange.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false);
              setShowCustomRange(false);
            }} 
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white admin-dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 admin-dark:border-gray-600 z-20">
            {!showCustomRange ? (
              <>
                <div className="p-3 border-b border-gray-200 admin-dark:border-gray-600">
                  <h3 className="font-medium text-gray-900 admin-dark:text-white text-sm">Período de tiempo</h3>
                </div>
                <div className="p-2">
                  {availableRanges.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onRangeChange(range);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedRange.label === range.label
                          ? 'bg-indigo-50 admin-dark:bg-indigo-900/30 text-indigo-700 admin-dark:text-indigo-300'
                          : 'text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-700'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                  
                  {canUseAdvancedFilters && (
                    <button
                      onClick={() => setShowCustomRange(true)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-700 transition-colors border-t border-gray-200 admin-dark:border-gray-600 mt-2 pt-3"
                    >
                      Rango personalizado...
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 admin-dark:text-white text-sm">Rango personalizado</h3>
                  <button
                    onClick={() => setShowCustomRange(false)}
                    className="text-gray-400 hover:text-gray-600 admin-dark:hover:text-gray-300"
                  >
                    ←
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 admin-dark:text-gray-300 mb-1">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg text-sm admin-dark:bg-gray-700 admin-dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 admin-dark:text-gray-300 mb-1">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg text-sm admin-dark:bg-gray-700 admin-dark:text-white"
                    />
                  </div>
                  
                  <button
                    onClick={handleCustomRangeSubmit}
                    disabled={!customStart || !customEnd}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
