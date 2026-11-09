/**
 * Personal Productivity Dashboard - Storage Module
 * Developer: Sameera Bhanu
 * Handles robust browser LocalStorage operations with error handling and sample seeding.
 */

const STORAGE_KEYS = {
  TASKS: 'ppd_tasks_v1',
  GOALS: 'ppd_goals_v1',
  SETTINGS: 'ppd_settings_v1'
};

const Storage = {
  /**
   * Safe retrieval from LocalStorage with fallback
   */
  get(key, fallback = []) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item);
    } catch (error) {
      console.error(`[Storage Error] Failed to read ${key}:`, error);
      return fallback;
    }
  },

  /**
   * Safe storage to LocalStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage Error] Failed to write ${key}:`, error);
      return false;
    }
  },

  /**
   * Get all tasks
   */
  getTasks() {
    return this.get(STORAGE_KEYS.TASKS, null);
  },

  /**
   * Save all tasks
   */
  saveTasks(tasks) {
    return this.set(STORAGE_KEYS.TASKS, tasks);
  },

  /**
   * Get all daily goals
   */
  getGoals() {
    return this.get(STORAGE_KEYS.GOALS, null);
  },

  /**
   * Save all daily goals
   */
  saveGoals(goals) {
    return this.set(STORAGE_KEYS.GOALS, goals);
  },

  /**
   * Get user settings / profile
   */
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS, {
      userName: 'Sameera',
      theme: 'light'
    });
  },

  /**
   * Seed realistic initial data if running for the first time
   */
  seedInitialDataIfEmpty() {
    const existingTasks = this.getTasks();
    const existingGoals = this.getGoals();

    // Today's date string YYYY-MM-DD
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    const todayStr = formatDate(today);
    
    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    // 2 days later
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = formatDate(dayAfter);

    if (existingTasks === null || existingTasks.length === 0) {
      const sampleTasks = [
        {
          id: 'task_' + Date.now() + '_1',
          title: 'Review Engineering Mathematics Lecture Notes',
          description: 'Focus on multi-variable calculus, partial derivatives, and complete exercises 4.2 to 4.5.',
          dueDate: todayStr,
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_2',
          title: 'Practice JavaScript Array Methods',
          description: 'Implement map, filter, reduce, and find algorithms with clean vanilla DOM examples.',
          dueDate: todayStr,
          priority: 'medium',
          completed: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_3',
          title: 'Prepare Seminar Slides on Modern CSS Layouts',
          description: 'Draft 8 slides covering CSS Grid, Flexbox, and subgrid with interactive live examples.',
          dueDate: tomorrowStr,
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_4',
          title: 'Weekly GitHub Portfolio Code Review',
          description: 'Refactor semantic tags, verify mobile responsiveness, and check accessibility contrast.',
          dueDate: dayAfterStr,
          priority: 'low',
          completed: false,
          createdAt: new Date().toISOString()
        }
      ];
      this.saveTasks(sampleTasks);
    }

    if (existingGoals === null || existingGoals.length === 0) {
      const sampleGoals = [
        {
          id: 'goal_' + Date.now() + '_1',
          text: 'Complete 2 hours of focused deep work without phone distraction',
          completed: true,
          date: todayStr
        },
        {
          id: 'goal_' + Date.now() + '_2',
          text: 'Solve 3 algorithmic coding challenges',
          completed: false,
          date: todayStr
        },
        {
          id: 'goal_' + Date.now() + '_3',
          text: 'Read 20 pages of Computer Science fundamentals',
          completed: false,
          date: todayStr
        }
      ];
      this.saveGoals(sampleGoals);
    }
  }
};
