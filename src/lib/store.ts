import { create } from 'zustand'
import { DashboardStats, Restaurant } from '@/types'

interface AppState {
  selectedRestaurant: string | null
  dateRange: { from: Date; to: Date } | null
  isLoading: boolean
  stats: DashboardStats | null
  restaurants: Restaurant[]
  
  setSelectedRestaurant: (id: string | null) => void
  setDateRange: (range: { from: Date; to: Date } | null) => void
  setIsLoading: (loading: boolean) => void
  setStats: (stats: DashboardStats | null) => void
  setRestaurants: (restaurants: Restaurant[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedRestaurant: null,
  dateRange: null,
  isLoading: false,
  stats: null,
  restaurants: [],
  
  setSelectedRestaurant: (id) => set({ selectedRestaurant: id }),
  setDateRange: (range) => set({ dateRange: range }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setStats: (stats) => set({ stats }),
  setRestaurants: (restaurants) => set({ restaurants }),
}))
