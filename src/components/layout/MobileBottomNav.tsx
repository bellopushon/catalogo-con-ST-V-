import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Settings, 
  Plus
} from 'lucide-react';

const navigationItems = [
  { icon: LayoutDashboard, label: 'Inicio', href: '/admin' },
  { icon: Package, label: 'Productos', href: '/admin/products' },
  { icon: Plus, label: '', href: '/admin/products?new=true', isAction: true },
  { icon: FolderOpen, label: 'Categorías', href: '/admin/categories' },
  { icon: Settings, label: 'Ajustes', href: '/admin/settings' },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white admin-dark:bg-gray-800 border-t border-gray-200 admin-dark:border-gray-700 z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.href || 
            (item.href === '/admin' && location.pathname === '/admin');
          
          if (item.isAction) {
            return (
              <Link
                key={index}
                to={item.href}
                className="flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                <item.icon className="w-6 h-6 text-white" />
              </Link>
            );
          }
          
          return (
            <Link
              key={index}
              to={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-0 flex-1 ${
                isActive
                  ? 'text-indigo-600 admin-dark:text-indigo-400 bg-indigo-50 admin-dark:bg-indigo-900/30'
                  : 'text-gray-600 admin-dark:text-gray-400 hover:text-gray-900 admin-dark:hover:text-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
