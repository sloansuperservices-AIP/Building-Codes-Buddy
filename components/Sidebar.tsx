
import React from 'react';
import { AppView } from '../types';
import { FolderIcon, CodeBracketIcon, SparklesIcon } from './Icons';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Projects', icon: <FolderIcon className="w-6 h-6" /> },
    { view: AppView.CHATBOT, label: 'Code Buddy', icon: <CodeBracketIcon className="w-6 h-6" /> },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-800 text-white flex flex-col">
      <div className="bg-slate-900 p-4 flex items-center justify-center md:justify-start">
        <SparklesIcon className="h-8 w-8 text-cyan-400" />
        <h1 className="hidden md:block text-xl font-bold ml-3">GC Buddy</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`flex items-center p-3 rounded-lg w-full transition-colors duration-200 ${
              currentView === item.view
                ? 'bg-cyan-500 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="hidden md:block ml-4 font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
