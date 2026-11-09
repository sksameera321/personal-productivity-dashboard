/**
 * Personal Productivity Dashboard - Goals Module
 * Developer: Sameera Bhanu
 * Handles daily personal goals, progress tracking, and persistence.
 */

const GoalManager = {
  goals: [],

  /**
   * Initialize goals from storage
   */
  init() {
    this.goals = Storage.getGoals() || [];
  },

  /**
   * Get all goals
   */
  getAll() {
    return this.goals;
  },

  /**
   * Add a new personal daily goal
   */
  add(text) {
    if (!text || text.trim() === '') return null;

    const newGoal = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: text.trim(),
      completed: false,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    this.goals.unshift(newGoal);
    this.persist();
    return newGoal;
  },

  /**
   * Toggle goal completion state
   */
  toggle(id) {
    const goal = this.goals.find(g => g.id === id);
    if (!goal) return null;

    goal.completed = !goal.completed;
    this.persist();
    return goal;
  },

  /**
   * Delete goal
   */
  delete(id) {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) return false;

    const deleted = this.goals.splice(index, 1)[0];
    this.persist();
    return deleted;
  },

  /**
   * Calculate goals progress
   */
  getProgress() {
    const total = this.goals.length;
    const completed = this.goals.filter(g => g.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  },

  /**
   * Persist changes to LocalStorage
   */
  persist() {
    Storage.saveGoals(this.goals);
  }
};
