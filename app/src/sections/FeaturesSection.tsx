import { 
  MessageCircle, 
  Layers, 
  Brain, 
  UserCheck, 
  BarChart3, 
  Shield 
} from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: 'Natural Language Setup',
    description: 'Just describe what you want in plain English. No technical knowledge required.',
  },
  {
    icon: Layers,
    title: 'Multi-Channel',
    description: 'Deploy agents across email, chat, voice, and social media from one platform.',
  },
  {
    icon: Brain,
    title: 'Self-Learning',
    description: 'Your agents get smarter with every interaction, improving responses over time.',
  },
  {
    icon: UserCheck,
    title: 'Human Handoff',
    description: 'Seamlessly escalate complex issues to human team members when needed.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track performance, response times, and customer satisfaction in real-time.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption and data privacy controls.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="section">
      <div className="container-main">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            Everything you need
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful features to build, deploy, and manage AI agents at any scale.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-on-scroll"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
