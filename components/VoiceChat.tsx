import React, { useState, useRef, useCallback } from 'react';
import type { LiveSession } from '@google/genai';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Transcript } from '../types';
import { ai } from '../services/geminiService';

// Audio utility functions
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
const systemInstruction = `Bạn là một trợ lý AI thân thiện, đáng yêu và vui tính tên là "Bạn nhỏ Tin học". Mục tiêu của bạn là giúp các em học sinh tiểu học (từ 6-10 tuổi) học về khoa học máy tính và lập trình thông qua một cuộc trò chuyện bằng giọng nói.
- **QUAN TRỌNG: Giữ câu trả lời của bạn CỰC KỲ ngắn gọn và đi thẳng vào vấn đề.** Cố gắng trả lời trong một hoặc hai câu.
- Nói bằng giọng vui vẻ và hấp dẫn.
- Dùng từ ngữ đơn giản.
- Dùng các ví dụ gần gũi với các em, như xếp hình LEGO, nấu ăn theo công thức, hay chơi trò chơi.
- Hãy thật kiên nhẫn và tích cực.
- Đặt câu hỏi để các em luôn hứng thú.`;

export const VoiceChat: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const stopConversation = useCallback(async () => {
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            await inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            await outputAudioContextRef.current.close();
        }
        
        setConnectionState('disconnected');
    }, []);

    const startConversation = useCallback(async () => {
        setConnectionState('connecting');
        setTranscripts([]);
        let currentInputTranscription = '';
        let currentOutputTranscription = '';
        let nextStartTime = 0;
        const outputSources = new Set<AudioBufferSourceNode>();

        try {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputNode = outputAudioContextRef.current.createGain();

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: async () => {
                        setConnectionState('connected');
                        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        
                        sourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        sourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                            setTranscripts(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'model') {
                                    return [...prev.slice(0, -1), { ...last, text: currentOutputTranscription }];
                                }
                                return [...prev, { speaker: 'model', text: currentOutputTranscription, isFinal: false }];
                            });
                        } else if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                             setTranscripts(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user') {
                                    return [...prev.slice(0, -1), { ...last, text: currentInputTranscription }];
                                }
                                return [...prev, { speaker: 'user', text: currentInputTranscription, isFinal: false }];
                            });
                        }

                        if (message.serverContent?.turnComplete) {
                            setTranscripts(prev => prev.map(t => ({...t, isFinal: true})));
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(
                                decode(audioData),
                                outputAudioContextRef.current,
                                24000,
                                1,
                            );
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => {
                                outputSources.delete(source);
                            });
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            outputSources.add(source);
                        }

                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                           for (const source of outputSources.values()) {
                                source.stop();
                                outputSources.delete(source);
                            }
                            nextStartTime = 0;
                        }
                    },
                    onerror: (e) => {
                        console.error('Lỗi Live API:', e);
                        setConnectionState('error');
                        stopConversation();
                    },
                    onclose: () => {
                       // Handled by user action
                    },
                },
            });
        } catch (error) {
            console.error('Không thể bắt đầu cuộc trò chuyện:', error);
            setConnectionState('error');
        }
    }, [stopConversation]);

    const MicIcon = ({ isListening }: { isListening: boolean }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors ${isListening ? 'text-red-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17h-2v-2.07A6.98 6.98 0 013 8a1 1 0 112 0 5 5 0 0010 0 1 1 0 112 0 6.98 6.98 0 01-5 6.93z" clipRule="evenodd" />
        </svg>
    );

    const renderTranscripts = () => (
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcripts.map((t, i) => (
                <div key={i} className={`flex items-start gap-3 ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {t.speaker === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 text-white flex items-center justify-center text-sm font-bold">AI</div>}
                    <p className={`px-4 py-2 rounded-2xl max-w-md ${t.speaker === 'user' ? 'bg-indigo-100 text-indigo-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} ${!t.isFinal ? 'opacity-70' : ''}`}>
                        {t.text}
                    </p>
                    {t.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 text-gray-600 flex items-center justify-center font-bold">B</div>}
                </div>
            ))}
         </div>
    );
    
    return (
        <div className="h-full flex flex-col justify-between items-center p-4 bg-gray-50">
           {transcripts.length === 0 && (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <h2 className="text-xl font-semibold">Sẵn sàng trò chuyện chưa?</h2>
                    <p className="max-w-xs mt-1">Nhấn nút micro bên dưới để bắt đầu cuộc trò chuyện bằng giọng nói với Bạn nhỏ Tin học nhé.</p>
                </div>
            )}
            {transcripts.length > 0 && renderTranscripts()}
            <div className="w-full flex flex-col items-center pt-4">
                <p className="h-6 text-sm text-gray-500 mb-2">
                    {connectionState === 'connecting' && 'Đang kết nối...'}
                    {connectionState === 'connected' && 'Đang lắng nghe...'}
                    {connectionState === 'error' && 'Lỗi kết nối. Vui lòng thử lại.'}
                    {connectionState === 'disconnected' && 'Nhấn micro để bắt đầu'}
                </p>
                {connectionState === 'connected' || connectionState === 'connecting' ? (
                     <button onClick={stopConversation} className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                ) : (
                    <button onClick={startConversation} className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                        <MicIcon isListening={false} />
                    </button>
                )}
            </div>
        </div>
    );
};