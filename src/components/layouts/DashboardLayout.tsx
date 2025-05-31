import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../dashboard/Sidebar";
import Header from "../dashboard/Header";

const DashboardLayout = () => {
  // Persist sidebar state in localStorage
  const getSidebarInitial = () => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('sidebarOpen');
      if (saved !== null) return saved === 'true';
    }
    return true;
  };
  const [sidebarOpen, setSidebarOpen] = useState(getSidebarInitial);
  useEffect(() => {
    window.localStorage.setItem('sidebarOpen', sidebarOpen ? 'true' : 'false');
  }, [sidebarOpen]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="bg-background flex h-screen overflow-hidden">

      {/* Mobile Sidebar (Overlay) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border shadow-sm transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Pass only close function for mobile */}
        <Sidebar isMobile={true} isOpen={true} toggleSidebar={() => {}} onClose={closeMobileMenu} />
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
        />
      )}

      {/* Desktop Sidebar - Takes up space in the flex layout */}
      <div
        className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <Sidebar isMobile={false} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onClose={() => {}} />
      </div>

      {/* Main Content Area - Removed padding classes */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-0">
         {/* Header - Removed sidebar toggle props */}
         <Header
           toggleMobileMenu={toggleMobileMenu}
         />
         {/* Content Area - Allow vertical scrolling */}
         <main className="flex-1 overflow-y-auto bg-background relative z-0">
           <Outlet />
         </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
