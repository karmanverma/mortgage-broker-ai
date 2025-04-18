
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
        <Sidebar onClose={closeMobileMenu} />
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
        />
      )}

      {/* Desktop Sidebar */} 
      <div
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar onClose={() => {}} />
      </div>

      {/* Main Content Area */} 
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
         {/* Header */} 
         <Header
           toggleSidebar={toggleSidebar}
           sidebarOpen={sidebarOpen}
           toggleMobileMenu={toggleMobileMenu}
         />
         {/* Content Area - Fill available height */}
         <main className="flex-1 overflow-hidden bg-gray-50/95 backdrop-blur-sm">
           <Outlet />
         </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
