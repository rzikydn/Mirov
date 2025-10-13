import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen pt-40 pb-48 px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb08_1px,transparent_1px),linear-gradient(to_bottom,#2563eb08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/10 rounded-3xl blur-3xl" />

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className={`inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-10 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">
            Introducing Mirov — Your Unified Workspace
          </span>
        </div>

        {/* Hero Heading */}
        <h1 className={`relative text-5xl md:text-7xl font-extrabold mb-8 leading-snug transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
          {/* Expanded Background Gradient Behind Text */}
          <span className="absolute inset-0 -z-10 flex justify-center items-center">
            {/* Layer 1 */}
            <div className="absolute w-[120%] h-[120%] bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 opacity-30 rounded-3xl blur-3xl" />
            {/* Layer 2 */}
            <div className="absolute w-[100%] h-[100%] bg-gradient-to-tr from-blue-500 via-blue-400/60 to-cyan-500/40 opacity-20 rounded-3xl blur-2xl" />
            {/* Layer 3 */}
            <div className="absolute w-[140%] h-[140%] bg-gradient-to-bl from-blue-300/40 via-cyan-300/20 to-blue-400/30 opacity-15 rounded-3xl blur-3xl" />
          </span>

          <span className="relative bbh-sans-bogle-regular">Plan Build Achieve</span>
          <span className="relative text-blue-600 playwrite-de-sas-light"> Together</span>
        </h1>

        {/* Subtext */}
        <p className={`text-lg md:text-xl text-gray-600 mb-16 leading-relaxed max-w-3xl mx-auto transition-all duration-700 delay-400 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          Mirov empowers your team to turn ideas into reality seamlessly — all in one connected workspace.
        </p>

        {/* Buttons */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-600 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button className="group px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2">
            <span>Start for Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold border-2 border-gray-200 hover:border-gray-300 flex items-center space-x-2">
            <span>Explore Features</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}