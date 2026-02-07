import { 
  MessageSquare, 
  TrendingUp, 
  Mail, 
  Calendar, 
  Database, 
  Share2,
  ArrowRight
} from 'lucide-react';

const agents = [
  {
    icon: MessageSquare,
    name: 'Customer Support',
    description: 'Handles inquiries, refunds, FAQs across all channels',
    features: ['Multi-channel', 'Auto-escalation', 'Knowledge base'],
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: TrendingUp,
    name: 'Sales Assistant',
    description: 'Qualifies leads, schedules demos, follows up',
    features: ['Lead scoring', 'CRM sync', 'Meeting booking'],
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Mail,
    name: 'Email Manager',
    description: 'Drafts replies, organizes inbox, prioritizes',
    features: ['Smart drafts', 'Inbox zero', 'Priority sorting'],
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Calendar,
    name: 'Meeting Scheduler',
    description: 'Books appointments, sends reminders, reschedules',
    features: ['Calendar sync', 'Timezone aware', 'Reminders'],
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Database,
    name: 'Data Entry',
    description: 'Extracts data, fills forms, updates records',
    features: ['OCR capable', 'Form filling', 'Validation'],
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Share2,
    name: 'Social Media',
    description: 'Responds to comments, DMs, mentions',
    features: ['Multi-platform', 'Sentiment analysis', 'Auto-reply'],
    color: 'bg-cyan-100 text-cyan-600',
  },
];

export default function AgentTemplatesSection() {
  return (
    <section id="templates" className="section">
      <div className="container-main">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            Start with a template
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose from pre-built agent templates or create your own from scratch.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div
              key={agent.name}
              className="animate-on-scroll group cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="card card-hover h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${agent.color}`}>
                    <agent.icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {agent.name}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  {agent.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {agent.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button className="btn-secondary">
            View all templates
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
