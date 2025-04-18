
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../dashboard/Sidebar";
import Header from "../dashboard/Header";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="bg-gray-50 flex h-screen overflow-hidden">

      {/* Mobile Sidebar (Overlay) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out ${
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
      <div className="flex-1 flex flex-col overflow-hidden">
         {/* Header - Removed sidebar toggle props */}
         <Header
           toggleMobileMenu={toggleMobileMenu}
         />
         {/* Content Area - Allow vertical scrolling */}
         <main className="flex-1 overflow-y-auto bg-gray-50/95 backdrop-blur-sm">
           <Outlet />
         </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
