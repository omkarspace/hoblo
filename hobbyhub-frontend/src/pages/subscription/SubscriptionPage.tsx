import React, { useState, useEffect } from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  _id: string;
  name: string;
  tier: string;
  description: string;
  price: {
    monthly: { amount: number };
    yearly: { amount: number };
  };
  features: Array<{
    name: string;
    description?: string;
    included: boolean;
    limit?: number;
    unit?: string;
  }>;
  popular: boolean;
}

const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // TODO: Fetch subscription plans from API
    // For now, using static data based on backend seed
    const mockPlans: SubscriptionPlan[] = [
      {
        _id: '1',
        name: 'Free',
        tier: 'free',
        description: 'Perfect for getting started with HobbyHub',
        price: { monthly: { amount: 0 }, yearly: { amount: 0 } },
        features: [
          { name: 'Create up to 10 posts', included: true, limit: 10, unit: 'posts' },
          { name: 'Join up to 5 groups', included: true, limit: 5, unit: 'groups' },
          { name: 'Basic community features', included: true },
          { name: 'Access to free content', included: true }
        ],
        popular: false
      },
      {
        _id: '2',
        name: 'Basic',
        tier: 'basic',
        description: 'Great for active hobby enthusiasts',
        price: { monthly: { amount: 9.99 }, yearly: { amount: 99.99 } },
        features: [
          { name: 'Create unlimited posts', included: true },
          { name: 'Join unlimited groups', included: true },
          { name: '5GB cloud storage', included: true, limit: 5, unit: 'GB' },
          { name: 'Premium content access', included: true },
          { name: 'Priority support', included: true },
          { name: 'Advanced search filters', included: true }
        ],
        popular: true
      },
      {
        _id: '3',
        name: 'Standard',
        tier: 'standard',
        description: 'Ideal for creators and community leaders',
        price: { monthly: { amount: 19.99 }, yearly: { amount: 199.99 } },
        features: [
          { name: 'All Basic features', included: true },
          { name: '15GB cloud storage', included: true, limit: 15, unit: 'GB' },
          { name: 'Live event participation', included: true },
          { name: 'Creator tools', included: true },
          { name: 'Custom group branding', included: true },
          { name: 'Monetization features', included: true },
          { name: 'Advanced analytics', included: true }
        ],
        popular: false
      },
      {
        _id: '4',
        name: 'Premium',
        tier: 'premium',
        description: 'The ultimate hobby experience',
        price: { monthly: { amount: 39.99 }, yearly: { amount: 399.99 } },
        features: [
          { name: 'All Standard features', included: true },
          { name: 'Unlimited cloud storage', included: true },
          { name: 'Host unlimited live events', included: true },
          { name: 'Advanced creator dashboard', included: true },
          { name: 'Priority creator support', included: true },
          { name: 'Custom integrations', included: true },
          { name: 'White-label options', included: true },
          { name: 'Dedicated account manager', included: true }
        ],
        popular: false
      }
    ];
    setPlans(mockPlans);
  }, []);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setIsLoading(true);
    try {
      // TODO: Integrate with Stripe payment processing
      console.log('Selected plan:', plan.name, 'Billing:', billingCycle);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        alert(`Selected ${plan.name} plan with ${billingCycle} billing. Payment integration coming soon!`);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      alert('Failed to process subscription. Please try again.');
    }
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (plan.price.monthly.amount === 0) return 0;
    const monthlyTotal = plan.price.monthly.amount * 12;
    const yearlyPrice = plan.price.yearly.amount;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your HobbyHub Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock the full potential of your hobby community experience
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save up to 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold">
                    ${plan.price[billingCycle].amount}
                    <span className="text-lg font-normal text-gray-500">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      Save {getSavings(plan)}% annually
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {feature.name}
                        {feature.limit && feature.unit && (
                          <span className="font-medium">
                            {' '}({feature.limit} {feature.unit})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full ${plan.tier === 'free' ? 'variant-outline' : ''}`}
                  variant={plan.tier === 'free' ? 'outline' : 'default'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                >
                  {plan.tier === 'free' ? (
                    'Get Started Free'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {billingCycle === 'monthly' ? 'Subscribe Monthly' : 'Subscribe Yearly'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-2">What happens to my content if I downgrade?</h3>
              <p className="text-gray-600">Your content remains safe. You may lose access to premium features, but nothing is deleted.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
