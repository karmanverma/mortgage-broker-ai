import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Heart,
  Users,
  Home,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Crown,
  Linkedin,
  Facebook,
  MessageSquare,
  Calendar,
  Award,
  Briefcase,
  CreditCard,
  PieChart,
  BarChart3,
  Target,
  Clock
} from 'lucide-react';
import TodosWidget from '@/components/todos/TodosWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type Client = Tables<'clients'>;
type Person = Tables<'people'> & { 
  is_primary?: boolean; 
  relationship_type?: string;
};

interface OverviewTabProps {
  client: Client;
  primaryPerson?: Person;
  allPeople: Person[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  client, 
  primaryPerson, 
  allPeople 
}) => {
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});

  const togglePanel = (panelId: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getCreditScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDebtToIncomeColor = (ratio: number | null) => {
    if (!ratio) return 'text-gray-500';
    if (ratio <= 28) return 'text-green-600';
    if (ratio <= 36) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isCommercial = client.client_type === 'commercial' || client.client_type === 'investor';
  const spouse = allPeople.find(p => p.relationship_type === 'spouse');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column - 60% width (3/5) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* A. Contact Information Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanel('contact')}
              >
                {expandedPanels.contact ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Primary Person Details */}
            {primaryPerson && (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt={`${primaryPerson.first_name} ${primaryPerson.last_name}`} />
                    <AvatarFallback className="text-lg">
                      {getInitials(primaryPerson.first_name, primaryPerson.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">
                        {primaryPerson.first_name} {primaryPerson.last_name}
                      </h3>
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <Badge variant="secondary">Primary Contact</Badge>
                    </div>
                    {primaryPerson.title_position && (
                      <p className="text-muted-foreground mb-2">{primaryPerson.title_position}</p>
                    )}
                    {primaryPerson.company_name && (
                      <p className="text-sm text-muted-foreground mb-3">
                        <Building2 className="h-3 w-3 inline mr-1" />
                        {primaryPerson.company_name}
                      </p>
                    )}
                    
                    {/* Contact Methods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {primaryPerson.phone_primary && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${primaryPerson.phone_primary}`} className="text-blue-600 hover:underline">
                            {primaryPerson.phone_primary}
                          </a>
                        </div>
                      )}
                      {primaryPerson.email_primary && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${primaryPerson.email_primary}`} className="text-blue-600 hover:underline">
                            {primaryPerson.email_primary}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {expandedPanels.contact && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Full Address */}
                    {(primaryPerson.address_street || primaryPerson.address_city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm">
                            {[
                              primaryPerson.address_street,
                              primaryPerson.address_city,
                              primaryPerson.address_state,
                              primaryPerson.address_zip
                            ].filter(Boolean).join(', ')}
                          </p>
                          <Button variant="link" size="sm" className="p-0 h-auto text-blue-600">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on Google Maps
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Communication Preference */}
                    {primaryPerson.preferred_communication_method && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Prefers: {primaryPerson.preferred_communication_method}
                        </span>
                      </div>
                    )}

                    {/* Social Media */}
                    <div className="flex gap-2">
                      {primaryPerson.social_linkedin && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={primaryPerson.social_linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4 mr-1" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                      {primaryPerson.social_facebook && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={primaryPerson.social_facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-1" />
                            Facebook
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Residential Client Additions */}
                    {!isCommercial && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {client.marital_status && (
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{client.marital_status}</span>
                            {spouse && (
                              <span className="text-sm text-muted-foreground">
                                ({spouse.first_name} {spouse.last_name})
                              </span>
                            )}
                          </div>
                        )}
                        {client.dependents_count !== null && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{client.dependents_count} dependents</span>
                          </div>
                        )}
                        {client.housing_situation && (
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{client.housing_situation.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Commercial Client Additions */}
                    {isCommercial && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {client.business_dba && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">DBA: {client.business_dba}</span>
                          </div>
                        )}
                        {client.industry_classification && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{client.industry_classification}</span>
                          </div>
                        )}
                        {client.business_license_number && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">License: {client.business_license_number}</span>
                          </div>
                        )}
                        {client.tax_id_ein && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">EIN: {client.tax_id_ein}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* B. Financial Overview Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanel('financial')}
              >
                {expandedPanels.financial ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isCommercial ? (
              /* Residential Client Display */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Credit Score */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getCreditScoreColor(client.credit_score)}`}>
                      {client.credit_score || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Credit Score</p>
                  </div>
                  
                  {/* Annual Income */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(client.annual_income)}
                    </div>
                    <p className="text-sm text-muted-foreground">Annual Income</p>
                  </div>
                  
                  {/* Debt-to-Income Ratio */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getDebtToIncomeColor(client.debt_to_income_ratio)}`}>
                      {client.debt_to_income_ratio ? `${client.debt_to_income_ratio}%` : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Debt-to-Income</p>
                  </div>
                </div>

                {expandedPanels.financial && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.employment_status && (
                        <div>
                          <p className="text-sm text-muted-foreground">Employment Status</p>
                          <p className="font-medium capitalize">{client.employment_status.replace('_', ' ')}</p>
                        </div>
                      )}
                      {client.employer_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Employer</p>
                          <p className="font-medium">{client.employer_name}</p>
                        </div>
                      )}
                      {client.job_title && (
                        <div>
                          <p className="text-sm text-muted-foreground">Job Title</p>
                          <p className="font-medium">{client.job_title}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {client.first_time_buyer && (
                        <Badge variant="secondary">
                          <Home className="h-3 w-3 mr-1" />
                          First-Time Buyer
                        </Badge>
                      )}
                      {client.veteran_status && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Veteran
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Commercial Client Display */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Business Credit Score */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getCreditScoreColor(client.business_credit_score)}`}>
                      {client.business_credit_score || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Business Credit</p>
                  </div>
                  
                  {/* Annual Revenue */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(client.annual_revenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">Annual Revenue</p>
                  </div>
                  
                  {/* DSCR */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {client.debt_service_coverage_ratio ? `${client.debt_service_coverage_ratio}x` : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">DSCR</p>
                  </div>
                </div>

                {expandedPanels.financial && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.business_net_worth && (
                        <div>
                          <p className="text-sm text-muted-foreground">Business Net Worth</p>
                          <p className="font-medium">{formatCurrency(client.business_net_worth)}</p>
                        </div>
                      )}
                      {client.years_in_business && (
                        <div>
                          <p className="text-sm text-muted-foreground">Years in Business</p>
                          <p className="font-medium">{client.years_in_business} years</p>
                        </div>
                      )}
                      {client.business_type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Business Type</p>
                          <p className="font-medium capitalize">{client.business_type.replace('_', ' ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* C. Preferences & Profile Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Preferences & Profile
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanel('preferences')}
              >
                {expandedPanels.preferences ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Coming Soon Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Loan Officer</p>
                  <p className="text-sm text-gray-500 italic">Coming Soon</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Profile</p>
                  <p className="text-sm text-gray-500 italic">Coming Soon</p>
                </div>
              </div>

              {/* Available Data */}
              {client.client_acquisition_source && (
                <div>
                  <p className="text-sm text-muted-foreground">Acquisition Source</p>
                  <p className="font-medium">{client.client_acquisition_source}</p>
                </div>
              )}
              
              {client.referral_source && (
                <div>
                  <p className="text-sm text-muted-foreground">Referral Source</p>
                  <p className="font-medium">{client.referral_source}</p>
                </div>
              )}

              {expandedPanels.preferences && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Communication Timezone</p>
                    <p className="text-sm text-gray-500 italic">Coming Soon</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Lender Types</p>
                    <p className="text-sm text-gray-500 italic">Coming Soon</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - 40% width (2/5) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* A. Quick Stats Dashboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">Coming Soon</div>
                <p className="text-sm text-muted-foreground">Client Metrics</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>• Lifetime Value</div>
                <div>• Total Loans</div>
                <div>• Average Loan Size</div>
                <div>• Satisfaction Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Last Contact</div>
                <div className="font-medium">
                  {formatDate(client.last_contact_date)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* B. To-dos Panel */}
        <TodosWidget 
          entityType="client" 
          entityId={client.id} 
          showHeader={true}
          maxItems={6}
        />

        {/* C. Active Opportunities Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <div className="text-lg font-semibold text-muted-foreground">Coming Soon</div>
                <p className="text-sm text-muted-foreground">Pipeline & Opportunities</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                <div>• Current Applications</div>
                <div>• Hot Prospects</div>
                <div>• Renewal Dates</div>
                <div>• Cross-sell Opportunities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};