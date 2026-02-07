import { useState } from 'react';
import { ArrowUp } from 'lucide-react';

const suggestions = [
  'Customer support agent',
  'Email assistant',
  'Meeting scheduler',
  'Lead qualifier',
];

export default function HeroSection() {
  const [input, setInput] = useState('');

  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-14 pb-20">
      <div className="container-narrow">
        <div className="text-center">
          {/* Label */}
          <p className="text-sm text-neutral-500 mb-6">
            AI Agent Builder
          </p>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 mb-4 text-balance">
            Build agents that work for you
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-neutral-500 mb-10 text-balance">
            Create, train, and deploy AI agents in minutes. No code required.
          </p>

          {/* Input */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want your agent to do?"
                className="w-full min-h-[120px] rounded-lg border border-neutral-200 bg-white p-4 pr-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none resize-none transition-colors"
                rows={3}
              />
              <button className="absolute bottom-3 right-3 p-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(`Build a ${suggestion} that `)}
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
