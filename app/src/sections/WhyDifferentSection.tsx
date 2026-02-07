import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Bot, Workflow, Brain, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WhyDifferentSectionProps {
  className?: string;
}

export default function WhyDifferentSection({ className = '' }: WhyDifferentSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        panelRef.current,
        { y: '60vh', scale: 0.96, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0
      );
      scrollTl.fromTo(
        headlineRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.08
      );
      scrollTl.fromTo(
        cardRef.current,
        { x: '22vw', rotateY: -10, opacity: 0 },
        { x: 0, rotateY: 0, opacity: 1, ease: 'none' },
        0
      );
      scrollTl.fromTo(
        miniRef.current,
        { y: '-12vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.12
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
        cardRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0.25, ease: 'power2.in' },
        0.7
      );
      scrollTl.fromTo(
        miniRef.current,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`section-pinned ${className}`}
    >
      {/* Glass Panel */}
      <div
        ref={panelRef}
        className="glass-panel absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[86vw] md:w-[62vw] h-[64vh] md:h-[56vh]"
      >
        <div ref={headlineRef} className="absolute left-[6%] top-[12%] md:top-[16%] w-[90%] md:w-[80%]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em] mb-4">
            Not Just Chatbots.{' '}
            <span className="text-[#4F6DF5]">Not Just Automation.</span>
          </h2>
          <p className="text-base md:text-lg text-[#A7B1C6] mb-6 max-w-[90%] md:max-w-[70%]">
            Most tools automate one thing. We automate entire workflows using AI that understands context, makes decisions, and takes action.
          </p>

          {/* Comparison */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Bot className="h-5 w-5 text-[#A7B1C6]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#A7B1C6]">Chatbots</div>
                <div className="text-xs text-[#A7B1C6]/70">Single channel, scripted</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Workflow className="h-5 w-5 text-[#A7B1C6]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#A7B1C6]">Automation</div>
                <div className="text-xs text-[#A7B1C6]/70">Rule-based, rigid</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#4F6DF5]/10 border border-[#4F6DF5]/30">
              <div className="w-10 h-10 rounded-xl bg-[#4F6DF5]/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-[#4F6DF5]" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">NeuralFlow AI</div>
                <div className="text-xs text-[#7C9CFF]">Context-aware, adaptive</div>
              </div>
            </div>
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-[#4F6DF5] hover:text-[#7C9CFF] transition-colors group"
          >
            See how it's built
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Workflow Card (right) */}
      <div
        ref={cardRef}
        className="hidden md:block absolute right-[6vw] top-[22vh] w-[30vw] h-[36vh] rounded-[20px] overflow-hidden border border-white/[0.08] shadow-2xl"
        style={{ perspective: '1000px' }}
      >
        <img
          src="/workflow_nodes.jpg"
          alt="Workflow Automation"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-[#A7B1C6] mb-1">Workflow Automation</div>
          <div className="text-sm font-medium text-white">Visual node-based builder</div>
        </div>
      </div>

      {/* Mini Card (top-right) */}
      <div
        ref={miniRef}
        className="hidden lg:block absolute right-[10vw] top-[12vh] w-[14vw] h-[10vh] rounded-[14px] glass-card flex items-center justify-center gap-3 px-4"
      >
        <div className="w-8 h-8 rounded-lg bg-[#4F6DF5]/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#4F6DF5]" />
        </div>
        <div>
          <div className="text-xs text-[#A7B1C6]">AI Model</div>
          <div className="text-sm font-semibold text-white">GPT-4 + Custom</div>
        </div>
      </div>
    </section>
  );
}
