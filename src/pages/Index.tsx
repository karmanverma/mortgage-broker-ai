
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, MessageSquare } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-brand-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">MB</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">MortgagePro</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/#features" className="nav-link">Features</Link>
              <Link to="/#pricing" className="nav-link">Pricing</Link>
              <Link to="/#testimonials" className="nav-link">Testimonials</Link>
              <Link to="/#faq" className="nav-link">FAQ</Link>
            </nav>

            {/* CTA buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="hero-gradient flex-1 flex items-center">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold gradient-heading leading-tight">
              The AI-Powered Platform for Mortgage Brokers
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your mortgage business with intelligent lender management and an AI assistant that helps you find the perfect products for your clients.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/app">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <div className="feature-card flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <Building className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lender Management</h3>
              <p className="text-gray-600">
                Organize all your lender information in one centralized, searchable database.
              </p>
            </div>
            
            <div className="feature-card flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Assistant</h3>
              <p className="text-gray-600">
                Get instant answers about lender requirements, rate options, and mortgage products.
              </p>
            </div>
            
            <div className="feature-card flex flex-col items-center text-center p-6 md:col-span-2 lg:col-span-1">
              <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Started Now</h3>
              <p className="text-gray-600 mb-4">
                Ready to transform your mortgage business? Try MortgagePro today.
              </p>
              <Link to="/app">
                <Button variant="outline" className="mt-auto">
                  Tour Application
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
