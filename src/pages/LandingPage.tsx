
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowRight, 
  Building, 
  CheckCircle2, 
  ChevronRight, 
  Menu, 
  MessageSquare, 
  Search, 
  Shield, 
  X 
} from "lucide-react";

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);

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
              <Link to="#features" className="nav-link">Features</Link>
              <Link to="#pricing" className="nav-link">Pricing</Link>
              <Link to="#testimonials" className="nav-link">Testimonials</Link>
              <Link to="#faq" className="nav-link">FAQ</Link>
            </nav>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link to="#features" className="block py-2 text-gray-600">Features</Link>
              <Link to="#pricing" className="block py-2 text-gray-600">Pricing</Link>
              <Link to="#testimonials" className="block py-2 text-gray-600">Testimonials</Link>
              <Link to="#faq" className="block py-2 text-gray-600">FAQ</Link>
              
              <div className="pt-3 border-t border-gray-100 flex flex-col space-y-3">
                <Link to="/login">
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-gradient pt-16 md:pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 gradient-heading leading-tight">
                  The AI-Powered Platform for Mortgage Brokers
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
                  Streamline your mortgage business with intelligent lender management and an AI assistant that helps you find the perfect products for your clients.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link to="/signup">
                    <Button size="lg" className="w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="#features">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      See How It Works
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1000&auto=format&fit=crop" 
                    alt="MortgagePro Dashboard" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-heading">
                Features Designed for Mortgage Professionals
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform helps you manage lenders, track applications, and get AI-powered assistance all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="feature-card">
                <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Assistant</h3>
                <p className="text-gray-600 mb-4">
                  Get instant answers about lender requirements, rate options, and mortgage products through our advanced AI assistant.
                </p>
                <Link to="/signup" className="text-brand-600 font-medium inline-flex items-center">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="feature-card">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Lender Management</h3>
                <p className="text-gray-600 mb-4">
                  Organize all your lender information, documents, and contacts in one centralized, searchable database.
                </p>
                <Link to="/signup" className="text-brand-600 font-medium inline-flex items-center">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="feature-card">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Search</h3>
                <p className="text-gray-600 mb-4">
                  Quickly find the perfect lender for your client's needs with our intelligent search and filtering system.
                </p>
                <Link to="/signup" className="text-brand-600 font-medium inline-flex items-center">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="feature-card">
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Storage</h3>
                <p className="text-gray-600 mb-4">
                  Store all sensitive documents with bank-level encryption and secure access controls.
                </p>
                <Link to="/signup" className="text-brand-600 font-medium inline-flex items-center">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="feature-card md:col-span-2 lg:col-span-2">
                <div className="flex items-start space-x-6">
                  <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">
                      Complete Mortgage Broker Solution
                    </h3>
                    <p className="text-gray-600 mb-4">
                      MortgagePro combines all the tools you need to manage your mortgage brokerage business efficiently:
                    </p>
                    <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                      <li className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Lender comparison tools
                      </li>
                      <li className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Document management
                      </li>
                      <li className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Rate tracking
                      </li>
                      <li className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Client management
                      </li>
                      <li className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        AI product recommendations
                      </li>
                      <li className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Compliance tools
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-heading">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose a plan that works for your business. All plans include a 14-day free trial.
              </p>
              
              <div className="flex items-center justify-center mt-8 mb-4">
                <span className={`mr-3 text-sm ${!annualBilling ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <Switch
                  id="billing-toggle"
                  checked={annualBilling}
                  onCheckedChange={setAnnualBilling}
                />
                <span className={`ml-3 text-sm ${annualBilling ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  Annual <span className="text-green-600 font-medium">Save 20%</span>
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter Plan */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <p className="text-gray-500 mb-6">For small brokerages</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${annualBilling ? '39' : '49'}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Up to 50 lender records</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Basic AI assistant (100 queries/month)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Document storage (5GB)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </li>
                </ul>
                
                <Link to="/signup?plan=starter" className="mt-auto">
                  <Button variant="outline" className="w-full">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              {/* Professional Plan */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-brand-500 p-8 flex flex-col relative">
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional</h3>
                <p className="text-gray-500 mb-6">For growing brokerages</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${annualBilling ? '79' : '99'}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited lender records</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Advanced AI assistant (500 queries/month)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Document storage (20GB)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Priority email & chat support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>API access</span>
                  </li>
                </ul>
                
                <Link to="/signup?plan=professional" className="mt-auto">
                  <Button className="w-full">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-gray-500 mb-6">For large teams</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${annualBilling ? '159' : '199'}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited everything</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Premium AI assistant (unlimited queries)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Document storage (100GB)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>SSO authentication</span>
                  </li>
                </ul>
                
                <Link to="/signup?plan=enterprise" className="mt-auto">
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-heading">
                Trusted by Mortgage Professionals
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See what other brokers say about how MortgagePro has transformed their business.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Tabs defaultValue="overview" className="col-span-3">
                <TabsList className="grid grid-cols-3 max-w-md mx-auto">
                  <TabsTrigger value="overview">Brokers</TabsTrigger>
                  <TabsTrigger value="industry">Industry</TabsTrigger>
                  <TabsTrigger value="teams">Teams</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-10">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://github.com/shadcn.png" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Sarah Johnson</div>
                          <div className="text-sm text-gray-500">Independent Broker, CA</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "The AI assistant has saved me countless hours researching lender requirements. I can find the perfect product for my clients in minutes instead of hours."
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/men/42.jpg" />
                          <AvatarFallback>RB</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Robert Bennett</div>
                          <div className="text-sm text-gray-500">Mortgage Associates, TX</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "Having all my lender information organized in one place is a game-changer. I can quickly compare options and find the best rates for my clients."
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/women/68.jpg" />
                          <AvatarFallback>MC</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Michelle Chen</div>
                          <div className="text-sm text-gray-500">First Choice Mortgages, WA</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "The document management system has eliminated my paper files. Everything is searchable and secure, which makes compliance so much easier."
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="industry">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" />
                          <AvatarFallback>TH</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Tom Harris</div>
                          <div className="text-sm text-gray-500">Mortgage Industry Journal</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "MortgagePro represents the future of mortgage brokerage - combining AI assistance with powerful lender management tools."
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/women/44.jpg" />
                          <AvatarFallback>AP</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Amanda Patterson</div>
                          <div className="text-sm text-gray-500">Lending Innovation Group</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "We've seen brokers increase productivity by 35% after adopting MortgagePro's integrated platform."
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/men/62.jpg" />
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">James Smith</div>
                          <div className="text-sm text-gray-500">Real Estate Tech Review</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "MortgagePro's AI assistant provides brokers with expert-level knowledge across hundreds of lenders and products."
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="teams">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/women/22.jpg" />
                          <AvatarFallback>VK</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Victoria Klein</div>
                          <div className="text-sm text-gray-500">Director, Metro Mortgage Team</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "Managing our team of 15 brokers is so much easier now. Everyone has access to the same up-to-date lender information and AI support."
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/men/72.jpg" />
                          <AvatarFallback>DB</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">David Brown</div>
                          <div className="text-sm text-gray-500">CEO, Premier Mortgage Group</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "We've reduced onboarding time for new brokers by 60% thanks to MortgagePro's intuitive design and comprehensive lender database."
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src="https://randomuser.me/api/portraits/women/54.jpg" />
                          <AvatarFallback>LL</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Lisa Lopez</div>
                          <div className="text-sm text-gray-500">Team Lead, Horizon Mortgages</div>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        "The enterprise features allow me to oversee our team's activities while giving them the autonomy they need to serve clients effectively."
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-heading">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about the MortgagePro platform.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    How does the AI assistant work?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    Our AI assistant is trained on comprehensive mortgage industry data, including lender criteria, product specifications, and regulatory information. It can answer questions, provide recommendations, and help you navigate complex mortgage scenarios in real-time.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    Can I import my existing lender database?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    Yes, MortgagePro provides tools to import your existing lender database via CSV or Excel files. Our support team can also assist with custom data migration for larger datasets or more complex requirements.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    Absolutely. We use bank-level encryption for all data at rest and in transit. Our platform is compliant with industry security standards, and we provide granular access controls for team environments.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    Can I cancel my subscription anytime?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    Yes, you can cancel your subscription at any time. For monthly plans, cancellation is effective at the end of the current billing cycle. For annual plans, you can continue to use the platform until the end of your paid year.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    Do you offer training and support?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    We provide comprehensive onboarding support, including tutorial videos, documentation, and live training sessions. All plans include email support, while Professional and Enterprise plans include priority support and additional training options.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    Is there a mobile app?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    Yes, MortgagePro is available as a responsive web app that works on all devices, as well as native mobile apps for iOS and Android, allowing you to access your lender database and AI assistant from anywhere.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-brand-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Mortgage Business?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-brand-100">
              Start your 14-day free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-brand-900 hover:bg-gray-100 w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="#features">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-brand-800 w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-brand-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">MB</span>
                </div>
                <span className="text-xl font-semibold text-white">MortgagePro</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Empowering mortgage brokers with AI and intelligent tools.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="#features" className="hover:text-white">Features</Link></li>
                <li><Link to="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="#" className="hover:text-white">Security</Link></li>
                <li><Link to="#" className="hover:text-white">Integrations</Link></li>
                <li><Link to="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="hover:text-white">Documentation</Link></li>
                <li><Link to="#" className="hover:text-white">Blog</Link></li>
                <li><Link to="#" className="hover:text-white">Knowledge Base</Link></li>
                <li><Link to="#" className="hover:text-white">Webinars</Link></li>
                <li><Link to="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="hover:text-white">About Us</Link></li>
                <li><Link to="#" className="hover:text-white">Careers</Link></li>
                <li><Link to="#" className="hover:text-white">Contact</Link></li>
                <li><Link to="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} MortgagePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
