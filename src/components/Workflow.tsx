import { PenLine, CheckSquare, Users2, TrendingUp } from 'lucide-react';
import NoteIcon from '../assets/Note1.svg';
import CollaborateIcon from '../assets/Collaborate1.svg'
import TaskIcon from '../assets/Task1.svg'
import ProgressIcon from '../assets/Progress1.svg'


const steps = [
  {
    icon: PenLine,
    title: 'Capture ideas in notes',
    description: 'Start by jotting down thoughts, brainstorming with your team, and organizing ideas in flexible pages.',
    image: <img src={NoteIcon} alt="Note" className="w-50 h-50" />,
  },
  {
    icon: CheckSquare,
    title: 'Turn notes into tasks',
    description: 'Transform ideas into actionable tasks with one click. Set priorities, deadlines, and assignees.',
    image: <img src={TaskIcon} alt="Note" className="w-50 h-50" />,
  },
  {
    icon: Users2,
    title: 'Collaborate in real-time',
    description: 'Work together seamlessly. See who\'s online, comment on tasks, and stay aligned with your team.',
    image: <img src={CollaborateIcon} alt="Note" className="w-50 h-50" />,
  },
  {
    icon: TrendingUp,
    title: 'Progress Overview',
    description: 'Keep your team aligned by reviewing task updates, seeing what’s done, and understanding what’s next. Ensure smooth workflow without missing anything.',
    image: <img src={ProgressIcon} alt="Note" className="w-50 h-50" />,
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="py-24 px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-blue-50 rounded-full mb-4">
            <span className="text-sm font-semibold text-blue-600">WORKFLOW</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How teams use Mirov every day
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A simple, powerful workflow that adapts to your team's needs
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } items-center gap-12`}
            >
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold mb-6">
                  {index + 1}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <step.icon className="w-8 h-8 text-blue-600" />
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">{step.description}</p>
              </div>

              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-white rounded-xl flex items-center justify-center text-8xl">
                    {step.image}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}