
import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { PaperAirplaneIcon, SparklesIcon } from './Icons';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createChatSession();
    setMessages([{
        id: 'initial',
        text: 'Hello! I am your AI Code Buddy. Ask me anything about the 2018 IBC, NFPA, or NEC codes.',
        sender: 'ai'
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: input,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        if (chatRef.current) {
            const result = await chatRef.current.sendMessage({ message: input });
            const aiMessage: ChatMessage = {
                id: `msg_${Date.now()}_ai`,
                text: result.text,
                sender: 'ai',
            };
            setMessages(prev => [...prev, aiMessage]);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: ChatMessage = {
            id: `msg_${Date.now()}_err`,
            text: "Sorry, I encountered an error. Please try again.",
            sender: 'ai',
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">AI Code Buddy</h2>
        <p className="text-sm text-slate-500">Your expert on IBC 2018, NFPA, & 2018 NEC</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>}
            <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>
                <div className="max-w-lg p-3 rounded-lg bg-slate-100 text-slate-800">
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a code question..."
            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-cyan-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
