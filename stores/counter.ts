import { defineStore } from 'pinia'

interface CounterState {
  count: number
  history: number[]
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 0,
    history: [],
  }),

  getters: {
    doubleCount: (state): number => state.count * 2,
    lastHistoryItem: (state): number | undefined => state.history[state.history.length - 1],
  },

  actions: {
    increment() {
      this.history.push(this.count)
      this.count++
    },

    decrement() {
      this.history.push(this.count)
      this.count--
    },

    reset() {
      this.history.push(this.count)
      this.count = 0
    },
  },
})
