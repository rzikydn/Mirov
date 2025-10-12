import { Slack, Github, Trello } from 'lucide-react';

const integrations = [
  {
    name: 'Slack',
    icon: Slack,
    description: 'Get notifications and updates',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Google Drive',
    description: 'Sync files and documents',
    color: 'from-blue-500 to-green-500',
    customIcon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.71 3.5L1.15 15l3.43 6.46L11.15 9.5 7.71 3.5M19.73 7.5l-6.56-4-3.43 6 6.56 4 3.43-6M8.14 16.25l-3.43 6h13.13l3.43-6H8.14z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    icon: Github,
    description: 'Link issues and PRs',
    color: 'from-gray-700 to-gray-900',
  },
  {
    name: 'Trello',
    icon: Trello,
    description: 'Import boards and cards',
    color: 'from-blue-600 to-blue-700',
  },
];

export default function Integrations() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-50 rounded-full mb-4">
            <span className="text-sm font-semibold text-blue-600">INTEGRATIONS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Connect your favorite tools
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mirov works seamlessly with the tools you already use every day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {integration.customIcon ? (
                  <div className="text-white">{integration.customIcon}</div>
                ) : integration.icon ? (
                  <integration.icon className="w-8 h-8 text-white" />
                ) : null}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{integration.name}</h3>
              <p className="text-gray-600 text-sm">{integration.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">And many more integrations coming soon</p>
          <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            View all integrations →
          </button>
        </div>
      </div>
    </section>
  );
}
