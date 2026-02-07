import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'What is Relay?',
    answer: 'Relay is a platform that lets you build AI agents without writing code. You describe what you want your agent to do, connect your tools, and deploy it in minutes.',
  },
  {
    question: 'Do I need to know how to code?',
    answer: 'No. Relay is designed for non-technical users. You can build and deploy agents using natural language descriptions.',
  },
  {
    question: 'What integrations are supported?',
    answer: 'We support 50+ integrations including Slack, Gmail, Notion, Shopify, HubSpot, Salesforce, Zapier, Stripe, and more.',
  },
  {
    question: 'How long does it take to deploy an agent?',
    answer: 'Most agents can be deployed in under 5 minutes. The setup process is designed to be fast and intuitive.',
  },
  {
    question: 'Can I customize my agent?',
    answer: 'Yes. You can train your agent on your own data, customize its responses, and set up specific workflows.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. We use enterprise-grade security with end-to-end encryption, SOC 2 compliance, and strict data privacy controls.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 border-t border-neutral-200">
      <div className="container-narrow">
        <div className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
            FAQ
          </h2>
          <p className="text-neutral-500">
            Common questions answered.
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {faqs.map((faq, index) => (
            <div key={index} className="py-5">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <span className="text-base font-medium text-neutral-900">
                  {faq.question}
                </span>
                <span className="text-neutral-400 mt-0.5">
                  {openIndex === index ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </span>
              </button>
              {openIndex === index && (
                <p className="mt-3 text-neutral-500 leading-relaxed pr-8">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
