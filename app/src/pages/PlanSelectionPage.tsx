import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Sparkles, Users, Bot } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceLabel: 'Free forever',
    icon: Bot,
    features: [
      '2 AI agents',
      '100 messages/month',
      'Basic integrations',
      'Community support',
      'Standard analytics'
    ],
    cta: 'Get started free',
    highlighted: false
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users',
    price: 29,
    priceLabel: 'per month',
    icon: Sparkles,
    features: [
      '10 AI agents',
      'Unlimited messages',
      'Advanced integrations',
      'Priority support',
      'Advanced analytics',
      'Custom agent training',
      'API access'
    ],
    cta: 'Start Pro trial',
    highlighted: true
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For growing teams',
    price: 79,
    priceLabel: 'per month',
    icon: Users,
    features: [
      'Unlimited AI agents',
      'Unlimited messages',
      'All integrations',
      '24/7 dedicated support',
      'Team analytics',
      'Custom agent training',
      'API access',
      'SSO & advanced security',
      'Team collaboration'
    ],
    cta: 'Start Team trial',
    highlighted: false
  }
];

export default function PlanSelectionPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    try {
      const response = await fetch(`${API_URL}/user/select-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planType: planId })
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const data = await response.json();
        console.error('Plan selection failed:', data.error);
      }
    } catch (error) {
      console.error('Plan selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-subtle)] to-white pointer-events-none" />

      <header className="p-6 relative">
        <div className="container-wide flex items-center justify-between">
          <Link to="/" className="text-[16px] font-medium tracking-tight">
            Relay
          </Link>
          <div className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Step 2 of 2
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-6 relative">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-[32px] font-medium text-[var(--text)] mb-3 tracking-tight">
              Choose your plan
            </h1>
            <p className="text-[16px] text-[var(--text-secondary)] max-w-[500px] mx-auto">
              Select the plan that works best for you. You can always upgrade or downgrade later.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-[32px] p-8 transition-all duration-300 ${plan.highlighted
                      ? 'bg-[var(--text)] text-white scale-[1.02] shadow-xl'
                      : 'bg-white border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-lg'
                    } ${isSelected && loading ? 'opacity-70' : ''}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-[var(--accent)] text-white text-[12px] font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${plan.highlighted ? 'bg-white/10' : 'bg-[var(--bg-subtle)]'
                      }`}>
                      <Icon className={`h-6 w-6 ${plan.highlighted ? 'text-white' : 'text-[var(--accent)]'}`} />
                    </div>
                    <h3 className="text-[20px] font-medium mb-1">{plan.name}</h3>
                    <p className={`text-[14px] ${plan.highlighted ? 'text-white/70' : 'text-[var(--text-secondary)]'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[36px] font-medium">
                        ${plan.price}
                      </span>
                      <span className={`text-[14px] ${plan.highlighted ? 'text-white/70' : 'text-[var(--text-secondary)]'}`}>
                        {plan.priceLabel}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-[14px]">
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-[var(--accent)]' : 'text-green-500'
                          }`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading && isSelected}
                    className={`w-full py-4 rounded-full text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2 ${plan.highlighted
                        ? 'bg-white text-[var(--text)] hover:bg-[var(--bg-subtle)]'
                        : 'bg-[var(--text)] text-white hover:bg-[var(--text-secondary)]'
                      } disabled:opacity-50`}
                  >
                    {loading && isSelected ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-[14px] text-[var(--text-tertiary)] relative">
        <div className="flex items-center justify-center gap-6">
          <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
