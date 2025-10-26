import React, { useState } from 'react';
import { TextChat } from './components/TextChat';
import { VoiceChat } from './components/VoiceChat';
import { ImageGenerator } from './components/ImageGenerator';
import { SoftwareTools } from './components/SoftwareTools';

type Mode = 'text' | 'voice' | 'image' | 'tools';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('text');

  const renderContent = () => {
    switch (mode) {
      case 'text':
        return <TextChat />;
      case 'voice':
        return <VoiceChat />;
      case 'image':
        return <ImageGenerator />;
      case 'tools':
        return <SoftwareTools />;
      default:
        return <TextChat />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '90vh' }}>
        <header className="bg-white p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Bạn nhỏ AI Tin học</h1>
              <p className="text-sm text-gray-500">Người bạn hướng dẫn học lập trình!</p>
            </div>
          </div>
          <nav className="flex bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setMode('text')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
                mode === 'text' ? 'bg-indigo-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Trò chuyện
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
                mode === 'voice' ? 'bg-indigo-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chat giọng nói
            </button>
            <button
              onClick={() => setMode('image')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
                mode === 'image' ? 'bg-indigo-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tạo ảnh
            </button>
            <button
              onClick={() => setMode('tools')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
                mode === 'tools' ? 'bg-indigo-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Công cụ
            </button>
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-1">
          {renderContent()}
        </main>
      </div>
       <footer className="text-center mt-4 text-xs text-gray-500">
        <p>Xây dựng với React, Tailwind CSS, và Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;