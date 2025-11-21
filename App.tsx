
import React, { useState, useCallback } from 'react';
import { Project, AppView } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import Chatbot from './components/Chatbot';
import { PlusIcon, CodeBracketIcon, FolderIcon } from './components/Icons';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleCreateProject = useCallback((name: string, address: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name,
      address,
      photos: [],
      documents: [],
      walkthroughs: [],
      tasks: [],
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
  }, []);

  const handleSelectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    setCurrentView(AppView.PROJECT_DETAIL);
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const renderContent = () => {
    switch (currentView) {
      case AppView.PROJECT_DETAIL:
        return selectedProject ? <ProjectDetail project={selectedProject} onUpdateProject={updateProject} /> : <Dashboard projects={projects} onCreateProject={handleCreateProject} onSelectProject={handleSelectProject} />;
      case AppView.CHATBOT:
        return <Chatbot />;
      case AppView.DASHBOARD:
      default:
        return <Dashboard projects={projects} onCreateProject={handleCreateProject} onSelectProject={handleSelectProject} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;