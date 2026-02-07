import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Headphones, TrendingUp, Settings, Users, Megaphone, FileText } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WhereAIWorksSectionProps {
  className?: string;
}

const departments = [
  { icon: Headphones, name: 'Customer Support' },
  { icon: TrendingUp, name: 'Sales' },
  { icon: Settings, name: 'Operations' },
  { icon: Users, name: 'HR' },
  { icon: Megaphone, name: 'Marketing' },
  { icon: FileText, name: 'Administration' },
];

export default function WhereAIWorksSection({ className = '' }: WhereAIWorksSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
        listRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.12
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
        listRef.current,
        { opacity: 1 },
        { opacity: 0.2, ease: 'power2.in' },
        0.75
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
        <div ref={headlineRef} className="absolute left-[6%] top-[12%] md:top-[16%]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em] mb-3">
            Where AI Works in Your Business
          </h2>
          <p className="text-sm md:text-base text-[#A7B1C6] w-[90%] md:w-[80%]">
            If a task follows rules, AI can do it. We map agents to the departments that need them most.
          </p>
        </div>

        <div ref={listRef} className="absolute left-[6%] top-[44%] md:top-[40%] w-[90%] md:w-[44%]">
          <div className="grid grid-cols-2 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.name}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#4F6DF5]/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#4F6DF5]/10 flex items-center justify-center flex-shrink-0">
                  <dept.icon className="h-4 w-4 text-[#4F6DF5]" />
                </div>
                <span className="text-sm text-white">{dept.name}</span>
              </div>
            ))}
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-[#4F6DF5] hover:text-[#7C9CFF] transition-colors group"
          >
            See department playbooks
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Department Card (right) */}
      <div
        ref={cardRef}
        className="hidden md:block absolute right-[6vw] top-[22vh] w-[30vw] h-[36vh] rounded-[20px] overflow-hidden border border-white/[0.08] shadow-2xl"
        style={{ perspective: '1000px' }}
      >
        <img
          src="/department_queue.jpg"
          alt="Department Queue"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-[#A7B1C6] mb-1">Customer Support Queue</div>
          <div className="text-sm font-medium text-white">AI handling 89% of tickets</div>
        </div>
      </div>

      {/* Mini Card (top-right) */}
      <div
        ref={miniRef}
        className="hidden lg:block absolute right-[10vw] top-[12vh] w-[14vw] h-[10vh] rounded-[14px] glass-card flex items-center justify-center gap-3 px-4"
      >
        <div className="w-8 h-8 rounded-lg bg-[#4F6DF5]/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-[#4F6DF5]" />
        </div>
        <div>
          <div className="text-xs text-[#A7B1C6]">Departments</div>
          <div className="text-sm font-semibold text-white">6 Covered</div>
        </div>
      </div>
    </section>
  );
}
