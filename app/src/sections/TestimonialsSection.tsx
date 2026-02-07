import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "Relay transformed our customer support. We went from 48-hour response times to instant replies. Our team can now focus on complex issues while the AI handles routine inquiries.",
    author: 'Sarah Chen',
    role: 'Head of Support',
    company: 'Notion',
    avatar: 'SC',
  },
  {
    quote: "I built a lead qualification agent in 10 minutes. It integrates with our CRM and schedules meetings automatically. Best investment we've made this year.",
    author: 'Marcus Johnson',
    role: 'Sales Director',
    company: 'Stripe',
    avatar: 'MJ',
  },
  {
    quote: "As a solo founder, Relay is like having a team of assistants. My email agent alone saves me 5 hours every week. Absolutely game-changing.",
    author: 'Emily Rodriguez',
    role: 'Founder',
    company: 'Lumen Labs',
    avatar: 'ER',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="section">
      <div className="container-main">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            Loved by teams everywhere
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See how teams are using Relay to automate their work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="animate-on-scroll"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="card h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-amber-400"
                      fill="currentColor"
                    />
                  ))}
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-6 flex-grow">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-slate-500">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
