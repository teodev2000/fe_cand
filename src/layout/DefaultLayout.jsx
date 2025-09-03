import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import useStore from '../store/useStore';
import { menuService } from '../services/MenuService';

const DefaultLayout = ({ children }) => {
  const { searchQuery, setSearchQuery, setSelectedChapter } = useStore();
  const [menuData, setMenuData] = useState([]);

  // Fetch menu từ API khi mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await menuService.getMenu();
        setMenuData(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        setMenuData([]);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={setSearchQuery} />
      <div className="flex-1 flex overflow-hidden relative">
          <div className={`mr-0 md:mr-[350px]`}>
            <Sidebar searchQuery={searchQuery} onChapterSelect={setSelectedChapter} data={menuData} />
          </div>
        <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out`}>
          <main className="flex-1 md:p-6 md:bg-gray-50 bg-blue-300 mb-3">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
