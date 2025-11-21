import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Project, Walkthrough } from '../types';
import { generateProjectPlanFromTranscript } from '../services/geminiService';

interface VideoWalkthroughProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

// Define a local type for the Gemini API blob, as it's not exported from the library.
interface GeminiBlob {
    data: string;
    mimeType: string;
}

// Define a type for the LiveSession to avoid using `any`
interface LiveSession {
    sendRealtimeInput(input: { media: GeminiBlob }): void;
    close(): void;
}

// Helper functions for audio encoding
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): GeminiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}


const VideoWalkthrough: React.FC<VideoWalkthroughProps> = ({ project, onUpdateProject }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [statusMessage, setStatusMessage] = useState('Ready to record walkthrough');
    const [isProcessing, setIsProcessing] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<globalThis.Blob[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const transcriptRef = useRef<string>('');
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const cleanupRecording = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
        }
        
        setStream(null);
        inputAudioContextRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
    }, [stream]);
    
    useEffect(() => {
        return () => {
            cleanupRecording();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startRecording = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setIsRecording(true);
            setStatusMessage('Recording...');
            recordedChunksRef.current = [];
            transcriptRef.current = '';

            // MediaRecorder for video
            mediaRecorderRef.current = new MediaRecorder(mediaStream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.start();

            // Gemini Live for transcription
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => { console.log('Gemini session opened.'); },
                    onmessage: (message: LiveServerMessage) => {
                        const text = message.serverContent?.inputTranscription?.text;
                        if (text) {
                            transcriptRef.current += text;
                        }
                        // Per API guidelines, audio output must be handled.
                        if (message.serverContent?.modelTurn?.parts[0]?.inlineData.data) {
                           console.log("Received audio data from model.");
                        }
                    },
                    onerror: (e: ErrorEvent) => { console.error('Gemini error:', e); setStatusMessage("Transcription error."); },
                    onclose: () => { console.log('Gemini session closed.'); },
                },
                config: {
                    inputAudioTranscription: {},
                    responseModalities: [Modality.AUDIO]
                }
            });
            
            sessionPromiseRef.current.catch(err => {
                console.error("Gemini session connection error:", err);
                setStatusMessage("Failed to connect to transcription service.");
            });

            // Audio processing for Gemini
            // Cast window to any to access webkitAudioContext for broader browser support and fix TypeScript error.
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(mediaStream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                // Rely on promise resolving to send data, as per guidelines.
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

        } catch (error) {
            console.error("Error starting recording:", error);
            setStatusMessage("Failed to start recording. Check permissions.");
        }
    };

    const stopRecording = async () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setStatusMessage('Processing video and transcript...');
            setIsProcessing(true);
            
            cleanupRecording();

            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(videoBlob);
            
            const finalTranscript = transcriptRef.current;
            
            setStatusMessage('Generating project plan...');
            const projectPlan = await generateProjectPlanFromTranscript(finalTranscript);

            const newWalkthrough: Walkthrough = {
                id: `wt_${Date.now()}`,
                date: new Date().toLocaleString(),
                videoUrl,
                transcript: finalTranscript,
                projectPlan,
            };

            onUpdateProject({ ...project, walkthroughs: [...project.walkthroughs, newWalkthrough] });
            setStatusMessage('Walkthrough saved!');
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <video ref={videoRef} autoPlay muted className={`w-full rounded-md bg-black ${!stream ? 'aspect-video' : ''}`}></video>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Status</p>
                        <p className="text-slate-500">{statusMessage}</p>
                    </div>
                    {!isRecording ? (
                        <button onClick={startRecording} disabled={isProcessing} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-slate-300">Start Walkthrough</button>
                    ) : (
                        <button onClick={stopRecording} disabled={isProcessing} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-slate-300">Stop & Save</button>
                    )}
                </div>
            </div>

            <div className="mt-6 space-y-6">
                {project.walkthroughs.slice().reverse().map(wt => (
                    <div key={wt.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 font-semibold text-slate-800">Walkthrough - {wt.date}</div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold mb-2">Recording</h4>
                                <video src={wt.videoUrl} controls className="w-full rounded-md"></video>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">AI Generated Project Plan</h4>
                                <div className="bg-slate-50 p-3 rounded-md max-h-80 overflow-y-auto text-sm whitespace-pre-wrap font-mono">{wt.projectPlan}</div>
                                
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm font-medium text-cyan-600">View Full Transcript</summary>
                                    <div className="mt-2 bg-slate-50 p-3 rounded-md max-h-40 overflow-y-auto text-xs text-slate-600">{wt.transcript || "No transcript available."}</div>
                                </details>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {project.walkthroughs.length === 0 && !isRecording && !isProcessing && <p className="mt-4 text-slate-500">No walkthroughs recorded yet.</p>}
        </div>
    );
};

export default VideoWalkthrough;