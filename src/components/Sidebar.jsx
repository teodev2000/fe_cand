import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useStore from '../store/useStore';
import { menuService } from '../services/MenuService';
import { sectionPageService } from '../services/SectionPageService';

const Sidebar = ({ onChapterSelect, searchQuery, data }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const { selectedChapter, isLoading, setLoading, setError, clearError, isMobileSidebarOpen, closeMobileSidebar } = useStore();
  const collapsed = false; // Sidebar is fixed open

  // Always expanded: no auto-collapse or resize listeners
  useEffect(() => {}, []);

  // Auto-expand items to show selected chapter
  useEffect(() => {
    if (selectedChapter && data && data.length > 0) {
      // Tìm path từ root đến selectedChapter
      const findPathToId = (items, targetId, path = []) => {
        for (let item of items) {
          if (item.id === selectedChapter.id) return [...path, item.id];
          if (item.children && item.children.length > 0) {
            const childPath = findPathToId(item.children, targetId, [...path, item.id]);
            if (childPath) return childPath;
          }
        }
        return null;
      };
      const path = findPathToId(data, selectedChapter.id);
      if (path) {
        setExpandedItems(prev => {
          const newExpanded = { ...prev };
          path.forEach(id => { newExpanded[id] = true; });
          return newExpanded;
        });
      }
    }
  }, [selectedChapter, data]);

  // Toggle thực sự: mở nếu đang đóng, đóng nếu đang mở
  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Hàm tìm path từ root đến item
  const findPathToId = (items, targetId, path = []) => {
    for (let item of items) {
      if (item.id === targetId) return [...path, item.id];
      if (item.children && item.children.length > 0) {
        const childPath = findPathToId(item.children, targetId, [...path, item.id]);
        if (childPath) return childPath;
      }
    }
    return null;
  };

  const handleItemClick = async (item) => {
    console.log(item);
    
    // Luôn gọi API cho tất cả menu items (cả cha và con)
    setLoading(true);
    clearError();
    
    try {
      // Sử dụng API getSectionPageBySectionId thay vì getSectionById
      const response = await sectionPageService.getSectionPageBySectionId(item.id);
      console.log('API Response:', response);
      
      if (response.data && response.data.data) {
        // Xử lý cả trường hợp data là array hoặc object
        let sectionData;
        if (Array.isArray(response.data.data)) {
          sectionData = response.data.data[0];
        } else {
          sectionData = response.data.data;
        }
        
        if (sectionData && sectionData.content) {
          // Tạo object chapter với data từ API
          const chapterData = {
            id: item.id, // Giữ nguyên ID của menu item để active đúng
            title: item.name,
            content: sectionData.content, // Lấy content từ API
            pageNumber: sectionData.index || 1,
            sectionIcon: "📄",
            sectionName: sectionData.sectionName || item.name,
            createDate: sectionData.createDate
          };
          console.log('Chapter Data:', chapterData);
          onChapterSelect && onChapterSelect(chapterData);
        }
      }
    } catch (error) {
      console.error('Error fetching section content:', error);
      setError('Không thể tải nội dung. Vui lòng thử lại sau.');
      
      // Fallback: sử dụng data có sẵn nếu có
      if (item.content && item.pageNumber) {
        onChapterSelect && onChapterSelect(item);
      }
    } finally {
      setLoading(false);
    }
    
    // Multi-branch expand: chỉ bổ sung các node cha vào expandedItems, không đóng các nhánh khác
    const path = findPathToId(data, item.id);
    if (path) {
      setExpandedItems(prev => {
        const newExpanded = { ...prev };
        path.forEach(id => { newExpanded[id] = true; });
        return newExpanded;
      });
    }
    
    // Sidebar is fixed; no auto-close on mobile
  };

  // Hàm riêng để xử lý click vào icon dropdown
  const handleDropdownClick = (e, itemId) => {
    e.stopPropagation(); // Ngăn không cho event bubble lên parent
    toggleExpanded(itemId);
  };

  // Sidebar is fixed; no toggle handler

  // Recursive render function for generic tree
  const renderMenuItem = (item, depth = 0) => {
    const isExpanded = expandedItems[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const isHovered = hoveredItem === item.id;
    const isSelected = selectedChapter && selectedChapter.id === item.id;
    const isItemLoading = isLoading && selectedChapter && selectedChapter.id === item.id;
    const paddingLeft = `${depth * 16 + 16}px`;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center p-3 cursor-pointer transition-all duration-300 border-l-4 ${
            isSelected 
              ? 'border-yellow-500 bg-gradient-to-r from-yellow-100 to-orange-100' 
              : 'border-transparent hover:border-yellow-300'
          } ${
            isHovered && !isSelected ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white hover:bg-gray-50'
          } ${isItemLoading ? 'opacity-60 cursor-wait' : ''}`}
          style={{ paddingLeft }}
          onClick={() => !isItemLoading && handleItemClick(item)}
          onMouseEnter={() => !isItemLoading && setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Name */}
          <span className={`flex-1 font-medium transition-colors duration-300 ${
            isSelected ? 'text-yellow-800 font-semibold' : ''
          }`}>
            {item.name}
          </span>
          {/* Expand/Collapse indicator - tách riêng click event */}
          {hasChildren && !isItemLoading && (
            <span 
              className={`ml-2 transition-transform duration-300 cursor-pointer hover:bg-gray-200 rounded p-1 ${isExpanded ? 'rotate-90' : ''}`}
              onClick={(e) => handleDropdownClick(e, item.id)}
              title="Mở rộng/Thu gọn"
            >
              ▶
            </span>
          )}
          {/* Loading indicator for all items */}
          {isItemLoading && (
            <span className="ml-2 text-yellow-600 animate-spin">⏳</span>
          )}
        </div>
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200 ml-4">
            {item.children.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Recursive search filter for generic tree
  function filterMenuItems(items, query) {
    return items
      .map(item => {
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        let filteredChildren = [];
        if (item.children) {
          filteredChildren = filterMenuItems(item.children, query);
        }
        if (matchesQuery || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  if (!Array.isArray(data)) {
    return <div className="p-4 text-gray-500">Không có menu hợp lệ.</div>;
  }

  const filteredData = searchQuery
    ? filterMenuItems(data, searchQuery)
    : data;

  if (!Array.isArray(filteredData)) {
    return <div className="p-4 text-gray-500">Không có menu hợp lệ.</div>;
  }

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div 
        className={`hidden md:block bg-white border-r-3 border-gray-200 h-[calc(100vh-100px)] overflow-y-auto shadow-[2px_0_15px_rgba(0,0,0,0.1)] scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 transition-all duration-500 ease-in-out absolute top-0 left-0 w-[350px]`}
      >
        <div 
          className={`sticky top-0 z-10 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-gray-800 border-b-2 border-[#fbbf24] shadow-lg p-4`}
          title={"Mục lục"}
        >
          <h2 className="m-0 text-[1.5rem] font-bold drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)] flex items-center">
            <span className="mr-3">📚</span>
            <span>Mục lục</span>
          </h2>
          {searchQuery && (
            <div className="mt-3 text-sm bg-white/20 p-2.5 rounded-lg backdrop-blur-sm border border-white/30">
              <span className="font-medium">Kết quả tìm kiếm:</span> "{searchQuery}"
            </div>
          )}
        </div>
        <div className="py-2">
          {filteredData.map(item => renderMenuItem(item))}
        </div>
      </div>

      {/* Mobile overlay sidebar (rendered in a portal to escape transformed ancestors on iOS) */}
      <div className={`md:hidden`}>
        {createPortal(
          <>
            {/* Backdrop */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[1000]"
                onClick={closeMobileSidebar}
              />
            )}
            {/* Panel */}
            <div
              className={`fixed top-0 left-0 h-[100dvh] w-[85%] max-w-[360px] bg-white z-[1001] shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <div className="sticky top-0 z-10 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-gray-800 border-b-2 border-[#fbbf24] shadow-lg p-3 flex items-center" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <span className="mr-2">📚</span>
                <span className="font-semibold">Mục lục</span>
                <button
                  className="ml-auto px-2 py-1 rounded bg-black/5 hover:bg-black/10 active:scale-95"
                  onClick={closeMobileSidebar}
                  aria-label="Đóng mục lục"
                >
                  ✕
                </button>
              </div>
              <div onClick={closeMobileSidebar} className="py-2 h-[calc(100dvh-56px)] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
                {filteredData.map(item => renderMenuItem(item))}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </>
  );
};

export default Sidebar;