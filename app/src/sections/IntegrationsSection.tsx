const integrations = [
  'Slack',
  'Gmail',
  'Notion',
  'Shopify',
  'HubSpot',
  'Salesforce',
  'Zapier',
  'Stripe',
  'Airtable',
  'Calendar',
  'Outlook',
  'Discord',
];

export default function IntegrationsSection() {
  return (
    <section className="py-32 border-t border-neutral-200">
      <div className="container-narrow">
        <div className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
            Integrations
          </h2>
          <p className="text-neutral-500">
            Works with your existing tools.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration}
              className="py-3 px-4 rounded-md border border-neutral-200 text-sm text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-colors cursor-default"
            >
              {integration}
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-neutral-400">
          And 40+ more. <a href="#" className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2">View all</a>
        </p>
      </div>
    </section>
  );
}
