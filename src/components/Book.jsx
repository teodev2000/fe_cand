import React, { useRef, useCallback, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import TTSControls from './TTSControls';
import picture from '../assets/anhbia.jpg';

class BookErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Book Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-600 font-bold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-red-500">Vui lòng thử lại sau</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hàm tách content thành các trang dựa trên chiều cao thực tế
function splitContentToPages(content, maxHeight) {
  if (!content) return [];
  
  // Tạo div tạm để đo chiều cao
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  // Điều chỉnh theo kích thước thực tế trên mobile/desktop
  const isMobileViewport = (window.innerWidth || 0) < 768;
  // Desktop: page width 550 - 2*40 (p-10) = 470
  // Mobile: min page width 315 - 2*40 (p-10) - 2*8 (p-2 content-section) ≈ 219
  tempDiv.style.width = isMobileViewport ? '219px' : '470px';
  tempDiv.style.fontSize = isMobileViewport ? '14px' : '18px';
  tempDiv.style.lineHeight = '1.6';
  tempDiv.style.padding = '0';
  tempDiv.className = 'prose prose-lg max-w-none text-gray-700 leading-relaxed';
  
  document.body.appendChild(tempDiv);
  
  try {
    // Nếu toàn bộ content vừa trong 1 trang
    tempDiv.innerHTML = content;
    if (tempDiv.offsetHeight <= maxHeight) {
      document.body.removeChild(tempDiv);
      return [content];
    }
    
    // Tách content thành các đoạn văn và elements
    const htmlElements = content.match(/<[^>]+>.*?<\/[^>]+>|[^<]+/gs) || [];
    const pages = [];
    let currentPage = '';
    
    for (let i = 0; i < htmlElements.length; i++) {
      const element = htmlElements[i].trim();
      if (!element) continue;
      
      // Thử thêm element vào trang hiện tại
      const testContent = currentPage + element;
      tempDiv.innerHTML = testContent;
      
      if (tempDiv.offsetHeight > maxHeight && currentPage) {
        // Nếu vượt quá chiều cao và đã có content, tạo trang mới
        pages.push(currentPage);
        currentPage = element;
      } else {
        // Nếu vẫn vừa hoặc trang hiện tại rỗng, thêm vào trang hiện tại
        currentPage = testContent;
      }
    }
    
    // Thêm trang cuối cùng
    if (currentPage) {
      pages.push(currentPage);
    }
    
    // Sau khi tách xong, đảm bảo trang mobile không quá ngắn (<50% chiều cao)
    if (isMobileViewport && pages.length > 1) {
      const mergedPages = [];
      let i = 0;
      const minHeight = maxHeight * 0.5;
      while (i < pages.length) {
        let current = pages[i];
        // Đo chiều cao trang hiện tại
        tempDiv.innerHTML = current;
        let currentHeight = tempDiv.offsetHeight;
        if (currentHeight < minHeight && i < pages.length - 1) {
          // Gộp với trang kế tiếp để tránh trang quá ngắn
          const merged = current + pages[i + 1];
          tempDiv.innerHTML = merged;
          const mergedHeight = tempDiv.offsetHeight;
          // Dù có vượt maxHeight, vẫn ưu tiên không tạo trang quá ngắn
          mergedPages.push(merged);
          i += 2;
        } else {
          mergedPages.push(current);
          i += 1;
        }
      }
      pages.splice(0, pages.length, ...mergedPages);
    }

    document.body.removeChild(tempDiv);
    return pages.length > 0 ? pages : [content];
    
  } catch (error) {
    document.body.removeChild(tempDiv);
    console.error('Error splitting content:', error);
    // Fallback: chia theo ký tự
    const pages = [];
    const charsPerPage = Math.ceil(content.length / Math.ceil(content.length / 2000));
    for (let i = 0; i < content.length; i += charsPerPage) {
      pages.push(content.slice(i, i + charsPerPage));
    }
    return pages;
  }
}

// Đặt Page ra ngoài Book để props được truyền đúng
const Page = React.forwardRef(({ number, contentPages, selectedChapter }, ref) => {
  const isCover = number === 1;
  const pageContent = contentPages[number - 2] || '';
  
  return (
    <div
      className={`page ${isCover ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-white'}
        ${isCover ? 'p-0' : 'p-10'} text-center flex flex-col justify-center items-center h-full box-border
        shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100`}
      ref={ref}
    >
      {isCover ? (
        <div className="cover-design text-white relative md:h-full h-[529px] w-full ">
            
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
              style={{ backgroundImage: `url(${picture})` }}>
          </div>
          
          {/* Red overlay */}
          <div className="absolute inset-0 opacity-40 d"></div>
          
        
          <div className="relative z-10 h-full flex flex-col justify-center items-center">
            <div className="cover-title text-lg sm:text-xl lg:text-3xl font-bold mb-4 sm:mb-6 tracking-wider leading-tight">
              CẨM NANG PHÒNG CHỐNG<br/>TỘI PHẠM VÀ VI PHẠM<br/>PHÁP LUẬT
            </div>
          </div>
        </div>

      ) : (
        <div className="chapter-content text-left h-full flex flex-col">
          <div className="chapter-header mb-3 bg-gradient-to-r from-sky-700 to-sky-600 md:p-3 p-1 rounded-lg border-l-4 border-sky-900 flex-shrink-0">
            <div className="flex items-center md:mb-4 mb-1">
              <div className="chapter-info">
                <h1 className="md:text-2xl text-base font-bold mb-2 text-white">{selectedChapter?.title}</h1>
              </div>
            </div>
          </div>
          
          <div className="chapter-body flex-1 flex flex-col overflow-hidden">
            <div className="page-number text-sm text-gray-500 mb-3 border-b pb-2 text-center flex-shrink-0">
              Trang {number - 1}
            </div>
            
            <div className="content-main flex-1 overflow-hidden">
              <div className="content-section bg-white p-2 rounded-lg h-full overflow-auto pb-3">
                {pageContent ? (
                  <div
                    className="book-content prose prose-lg max-w-none text-gray-700 leading-relaxed h-full overflow-visible md:!text-[18px] !text-[14px] "
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                    style={{ 
                      lineHeight: '1.6',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  />
                ) : selectedChapter?.hasContent === false ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">📄</div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">{selectedChapter?.title}</h2>
                    <p className="text-lg text-gray-500 mb-3">Menu này hiện tại không có nội dung</p>
                    <p className="text-sm text-gray-400">Nội dung sẽ được cập nhật sớm nhất</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <p>Nội dung đang được cập nhật...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const Book = ({ selectedChapter }) => {
  const bookRef = useRef();
  const [isMounted, setIsMounted] = useState(false);
  const [key, setKey] = useState(0);
  const [contentPages, setContentPages] = useState([]);
  
  
  // Tính toán chiều cao có sẵn cho content
  const BOOK_HEIGHT = 800;
  const BOOK_PADDING = 80; // padding top/bottom của page (p-10)
  const HEADER_HEIGHT = 120; // chiều cao header + page number
  // Trên mobile, content-section dùng p-2 => 16px; desktop khoảng 48px
  const CONTENT_PADDING_DESKTOP = 48;
  const CONTENT_PADDING_MOBILE = 16;
  const AVAILABLE_HEIGHT = BOOK_HEIGHT - (BOOK_PADDING * 2) - HEADER_HEIGHT - CONTENT_PADDING_DESKTOP;
  const [availableHeightMobile, setAvailableHeightMobile] = useState(AVAILABLE_HEIGHT);

  useEffect(() => {
    setIsMounted(true);
    // Đo chiều cao khả dụng để cắt content theo viewport (đặc biệt cho mobile)
    const measure = () => {
      try {
        const viewportHeight = window.innerHeight || 800;
        const isMobile = window.innerWidth < 768;
        // Chừa header + khoảng padding/controls; mobile cần dư nhiều hơn
        const reservedTopBottom = isMobile ? 220 : 160; // giảm để không cắt dòng cuối
        const pageHeight = Math.max(360, Math.min(800, viewportHeight - reservedTopBottom));
        const computedAvailable = pageHeight - (BOOK_PADDING * 2) - HEADER_HEIGHT - CONTENT_PADDING_MOBILE;
        // Chỉ áp dụng cho mobile để không ảnh hưởng desktop
        if (isMobile) {
          setAvailableHeightMobile(computedAvailable);
        } else {
          setAvailableHeightMobile(AVAILABLE_HEIGHT);
        }
      } catch (e) {}
    };
    measure();
    window.addEventListener('resize', measure);
    return () => {
      if (bookRef.current) {
        try {
          bookRef.current.pageFlip().destroy();
        } catch (error) {
          console.error('Error destroying book:', error);
        }
      }
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (selectedChapter) {
      setKey(prev => prev + 1);
      // Chỉ lật trang khi có nội dung
      if (selectedChapter.hasContent !== false) {
        setTimeout(() => {
          if (bookRef.current) {
            try {
              // Luôn lật đến trang 2 (index 1) để hiển thị nội dung
              bookRef.current.pageFlip().flip(1);
            } catch (error) {
              console.error('Error flipping to page:', error);
            }
          }
        }, 100);
      }
    }
  }, [selectedChapter]);

  // Chia content thành các trang
  useEffect(() => {
    if (!selectedChapter || !selectedChapter.content || selectedChapter.hasContent === false) {
      setContentPages([]);
      return;
    }

    const isMobile = window.innerWidth < 768;
    const effectiveAvailableHeight = isMobile ? availableHeightMobile : AVAILABLE_HEIGHT;
    console.log('Splitting content with available height:', effectiveAvailableHeight);
    console.log('Original content length:', selectedChapter.content.length);
    
    // Đợi DOM render xong rồi mới tách content
    setTimeout(() => {
      const pages = splitContentToPages(selectedChapter.content, effectiveAvailableHeight);
      console.log('Split into pages:', pages.length);
      setContentPages(pages);
    }, 100);
    
  }, [selectedChapter, availableHeightMobile]);

  const onFlip = useCallback((e) => {
    console.log('Current page:', e.data);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <BookErrorBoundary>
      <div className="perspective-1000 mx-auto w-full p-8">
        {/* TTS Controls */}
        {selectedChapter && selectedChapter.hasContent !== false && (
          <div className="mb-6">
            <TTSControls
              content={selectedChapter.content}
              title={selectedChapter.title}
            />
          </div>
        )}

        {/* Book spine effect */}
        <div className="relative">
          {/* Book thickness shadow */}
          <div className="absolute -right-2 top-2 w-full h-full bg-gray-800 rounded-lg transform rotate-1 opacity-30"></div>
          <div className="absolute -right-1 top-1 w-full h-full bg-gray-600 rounded-lg transform rotate-0.5 opacity-40"></div>

          {/* Main book container */}
          <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            <HTMLFlipBook
              key={key}
              width={550}
              height={800}
              size="stretch"
              minWidth={315}
              maxWidth={1000}
              minHeight={400}
              showCover={true}
              ref={bookRef}
              onFlip={onFlip}
              className="mx-auto"
              startPage={0}
              flippingTime={700}
              renderOnlyPageLengthChange={true}
              clickToFlip={true}
              pageCount={contentPages.length + 1}
            >
              {/* Trang bìa */}
              <Page number={1} key={1} contentPages={contentPages} selectedChapter={selectedChapter} />
              {/* Các trang nội dung */}
              {contentPages.map((_, idx) => (
                <Page number={idx + 2} key={idx + 2} contentPages={contentPages} selectedChapter={selectedChapter} />
              ))}
            </HTMLFlipBook>
          </div>
        </div>
      </div>
    </BookErrorBoundary>
  );
};

export default Book;