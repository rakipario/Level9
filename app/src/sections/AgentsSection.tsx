const agents = [
  {
    name: 'Customer Support',
    description: 'Handles inquiries, refunds, and FAQs across all channels.',
  },
  {
    name: 'Sales Assistant',
    description: 'Qualifies leads, schedules demos, and follows up automatically.',
  },
  {
    name: 'Email Manager',
    description: 'Drafts replies, organizes your inbox, and prioritizes messages.',
  },
  {
    name: 'Meeting Scheduler',
    description: 'Books appointments, sends reminders, and handles rescheduling.',
  },
  {
    name: 'Data Entry',
    description: 'Extracts data from documents and fills forms automatically.',
  },
  {
    name: 'Social Media',
    description: 'Responds to comments, DMs, and mentions across platforms.',
  },
];

export default function AgentsSection() {
  return (
    <section id="agents" className="py-32 border-t border-neutral-200">
      <div className="container-narrow">
        <div className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
            Agent templates
          </h2>
          <p className="text-neutral-500">
            Start with a pre-built template or create your own.
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="py-6 flex items-start justify-between gap-4 group cursor-pointer"
            >
              <div>
                <h3 className="text-base font-medium text-neutral-900 mb-1 group-hover:text-neutral-600 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {agent.description}
                </p>
              </div>
              <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">
                →
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
