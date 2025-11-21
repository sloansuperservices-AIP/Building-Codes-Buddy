
import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { Project, Photo, PDFDoc, Task } from '../types';
import { CameraIcon, DocumentIcon, VideoCameraIcon, MapPinIcon, ClipboardListIcon, PaperclipIcon, TrashIcon, PlusIcon, SparklesIcon } from './Icons';
import VideoWalkthrough from './VideoWalkthrough';

interface ProjectDetailProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const PhotoPickerModal: React.FC<{
  projectPhotos: Photo[];
  assignedPhotoIds: string[];
  onClose: () => void;
  onAssign: (photoIds: string[]) => void;
}> = ({ projectPhotos, assignedPhotoIds, onClose, onAssign }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assignedPhotoIds));

  const handleTogglePhoto = (photoId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleAssign = () => {
    onAssign(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Assign Photos</h2>
        <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {projectPhotos.map(photo => {
            const isSelected = selectedIds.has(photo.id);
            return (
              <div key={photo.id} onClick={() => handleTogglePhoto(photo.id)} className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer ring-2 ${isSelected ? 'ring-cyan-500' : 'ring-transparent'}`}>
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                {isSelected && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">Cancel</button>
          <button type="button" onClick={handleAssign} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">Assign</button>
        </div>
      </div>
    </div>
  );
};


const TaskTab: React.FC<{ project: Project; onUpdateProject: (project: Project) => void }> = ({ project, onUpdateProject }) => {
    const [pickerState, setPickerState] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });

    const handleUpdateTask = (taskId: string, updatedValues: Partial<Task>) => {
        const updatedTasks = project.tasks.map(task => 
            task.id === taskId ? { ...task, ...updatedValues } : task
        );
        onUpdateProject({ ...project, tasks: updatedTasks });
    };

    const handleAddTask = () => {
        const newTask: Task = {
            id: `task_${Date.now()}`,
            description: '',
            assignedTo: '',
            completed: false,
            photoIds: [],
        };
        onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
    };

    const handleDeleteTask = (taskId: string) => {
        onUpdateProject({ ...project, tasks: project.tasks.filter(t => t.id !== taskId) });
    };

    const handleGenerateTasks = () => {
        const latestWalkthrough = [...project.walkthroughs].pop();
        if (!latestWalkthrough || !latestWalkthrough.projectPlan) {
            alert("No project plan to generate tasks from. Record a walkthrough first.");
            return;
        }

        const planLines = latestWalkthrough.projectPlan.split('\n');
        const newTasks = planLines
            .map(line => line.trim())
            .filter(line => line.startsWith('- '))
            .map(line => line.substring(2).trim())
            .filter(description => description.length > 0)
            .map(description => ({
                id: `task_${Date.now()}_${Math.random()}`,
                description,
                assignedTo: '',
                completed: false,
                photoIds: [],
            }));

        if (newTasks.length > 0) {
            onUpdateProject({ ...project, tasks: [...project.tasks, ...newTasks] });
        } else {
            alert("Could not find any tasks in the project plan. Ensure the plan contains lines starting with '- '.");
        }
    };

    const photosById = useMemo(() => {
        return project.photos.reduce((acc, photo) => {
            acc[photo.id] = photo;
            return acc;
        }, {} as Record<string, Photo>);
    }, [project.photos]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-slate-700">Task List</h3>
                <div className="flex gap-2">
                    <button onClick={handleGenerateTasks} disabled={project.walkthroughs.length === 0} className="flex items-center text-sm bg-purple-100 text-purple-700 px-3 py-2 rounded-lg shadow-sm hover:bg-purple-200 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Generate from Walkthrough
                    </button>
                    <button onClick={handleAddTask} className="flex items-center text-sm bg-cyan-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-cyan-700 transition-colors">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Task
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {project.tasks.map(task => (
                    <div key={task.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-3">
                            <input type="checkbox" checked={task.completed} onChange={e => handleUpdateTask(task.id, { completed: e.target.checked })} className="mt-1 h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                            <div className="flex-1">
                                <input type="text" value={task.description} onChange={e => handleUpdateTask(task.id, { description: e.target.value })} placeholder="Task description..." className={`w-full bg-transparent focus:outline-none focus:bg-white p-1 rounded-md ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`} />
                                <input type="text" value={task.assignedTo} onChange={e => handleUpdateTask(task.id, { assignedTo: e.target.value })} placeholder="Assign to..." className="w-full text-sm bg-transparent text-slate-500 focus:outline-none focus:bg-white p-1 mt-1 rounded-md" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPickerState({ open: true, taskId: task.id })} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-slate-200 rounded-full" aria-label="Attach photos">
                                    <PaperclipIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-full" aria-label="Delete task">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {task.photoIds.length > 0 && (
                            <div className="pl-8 pt-2 flex flex-wrap gap-2">
                                {task.photoIds.map(pid => photosById[pid] && (
                                    <img key={pid} src={photosById[pid].url} alt={photosById[pid].name} className="w-12 h-12 rounded object-cover border" />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {project.tasks.length === 0 && <p className="text-slate-500 mt-4 text-center">No tasks yet. Add one manually or generate from a walkthrough.</p>}

            {pickerState.open && pickerState.taskId && (
                <PhotoPickerModal
                    projectPhotos={project.photos}
                    assignedPhotoIds={project.tasks.find(t => t.id === pickerState.taskId)?.photoIds || []}
                    onClose={() => setPickerState({ open: false, taskId: null })}
                    onAssign={(photoIds) => {
                        handleUpdateTask(pickerState.taskId!, { photoIds });
                    }}
                />
            )}
        </div>
    );
};


const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState('photos');

  const handlePhotoUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPhotos: Photo[] = files.map(file => ({
        id: `photo_${Date.now()}_${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      onUpdateProject({ ...project, photos: [...project.photos, ...newPhotos] });
    }
  }, [project, onUpdateProject]);

  const handleDocumentUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newDocs: PDFDoc[] = files.map(file => ({
        id: `doc_${Date.now()}_${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      onUpdateProject({ ...project, documents: [...project.documents, ...newDocs] });
    }
  }, [project, onUpdateProject]);


  const renderContent = () => {
    switch (activeTab) {
      case 'photos':
        return <PhotoTab photos={project.photos} onUpload={handlePhotoUpload} />;
      case 'documents':
        return <DocumentTab documents={project.documents} onUpload={handleDocumentUpload} />;
      case 'walkthroughs':
        return <VideoWalkthrough project={project} onUpdateProject={onUpdateProject} />;
      case 'tasks':
        return <TaskTab project={project} onUpdateProject={onUpdateProject} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'photos', label: 'Photos', icon: <CameraIcon className="w-5 h-5 mr-2" /> },
    { id: 'documents', label: 'Documents', icon: <DocumentIcon className="w-5 h-5 mr-2" /> },
    { id: 'walkthroughs', label: 'Walkthroughs', icon: <VideoCameraIcon className="w-5 h-5 mr-2" /> },
    { id: 'tasks', label: 'Tasks', icon: <ClipboardListIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
        <div className="flex items-center mt-2 text-slate-500">
            <MapPinIcon className="w-5 h-5 mr-2" />
            <p>{project.address}</p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};


const PhotoTab: React.FC<{photos: Photo[], onUpload: (e: ChangeEvent<HTMLInputElement>) => void}> = ({ photos, onUpload }) => (
    <div>
        <div className="mb-4">
            <label className="cursor-pointer bg-cyan-50 text-cyan-700 font-semibold py-2 px-4 rounded-lg inline-block hover:bg-cyan-100 transition-colors">
                <span>Upload Photos</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
            </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map(photo => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg shadow-md group">
                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-end p-2">
                        <p className="text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">{photo.name}</p>
                    </div>
                </div>
            ))}
        </div>
         {photos.length === 0 && <p className="text-slate-500">No photos uploaded yet.</p>}
    </div>
);

const DocumentTab: React.FC<{documents: PDFDoc[], onUpload: (e: ChangeEvent<HTMLInputElement>) => void}> = ({ documents, onUpload }) => (
    <div>
        <div className="mb-4">
            <label className="cursor-pointer bg-cyan-50 text-cyan-700 font-semibold py-2 px-4 rounded-lg inline-block hover:bg-cyan-100 transition-colors">
                <span>Upload PDFs</span>
                <input type="file" multiple accept=".pdf" className="hidden" onChange={onUpload} />
            </label>
        </div>
        <ul className="space-y-3">
            {documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center">
                        <DocumentIcon className="w-6 h-6 text-slate-500 mr-3" />
                        <span className="font-medium text-slate-700">{doc.name}</span>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline text-sm font-semibold">View</a>
                </li>
            ))}
        </ul>
        {documents.length === 0 && <p className="text-slate-500">No documents uploaded yet.</p>}
    </div>
);


export default ProjectDetail;