const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individuals and small projects',
    features: [
      '1 agent',
      '100 conversations/month',
      'Basic integrations',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professionals and growing teams',
    features: [
      '5 agents',
      'Unlimited conversations',
      'All integrations',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    price: '$79',
    period: '/month',
    description: 'For teams that need collaboration',
    features: [
      '20 agents',
      'Unlimited conversations',
      'Team collaboration',
      'SSO & SAML',
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 border-t border-neutral-200">
      <div className="container-narrow">
        <div className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
            Pricing
          </h2>
          <p className="text-neutral-500">
            Simple, transparent pricing. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-base font-medium text-neutral-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-semibold text-neutral-900">
                  {plan.price}
                </span>
                <span className="text-sm text-neutral-400">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm text-neutral-600">
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="btn-primary w-full">
                Get started
              </button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-neutral-400 text-center">
          Need more? <a href="#" className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2">Contact us</a> for Enterprise.
        </p>
      </div>
    </section>
  );
}
