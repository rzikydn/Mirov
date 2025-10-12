import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Start building your workspace today with Mirov
        </h2>
        <p className="text-xl text-blue-50 mb-10 max-w-2xl mx-auto">
          It's fast, simple, and built for collaboration. Join thousands of teams already using Mirov.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="group px-10 py-5 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-xl hover:shadow-2xl hover:scale-105 flex items-center space-x-2 text-lg">
            <span>Join Free Today</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="text-blue-100 text-sm mt-8">
          No credit card required • Free forever for small teams
        </p>
      </div>
    </section>
  );
}
