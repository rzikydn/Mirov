import React from 'react';

export default function WorkspacePreview() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bbh-sans-hegarty-regular">
            See how Mirov simplifies your workflow
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            A beautifully designed interface that makes collaboration effortless
          </p>
        </div>

        <div className="relative">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />

          {/* Main Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Window Header */}
            <div className="bg-gray-100 px-6 py-4 flex items-center space-x-3 border-b border-gray-200">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white px-4 py-1 rounded-lg text-sm text-gray-600">
                  mirov.app/workspace
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col sm:flex-row">
              {/* Sidebar */}
              <div className="w-full sm:w-64 bg-gray-50 border-r border-gray-200 p-6 flex-shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      M
                    </div>
                    <span className="font-semibold text-gray-900">My Workspace</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3">
                      Pages
                    </div>
                    <div className="space-y-1">
                      {['Product Ideas', 'Sprint Planning', 'Team Notes'].map((item) => (
                        <div
                          key={item}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-4 sm:p-8 overflow-x-auto">
                {/* Roadmap Header */}
                <div className="mb-8 min-w-[300px]">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Product Roadmap Q4
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Last edited 2 hours ago</span>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-[300px]">
                  {['To Do', 'In Progress', 'Done'].map((column) => (
                    <div key={column} className="bg-gray-50 rounded-xl p-4 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{column}</h4>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                          {column === 'Done' ? '5' : column === 'In Progress' ? '3' : '8'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                            <div className="h-2 bg-gray-100 rounded w-3/4" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
