import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

type AspectRatio = "16:9" | "9:16";
type Resolution = "720p" | "1080p";

const loadingMessages = [
  "Đang khởi tạo...",
  "AI đang chuẩn bị cọ vẽ kỹ thuật số...",
  "Đang tìm kiếm ý tưởng...",
  "AI đang vẽ từng khung hình...",
  "Đang ghép các cảnh lại với nhau...",
  "Thêm một chút phép màu cuối cùng...",
  "Sắp xong rồi...",
];

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  
  useEffect(() => {
    const checkApiKey = async () => {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      let i = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = window.setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSelectKey = async () => {
    try {
        if(window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race condition
            setApiKeySelected(true); 
        }
    } catch(e) {
        console.error("Lỗi khi chọn API key:", e)
    }
  };


  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập mô tả cho video.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      // FIX: Correct GoogleGenAI initialization to use a named parameter.
      const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      let operation = await localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution,
          aspectRatio: aspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await localAi.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if(downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        setGeneratedVideoUrl(videoUrl);
      } else {
         setError('Không thể tạo video. Vui lòng thử lại với một mô tả khác.');
      }

    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes("Requested entity was not found")) {
          setError("API key không hợp lệ. Vui lòng chọn lại key.");
          setApiKeySelected(false);
      } else {
        setError('Đã xảy ra lỗi trong quá trình tạo video.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!apiKeySelected) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Cần có API Key</h2>
            <p className="mt-2 text-gray-600 max-w-sm">
                Để tạo video, bạn cần chọn một API key từ dự án Google Cloud có bật tính năng thanh toán.
            </p>
             <p className="mt-2 text-xs text-gray-500">
                Tìm hiểu thêm về <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">thanh toán cho Gemini API</a>.
            </p>
            <button
                onClick={handleSelectKey}
                className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Chọn API Key
            </button>
        </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        {generatedVideoUrl ? (
          <video src={generatedVideoUrl} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-lg" />
        ) : (
          <div className={`w-full max-w-md bg-gray-200 rounded-lg flex items-center justify-center transition-all duration-300 ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'}`}>
            {isLoading ? (
              <div className="flex flex-col items-center text-gray-500 text-center p-4">
                <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-sm font-semibold">{loadingMessage}</p>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm">Video của bạn sẽ xuất hiện ở đây</p>
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm text-center my-2">{error}</p>}
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mô tả video bạn muốn tạo..."
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 px-3"
            disabled={isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="p-2 rounded-full bg-indigo-500 text-white disabled:bg-gray-300 transition-colors duration-200 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Tạo video"
          >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Tỷ lệ:</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} disabled={isLoading} className="bg-gray-100 border-gray-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2">
                    <option value="16:9">Ngang (16:9)</option>
                    <option value="9:16">Dọc (9:16)</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Phân giải:</label>
                <select value={resolution} onChange={e => setResolution(e.target.value as Resolution)} disabled={isLoading} className="bg-gray-100 border-gray-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2">
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                </select>
            </div>
        </div>
      </div>
    </div>
  );
};
