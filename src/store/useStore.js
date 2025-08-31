import { create } from 'zustand'

const useStore = create((set) => ({
  // Sidebar state
  collapsed: false,
  setCollapsed: (collapsed) => set({ collapsed }),
  toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),

  // Mobile sidebar overlay state
  isMobileSidebarOpen: false,
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  // Search state
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Chapter selection state
  selectedChapter: null,
  setSelectedChapter: (chapter) => set({ selectedChapter: chapter }),

  // Loading and error state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useStore 