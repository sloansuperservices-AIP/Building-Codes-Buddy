
import React, { useState } from 'react';
import { Project } from '../types';
import { FolderIcon, MapPinIcon, PlusIcon } from './Icons';

interface DashboardProps {
  projects: Project[];
  onCreateProject: (name: string, address: string) => void;
  onSelectProject: (id: string) => void;
}

const ProjectCard: React.FC<{ project: Project; onSelect: (id: string) => void }> = ({ project, onSelect }) => (
  <div
    onClick={() => onSelect(project.id)}
    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden group"
  >
    <div className="bg-slate-700 p-4">
      <FolderIcon className="w-10 h-10 text-cyan-400" />
    </div>
    <div className="p-4">
      <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-cyan-600">{project.name}</h3>
      <div className="flex items-center mt-2 text-slate-500">
        <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
        <p className="text-sm truncate">{project.address}</p>
      </div>
    </div>
  </div>
);

const CreateProjectModal: React.FC<{ onClose: () => void; onCreate: (name: string, address: string) => void; }> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && address.trim()) {
            onCreate(name, address);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="projectName" className="block text-sm font-medium text-slate-600 mb-1">Project Name</label>
                        <input type="text" id="projectName" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="projectAddress" className="block text-sm font-medium text-slate-600 mb-1">Project Address</label>
                        <input type="text" id="projectAddress" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ projects, onCreateProject, onSelectProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Projects</h1>
        <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-cyan-700 transition-colors duration-300"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onSelect={onSelectProject} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
            <FolderIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">No Projects Yet</h3>
            <p className="text-slate-500 mt-2">Click "New Project" to get started.</p>
        </div>
      )}

      {isModalOpen && <CreateProjectModal onClose={() => setIsModalOpen(false)} onCreate={onCreateProject} />}
    </div>
  );
};

export default Dashboard;
