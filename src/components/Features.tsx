import { Users, FileText, LayoutGrid, Link2 } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Collaborative Pages',
    description: 'Work together in real-time with your team. See changes instantly and collaborate seamlessly.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: 'Smart Notes',
    description: 'Organize ideas effortlessly with rich formatting, nested pages, and powerful search.',
    gradient: 'from-blue-600 to-blue-500',
  },
  {
    icon: LayoutGrid,
    title: 'Visual Boards',
    description: 'Track tasks visually with kanban boards, calendars, and customizable views.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Link2,
    title: 'Knowledge Sync',
    description: 'Link everything together. Create connections between notes, tasks, and projects.',
    gradient: 'from-cyan-500 to-blue-500',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-50 rounded-full mb-4">
            <span className="text-sm font-semibold text-blue-600">FEATURES</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bbh-sans-hegarty-regular">
            Everything you need to collaborate
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help your team work better together
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
