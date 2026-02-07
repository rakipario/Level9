import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageSquare, Calendar, Phone, Brain, BarChart3, Workflow } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface SolutionsSectionProps {
  className?: string;
}

const solutions = [
  {
    icon: MessageSquare,
    title: 'AI Communication Agent',
    description: 'Chat, email, social DMs, WhatsApp, FAQs.',
  },
  {
    icon: Calendar,
    title: 'AI Scheduling Agent',
    description: 'Books appointments, manages calendars, sends reminders.',
  },
  {
    icon: Phone,
    title: 'AI Voice Agent',
    description: 'Answers calls, handles requests, routes customers.',
  },
  {
    icon: Brain,
    title: 'AI Knowledge Agent',
    description: 'Trained on your docs, SOPs, and internal data.',
  },
  {
    icon: BarChart3,
    title: 'AI Data & Reporting Agent',
    description: 'Collects data, generates reports, summarizes insights.',
  },
  {
    icon: Workflow,
    title: 'AI Workflow Agent',
    description: 'Triggers actions between tools (CRM, email, payments).',
  },
];

export default function SolutionsSection({ className = '' }: SolutionsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.7,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        panelRef.current,
        { y: '70vh', scale: 0.97, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0
      );
      scrollTl.fromTo(
        headlineRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.05
      );
      scrollTl.fromTo(
        cardRefs.current,
        { y: '10vh', scale: 0.98, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, stagger: 0.04, ease: 'none' },
        0.1
      );
      scrollTl.fromTo(
        previewRef.current,
        { x: '-22vw', rotateY: 10, opacity: 0 },
        { x: 0, rotateY: 0, opacity: 1, ease: 'none' },
        0
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        panelRef.current,
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0.25, ease: 'power2.in' },
        0.7
      );
      scrollTl.fromTo(
        headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '-10vw', opacity: 0.2, ease: 'power2.in' },
        0.7
      );
      scrollTl.fromTo(
        gridRef.current,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0.25, ease: 'power2.in' },
        0.7
      );
      scrollTl.fromTo(
        previewRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0.25, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="solutions"
      className={`section-pinned ${className}`}
    >
      {/* Glass Panel */}
      <div
        ref={panelRef}
        className="glass-panel absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[72vw] h-[70vh] md:h-[64vh]"
      >
        <div ref={headlineRef} className="absolute left-[5%] top-[8%] md:top-[10%]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em] mb-2">
            Our AI Automation Solutions
          </h2>
          <p className="text-sm md:text-base text-[#A7B1C6]">
            A team of AI agents that work 24/7—integrated, trainable, and scalable.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="absolute left-[5%] md:left-[52%] top-[28%] md:top-[14%] w-[90%] md:w-[43%] h-auto md:h-[72%]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {solutions.map((solution, index) => (
              <div
                key={solution.title}
                ref={(el) => { cardRefs.current[index] = el; }}
                className="glass-card p-4 md:p-5 hover:border-[#4F6DF5]/35 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#4F6DF5]/10 flex items-center justify-center mb-3 group-hover:bg-[#4F6DF5]/20 transition-colors">
                  <solution.icon className="h-5 w-5 text-[#4F6DF5]" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{solution.title}</h3>
                <p className="text-xs text-[#A7B1C6] leading-relaxed">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Card (left) */}
      <div
        ref={previewRef}
        className="hidden md:block absolute left-[6vw] top-[24vh] w-[28vw] h-[34vh] rounded-[20px] overflow-hidden border border-white/[0.08] shadow-2xl"
        style={{ perspective: '1000px' }}
      >
        <img
          src="/solutions_agent.jpg"
          alt="AI Agent Preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-[#A7B1C6]">Live Agent</span>
          </div>
          <div className="text-sm font-medium text-white">Processing 1,247 conversations</div>
        </div>
      </div>
    </section>
  );
}
