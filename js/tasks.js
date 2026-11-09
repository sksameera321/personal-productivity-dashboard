/**
 * Personal Productivity Dashboard - Tasks Module
 * Developer: Sameera Bhanu
 * Handles task state, CRUD operations, filtering, and searching.
 */

const TaskManager = {
  tasks: [],

  /**
   * Initialize tasks from storage
   */
  init() {
    this.tasks = Storage.getTasks() || [];
  },

  /**
   * Get all tasks
   */
  getAll() {
    return this.tasks;
  },

  /**
   * Find task by ID
   */
  getById(id) {
    return this.tasks.find(t => t.id === id);
  },

  /**
   * Create a new task
   */
  create(taskData) {
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: taskData.title.trim(),
      description: (taskData.description || '').trim(),
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      priority: taskData.priority || 'medium', // 'low' | 'medium' | 'high'
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(newTask);
    this.persist();
    return newTask;
  },

  /**
   * Update existing task
   */
  update(id, updatedData) {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      title: updatedData.title !== undefined ? updatedData.title.trim() : this.tasks[taskIndex].title,
      description: updatedData.description !== undefined ? updatedData.description.trim() : this.tasks[taskIndex].description,
      dueDate: updatedData.dueDate !== undefined ? updatedData.dueDate : this.tasks[taskIndex].dueDate,
      priority: updatedData.priority !== undefined ? updatedData.priority : this.tasks[taskIndex].priority,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.tasks[taskIndex];
  },

  /**
   * Delete task
   */
  delete(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const deleted = this.tasks.splice(index, 1)[0];
    this.persist();
    return deleted;
  },

  /**
   * Toggle completed status
   */
  toggleComplete(id) {
    const task = this.getById(id);
    if (!task) return null;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    this.persist();
    return task;
  },

  /**
   * Filter and search tasks
   * @param {string} filterType 'all' | 'pending' | 'completed'
   * @param {string} searchQuery Search query string
   * @param {string|null} selectedDate Optional date filter YYYY-MM-DD
   */
  filter(filterType = 'all', searchQuery = '', selectedDate = null) {
    let result = [...this.tasks];

    // Status filter
    if (filterType === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (filterType === 'completed') {
      result = result.filter(t => t.completed);
    }

    // Date filter (from weekly calendar schedule strip)
    if (selectedDate) {
      result = result.filter(t => t.dueDate === selectedDate);
    }

    // Search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Priority ordering weight: high -> medium -> low
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    result.sort((a, b) => {
      // Completed tasks sink to the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Sort by due date
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      // Then by priority weight
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });

    return result;
  },

  /**
   * Get tasks associated with a specific date
   */
  getByDate(dateString) {
    return this.tasks.filter(t => t.dueDate === dateString);
  },

  /**
   * Calculate task statistics
   */
  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, percentage };
  },

  /**
   * Persist changes to LocalStorage
   */
  persist() {
    Storage.saveTasks(this.tasks);
  }
};
