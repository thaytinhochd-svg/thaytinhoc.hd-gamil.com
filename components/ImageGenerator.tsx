import React, { useState } from 'react';
import { ai } from '../services/geminiService';

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Vui lòng nhập mô tả.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                setGeneratedImage(imageUrl);
            } else {
                setError('Tạo ảnh thất bại. Không có ảnh nào được trả về.');
            }
        } catch (e) {
            console.error(e);
            setError('Đã xảy ra lỗi trong quá trình tạo ảnh. Vui lòng kiểm tra console để biết chi tiết.');
        } finally {
            setIsLoading(false);
        }
    };

    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case '16:9': return 'aspect-video';
            case '9:16': return 'aspect-[9/16]';
            case '4:3': return 'aspect-[4/3]';
            case '3:4': return 'aspect-[3/4]';
            case '1:1': default: return 'aspect-square';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4">
            <div className="flex-1 flex flex-col items-center justify-center py-4">
                {generatedImage ? (
                     <img src={generatedImage} alt={prompt} className={`rounded-lg shadow-lg object-contain max-w-full max-h-full ${getAspectRatioClass()}`} />
                ) : (
                    <div className={`w-full max-w-md bg-gray-200 rounded-lg flex items-center justify-center transition-all duration-300 ${getAspectRatioClass()}`}>
                        {isLoading ? (
                            <div className="flex flex-col items-center text-gray-500">
                                <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-sm">Đang tạo kiệt tác của bạn...</p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 text-sm">Ảnh của bạn sẽ xuất hiện ở đây</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
             {error && <p className="text-red-500 text-sm text-center my-2">{error}</p>}
            <div className="mt-auto flex flex-col sm:flex-row items-center gap-2 bg-white border border-gray-200 rounded-full p-2 shadow-sm">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Mô tả hình ảnh bạn muốn tạo..."
                    className="flex-1 w-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 px-3"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <div className="flex items-center gap-2">
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        disabled={isLoading}
                        className="bg-gray-100 border-none rounded-full text-sm focus:ring-indigo-500 py-2 px-3"
                    >
                        {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                    </select>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="p-2 rounded-full bg-indigo-500 text-white disabled:bg-gray-300 transition-colors duration-200 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Tạo ảnh"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};