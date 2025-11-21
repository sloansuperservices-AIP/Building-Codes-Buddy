
export interface Photo {
  id: string;
  name: string;
  url: string;
}

export interface PDFDoc {
  id: string;
  name: string;
  url: string;
}

export interface Walkthrough {
  id: string;
  date: string;
  videoUrl: string;
  transcript: string;
  projectPlan: string;
}

export interface Task {
  id:string;
  description: string;
  assignedTo: string;
  completed: boolean;
  photoIds: string[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  photos: Photo[];
  documents: PDFDoc[];
  walkthroughs: Walkthrough[];
  tasks: Task[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export enum AppView {
  DASHBOARD = 'dashboard',
  PROJECT_DETAIL = 'project_detail',
  CHATBOT = 'chatbot'
}