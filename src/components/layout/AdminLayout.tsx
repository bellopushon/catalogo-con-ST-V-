import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import MobileBottomNav from './MobileBottomNav';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900 admin-panel">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-64">
          <AdminHeader />
          <main className="flex-1 p-4 lg:p-8">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <AdminHeader isMobile={true} />
        <main className="pb-20 pt-4">
          <div className="px-4">
            {children || <Outlet />}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
