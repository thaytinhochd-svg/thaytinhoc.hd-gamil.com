import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { ai } from '../services/geminiService';
import type { ChatMessage } from '../types';

const suggestions = [
  "Làm thế nào để đổi màu chữ trong Word?",
  "Làm sao để chữ đậm, nghiêng hoặc gạch chân?",
  "Làm sao để thay đổi kiểu chữ và cỡ chữ trong word ?",
  "Cách chèn hình ảnh vào văn bản ?",
  "Làm sao để căn giữa tiêu đề?",
  "Làm sao để lưu lại văn bản đã gõ?",
  "Làm sao để nhập dữ liệu vào ô trong Excel ?",
  "Làm sao để tính tổng các ô nhanh nhất?",
  "Cách đổi màu nền ô trong bảng tính?",
  "Cách xóa một hàng hoặc một cột?",
  "Làm sao để vẽ hình tròn trong Paint ?",
  "Làm sao để tô màu hình vẽ trong Paint ?",
  "Cách xóa một phần hình vẽ trong Paint ?",
  "Cách lưu bức vẽ lại ?",
  "Internet là gì?",
  "Làm sao để tìm kiếm thông tin trên Google?",
  "Vì sao không nên chia sẻ mật khẩu cho người khác?",
  "Khi gặp tin nhắn lạ hoặc người không quen trên mạng, em nên làm gì?",
  "Làm sao để mở máy tính?",
  "Cách tắt máy đúng cách?",
  "Làm sao để tạo thư mục mới?",
  "Cách đổi tên tệp hoặc thư mục?",
  "Scratch là gì?",
  "Làm sao để nhân vật di chuyển?",
  "Làm sao để nhân vật nói chuyện?",
  "Làm sao để lưu dự án Scratch?",
  "Phần mềm PowerPoint dùng để làm gì?",
  "Khi mở PowerPoint, màn hình đầu tiên hiện ra là gì?",
  "Làm sao để thêm một trang chiếu mới?",
  "Làm sao để nhập chữ vào trang chiếu?",
  "Làm sao để đổi kiểu chữ và cỡ chữ trong PowerPoint?",
  "Làm sao để chèn hình ảnh vào trang chiếu?",
  "Làm sao để chèn hình vẽ (hình tròn, vuông, mũi tên)?",
  "Làm sao để thêm hiệu ứng chuyển động cho chữ hoặc hình?",
  "Làm sao để đổi thứ tự xuất hiện của hiệu ứng?",
  "Cách tạo hiệu ứng chuyển slide (chuyển trang)?",
  "Làm sao để chèn âm thanh hoặc nhạc nền vào bài trình chiếu?",
  "Làm sao để xem trước toàn bộ bài trình chiếu?",
  "Làm sao để lưu bài trình chiếu?",
  "Làm sao để đổi màu nền của trang chiếu?",
  "Làm sao để xóa một trang chiếu không cần thiết?",
  "Cách sắp xếp lại thứ tự các slide?",
  "Làm sao để chèn chữ nghệ thuật (WordArt)?",
  "Làm sao để chèn video vào PowerPoint?",
  "Làm sao để trình chiếu từ slide hiện tại?",
  "Khi trình chiếu, muốn qua slide tiếp theo thì làm thế nào?",
];

export const TextChat: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    const initChat = () => {
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'Bạn là "Gia sư Tin học AI cho trẻ em", một trợ lý AI thân thiện, kiên nhẫn và đáng yêu. Mục tiêu của bạn là giúp các em học sinh tiểu học (từ 6-10 tuổi) học về khoa học máy tính và lập trình. Hãy trả lời cực kỳ ngắn gọn, vui vẻ, dùng từ ngữ đơn giản và các ví dụ gần gũi.',
        },
      });
      setChat(newChat);
    };
    initChat();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessageAndGetResponse = async (messageText: string) => {
    if (!messageText.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { speaker: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: messageText });
      const modelMessage: ChatMessage = { speaker: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = { speaker: 'model', text: 'Ôi, có lỗi xảy ra rồi. Bạn thử lại nhé!' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessageAndGetResponse(userInput);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessageAndGetResponse(suggestion);
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
             <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 text-3xl font-bold mb-4">
                 AI
             </div>
             <h2 className="text-xl font-semibold text-gray-700">Chào em, đây là Gia sư Tin học AI!</h2>
             <p className="max-w-xs mt-1">Em có thể hỏi anh bất cứ điều gì về máy tính. Hoặc thử một vài gợi ý dưới đây nhé:</p>
             <div className="mt-6 flex flex-wrap justify-center gap-2">
                 {suggestions.map((q, i) => (
                     <button 
                         key={i}
                         onClick={() => handleSuggestionClick(q)}
                         className="bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-200 transition-colors"
                         disabled={isLoading}
                     >
                         {q}
                     </button>
                 ))}
             </div>
         </div>
        ) : messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.speaker === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 text-white flex items-center justify-center text-sm font-bold">AI</div>}
            <p className={`px-4 py-2 rounded-2xl max-w-md break-words ${msg.speaker === 'user' ? 'bg-indigo-100 text-indigo-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              {msg.text}
            </p>
            {msg.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 text-gray-600 flex items-center justify-center font-bold">B</div>}
          </div>
        ))}
         {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 text-white flex items-center justify-center text-sm font-bold">AI</div>
                <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full p-1 shadow-sm">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Hỏi Gia sư Tin học bất cứ điều gì..."
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 px-3"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="p-2 rounded-full bg-indigo-500 text-white disabled:bg-gray-300 transition-colors duration-200 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Gửi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};