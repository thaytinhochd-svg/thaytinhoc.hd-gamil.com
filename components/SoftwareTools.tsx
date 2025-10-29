import React, { useState } from 'react';

type Tool = {
  name: string;
  description: string;
};

type ToolCategory = {
  category: string;
  tools: Tool[];
};

const softwareData: Record<string, ToolCategory[]> = {
  'Word': [
    {
      category: 'Thanh công cụ Home (Trang chính)',
      tools: [
        { name: 'Font (Phông chữ)', description: 'Bước 1: Bôi đen chữ. → Bước 2: Chọn tên phông chữ bạn thích.' },
        { name: 'Size (Cỡ chữ)', description: 'Bước 1: Bôi đen chữ. → Bước 2: Chọn số để tăng hoặc giảm cỡ chữ.' },
        { name: 'Bold (Chữ đậm)', description: 'Bước 1: Bôi đen chữ. → Bước 2: Nhấn vào chữ B.' },
        { name: 'Italic (Chữ nghiêng)', description: 'Bước 1: Bôi đen chữ. → Bước 2: Nhấn vào chữ I.' },
        { name: 'Underline (Chữ gạch chân)', description: 'Bước 1: Bôi đen chữ. → Bước 2: Nhấn vào chữ U.' },
        { name: 'Font Color (Màu chữ)', description: 'Bước 1: Bôi đen chữ. → Bước 2: Nhấn vào chữ A có màu ở dưới và chọn màu.' },
        { name: 'Align (Căn lề)', description: 'Dùng để căn chữ sang trái, giữa, hoặc phải trang giấy.' },
      ],
    },
    {
      category: 'Thanh công cụ Insert (Chèn)',
      tools: [
        { name: 'Picture (Ảnh)', description: 'Dùng để chèn một bức ảnh từ máy tính vào văn bản.' },
        { name: 'Table (Bảng)', description: 'Dùng để tạo một bảng có hàng và cột.' },
        { name: 'Shapes (Hình vẽ)', description: 'Dùng để vẽ các hình đơn giản như tròn, vuông, tam giác...' },
        { name: 'Page Number (Số trang)', description: 'Tự động đánh số thứ tự cho các trang.' },
      ],
    },
  ],
  'PowerPoint': [
    {
      category: 'Công cụ cơ bản',
      tools: [
        { name: 'New Slide (Trang chiếu mới)', description: 'Thêm một trang mới vào bài trình chiếu của bạn.' },
        { name: 'Layout (Bố cục)', description: 'Chọn cách sắp xếp chữ và hình ảnh trên trang chiếu.' },
        { name: 'Text Box (Hộp văn bản)', description: 'Tạo một ô để gõ chữ vào bất cứ đâu trên trang chiếu.' },
      ],
    },
     {
      category: 'Chèn đối tượng',
      tools: [
        { name: 'Insert Picture (Chèn ảnh)', description: 'Chèn ảnh từ máy tính vào trang chiếu.' },
        { name: 'Insert Shape (Chèn hình vẽ)', description: 'Vẽ các hình như mũi tên, hình sao, mặt cười...' },
        { name: 'Insert Audio/Video (Chèn âm thanh/video)', description: 'Thêm nhạc nền hoặc một đoạn phim vào bài.' },
      ],
    },
    {
      category: 'Hiệu ứng',
      tools: [
        { name: 'Transitions (Chuyển cảnh)', description: 'Tạo hiệu ứng đẹp mắt khi chuyển từ trang này sang trang khác.' },
        { name: 'Animations (Hiệu ứng động)', description: 'Làm cho chữ hoặc hình ảnh bay vào, xuất hiện hoặc biến mất.' },
      ],
    },
  ],
  'Excel': [
    {
      category: 'Nhập và định dạng dữ liệu',
      tools: [
        { name: 'Cell (Ô)', description: 'Là một ô trong bảng tính để em nhập chữ hoặc số.' },
        { name: 'Fill Color (Tô màu nền)', description: 'Đổi màu nền cho một hoặc nhiều ô để làm nổi bật.' },
        { name: 'Borders (Đường viền)', description: 'Tạo đường kẻ cho các ô để trông giống một cái bảng.' },
        { name: 'Format (Định dạng)', description: 'Chọn định dạng cho số, ví dụ như tiền tệ, ngày tháng...' },
      ],
    },
    {
      category: 'Hàm tính toán cơ bản',
      tools: [
        { name: 'SUM (Tính tổng)', description: 'Bước 1: Chọn ô muốn hiển thị kết quả. → Bước 2: Gõ =SUM(kéo chọn các ô cần tính) rồi Enter.' },
        { name: 'AVERAGE (Tính trung bình)', description: 'Tương tự hàm SUM, dùng để tính trung bình cộng của nhiều số.' },
      ],
    },
    {
       category: 'Sắp xếp dữ liệu',
      tools: [
        { name: 'Sort (Sắp xếp)', description: 'Sắp xếp dữ liệu theo thứ tự từ A-Z hoặc từ nhỏ đến lớn.' },
        { name: 'Filter (Lọc)', description: 'Chỉ hiển thị những dữ liệu em muốn xem và ẩn đi các dữ liệu khác.' },
      ],
    },
  ],
  'Paint': [
    {
      category: 'Công cụ vẽ và tô màu',
      tools: [
        { name: 'Pencil (Bút chì)', description: 'Dùng để vẽ các nét mảnh, giống như bút chì thật.' },
        { name: 'Brushes (Cọ vẽ)', description: 'Có nhiều loại cọ với nét vẽ khác nhau, như cọ màu nước, bút sáp...' },
        { name: 'Fill with color (Tô màu)', description: 'Bước 1: Chọn một màu. → Bước 2: Nhấn vào biểu tượng cái xô sơn. → Bước 3: Nhấn vào vùng kín mà em muốn tô.' },
        { name: 'Eraser (Cục tẩy)', description: 'Dùng để xóa những phần em vẽ sai.' },
      ],
    },
    {
      category: 'Công cụ hình dạng',
      tools: [
        { name: 'Shapes (Hình dạng)', description: 'Chọn một hình có sẵn như hình tròn, vuông, ngôi sao rồi kéo thả để vẽ.' },
        { name: 'Line (Đường thẳng)', description: 'Dùng để vẽ một đường thẳng tắp.' },
      ],
    },
    {
       category: 'Khác',
      tools: [
        { name: 'Text (Chữ)', description: 'Cho phép em gõ chữ vào bức vẽ của mình.' },
        { name: 'Select (Chọn)', description: 'Tạo một vùng chọn hình chữ nhật để di chuyển, sao chép hoặc xóa một phần của bức tranh.' },
      ],
    },
  ],
};

type SoftwareKey = keyof typeof softwareData;

export const SoftwareTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SoftwareKey>('Word');

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <div className="flex-shrink-0 border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {(Object.keys(softwareData) as SoftwareKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto mt-4">
        {softwareData[activeTab].map((category, catIndex) => (
          <div key={catIndex} className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-indigo-200">{category.category}</h3>
            <ul className="space-y-3">
              {category.tools.map((tool, toolIndex) => (
                <li key={toolIndex} className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                  <p className="font-semibold text-indigo-700">{tool.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
