import React, { useState } from 'react';
import { ShoppingBag, Menu } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import UserDropdown from '../profile/UserDropdown';
import MobileSidebar from './MobileSidebar';
import { useLocation } from 'react-router-dom';

interface AdminHeaderProps {
  isMobile?: boolean;
}

export default function AdminHeader({ isMobile = false }: AdminHeaderProps) {
  const { state } = useStore();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const location = useLocation();
  
  if (isMobile) {
    return (
      <>
        <header className="bg-white admin-dark:bg-gray-800 border-b border-gray-200 admin-dark:border-gray-700 px-4 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-900 admin-dark:text-white" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 admin-dark:text-white">Tutaviendo</h1>
                  {state.currentStore && (
                    <p className="text-xs text-gray-500 admin-dark:text-gray-400 truncate max-w-32">
                      {state.currentStore.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UserDropdown />
            </div>
          </div>
        </header>

        <MobileSidebar 
          isOpen={showMobileSidebar} 
          onClose={() => setShowMobileSidebar(false)} 
        />
      </>
    );
  }

  return (
    <header className="bg-white admin-dark:bg-gray-800 border-b border-gray-200 admin-dark:border-gray-700 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="lg:ml-0 ml-12">
          <h1 className="text-xl font-semibold text-gray-900 admin-dark:text-white">
            Panel de Administración
          </h1>
          {state.currentStore && (
            <p className="text-sm text-gray-500 admin-dark:text-gray-400">{state.currentStore.name}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
