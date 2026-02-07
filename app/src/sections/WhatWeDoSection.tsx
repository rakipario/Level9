import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WhatWeDoSectionProps {
  className?: string;
}

export default function WhatWeDoSection({ className = '' }: WhatWeDoSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
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
        headlineRef.current?.querySelectorAll('.word') || [],
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, ease: 'none' },
        0.05
      );
      scrollTl.fromTo(
        bodyRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.1
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
        0.1
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
        bodyRef.current,
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0.25, ease: 'power2.in' },
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
        <h2
          ref={headlineRef}
          className="absolute left-[6%] top-[14%] md:top-[18%] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-semibold text-white leading-[1.1] tracking-[-0.02em] w-[90%] md:w-[70%]"
        >
          <span className="word inline-block">We</span>{' '}
          <span className="word inline-block">Don't</span>{' '}
          <span className="word inline-block">Sell</span>{' '}
          <span className="word inline-block">Tools.</span>{' '}
          <span className="word inline-block">We</span>{' '}
          <span className="word inline-block">Build</span>{' '}
          <span className="word inline-block text-[#4F6DF5]">AI</span>{' '}
          <span className="word inline-block text-[#4F6DF5]">Systems</span>{' '}
          <span className="word inline-block">for</span>{' '}
          <span className="word inline-block">Your</span>{' '}
          <span className="word inline-block">Business.</span>
        </h2>

        <div ref={bodyRef} className="absolute left-[6%] top-[48%] md:top-[44%] w-[90%] md:w-[46%]">
          <p className="text-base md:text-lg text-[#A7B1C6] leading-relaxed mb-6">
            We analyze your processes, identify bottlenecks, and deploy AI agents that take over repetitive tasks—across departments.
          </p>
          <a
            href="#solutions"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4F6DF5] hover:text-[#7C9CFF] transition-colors group"
          >
            Explore Solutions
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Feature Card (right) */}
      <div
        ref={cardRef}
        className="hidden md:block absolute right-[6vw] top-[22vh] w-[30vw] h-[36vh] rounded-[20px] overflow-hidden border border-white/[0.08] shadow-2xl"
        style={{ perspective: '1000px' }}
      >
        <img
          src="/solutions_agent.jpg"
          alt="AI Communication Agent"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-[#A7B1C6] mb-1">AI Communication Agent</div>
          <div className="text-sm font-medium text-white">Handles multi-channel support</div>
        </div>
      </div>

      {/* Mini Card (top-left) */}
      <div
        ref={miniRef}
        className="hidden lg:block absolute left-[10vw] top-[12vh] w-[14vw] h-[10vh] rounded-[14px] glass-card flex items-center justify-center gap-3 px-4"
      >
        <div className="w-8 h-8 rounded-lg bg-[#4F6DF5]/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#4F6DF5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-xs text-[#A7B1C6]">Processes Mapped</div>
          <div className="text-sm font-semibold text-white">1,200+</div>
        </div>
      </div>
    </section>
  );
}
