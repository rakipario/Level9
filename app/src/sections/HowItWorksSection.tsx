const steps = [
  {
    number: '01',
    title: 'Describe',
    description: 'Tell us what you want your agent to do in plain English. No technical knowledge needed.',
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Link your existing tools with one-click integrations. We support 50+ platforms.',
  },
  {
    number: '03',
    title: 'Deploy',
    description: 'Your agent goes live instantly and starts working. Monitor and refine as needed.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 border-t border-neutral-200">
      <div className="container-narrow">
        <div className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
            How it works
          </h2>
          <p className="text-neutral-500">
            Build and deploy AI agents in three simple steps.
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step) => (
            <div key={step.title} className="flex gap-8">
              <span className="text-sm text-neutral-400 font-medium w-8">
                {step.number}
              </span>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
