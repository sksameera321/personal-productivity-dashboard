/**
 * Personal Productivity Dashboard - Main Application Controller
 * Developer: Sameera Bhanu
 * Orchestrates rendering, user interactions, weekly calendar, and micro-animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize storage & models
  Storage.seedInitialDataIfEmpty();
  TaskManager.init();
  GoalManager.init();

  // App State
  const state = {
    currentFilter: 'all', // 'all' | 'pending' | 'completed'
    searchQuery: '',
    selectedDate: null,   // YYYY-MM-DD or null for all dates
    editingTaskId: null,
    deletingTaskId: null
  };

  // DOM Elements Cache
  const elements = {
    greetingTitle: document.getElementById('greeting-title'),
    currentDateDisplay: document.getElementById('current-date-display'),
    productivityHeadline: document.getElementById('productivity-headline'),
    metricTotal: document.getElementById('metric-total-tasks'),
    metricCompleted: document.getElementById('metric-completed-tasks'),
    metricPending: document.getElementById('metric-pending-tasks'),
    metricProgressPct: document.getElementById('metric-progress-pct'),
    progressCircleBar: document.getElementById('progress-circle-bar'),
    metricProgressStatus: document.getElementById('metric-progress-status'),
    
    weeklyStrip: document.getElementById('weekly-schedule-strip'),
    scheduleRangeText: document.getElementById('schedule-range-text'),
    clearDayFilterBtn: document.getElementById('clear-day-filter-btn'),
    
    taskListContainer: document.getElementById('task-list-container'),
    taskEmptyState: document.getElementById('task-empty-state'),
    filteredCountBadge: document.getElementById('filtered-task-count-badge'),
    filterButtons: document.querySelectorAll('.segment-btn'),
    activeDayBanner: document.getElementById('active-day-filter-banner'),
    filterBannerDate: document.getElementById('filter-banner-date'),
    bannerClearBtn: document.getElementById('banner-clear-btn'),
    
    searchInput: document.getElementById('task-search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    
    openNewTaskBtn: document.getElementById('open-new-task-btn'),
    emptyAddTaskBtn: document.getElementById('empty-add-task-btn'),
    
    // Task Modal
    taskModal: document.getElementById('task-modal'),
    taskModalForm: document.getElementById('task-modal-form'),
    modalTitle: document.getElementById('modal-title'),
    modalTaskId: document.getElementById('modal-task-id'),
    modalTaskTitle: document.getElementById('modal-task-title'),
    modalTaskDesc: document.getElementById('modal-task-desc'),
    modalTaskDate: document.getElementById('modal-task-date'),
    modalPriorityInputs: document.querySelectorAll('input[name="modal-priority"]'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    
    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteTaskTitlePreview: document.getElementById('delete-task-title-preview'),
    deleteModalClose: document.getElementById('delete-modal-close'),
    deleteModalCancel: document.getElementById('delete-modal-cancel'),
    deleteModalConfirm: document.getElementById('delete-modal-confirm'),
    
    // Goals
    addGoalForm: document.getElementById('add-goal-form'),
    newGoalInput: document.getElementById('new-goal-input'),
    goalsListContainer: document.getElementById('goals-list-container'),
    goalsProgressBadge: document.getElementById('goals-progress-badge'),
    goalProgressFill: document.getElementById('goal-progress-fill'),
    
    // Insights
    countHighPriority: document.getElementById('count-high-priority'),
    countMedPriority: document.getElementById('count-med-priority'),
    countLowPriority: document.getElementById('count-low-priority'),
    motivationalTipText: document.getElementById('motivational-tip-text'),
    
    // Toast
    toast: document.getElementById('toast-notification'),
    toastMessage: document.getElementById('toast-message')
  };

  /* ------------------------------------------------------------------------
     1. Date & Greeting Initialization
     ------------------------------------------------------------------------ */
  function initHeaderDate() {
    const now = new Date();
    const hours = now.getHours();
    
    // Dynamic Greeting
    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) {
      greeting = 'Good afternoon';
    } else if (hours >= 17 || hours < 5) {
      greeting = 'Good evening';
    }
    elements.greetingTitle.textContent = `${greeting}, Sameera`;

    // Formatted Date (e.g., Monday, November 9, 2026)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }

  /* ------------------------------------------------------------------------
     2. Weekly Schedule Strip Generator
     ------------------------------------------------------------------------ */
  function renderWeeklySchedule() {
    const now = new Date();
    // Find Monday of the current week
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }

    // Format week range text (e.g. Nov 9 – Nov 15)
    const startMonth = weekDays[0].toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekDays[6].toLocaleDateString('en-US', { month: 'short' });
    const rangeText = `${startMonth} ${weekDays[0].getDate()} &ndash; ${endMonth} ${weekDays[6].getDate()}`;
    elements.scheduleRangeText.innerHTML = `Week of ${rangeText}`;

    elements.weeklyStrip.innerHTML = '';
    const todayStr = now.toISOString().split('T')[0];

    weekDays.forEach(dateObj => {
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dateObj.getDate();
      const isToday = dateStr === todayStr;
      const isSelected = state.selectedDate === dateStr;

      // Count tasks on this day
      const dayTasks = TaskManager.getByDate(dateStr);
      const totalDayTasks = dayTasks.length;
      const completedDayTasks = dayTasks.filter(t => t.completed).length;

      const cell = document.createElement('div');
      cell.className = `day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`;
      cell.setAttribute('role', 'tab');
      cell.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      cell.setAttribute('tabindex', '0');

      // Task indicators dots
      let dotsHtml = '';
      if (totalDayTasks > 0) {
        const dotClass = completedDayTasks === totalDayTasks ? 'dot-done' : 'dot-active';
        dotsHtml = `<span class="day-dot ${dotClass}" title="${totalDayTasks} task(s)"></span>`;
      }

      cell.innerHTML = `
        <span class="day-name">${dayName}</span>
        <span class="day-number">${dayNum}</span>
        <div class="day-dots">${dotsHtml}</div>
      `;

      // Click to filter by this day
      cell.addEventListener('click', () => {
        if (state.selectedDate === dateStr) {
          // Toggle off
          state.selectedDate = null;
        } else {
          state.selectedDate = dateStr;
        }
        renderWeeklySchedule();
        renderTasks();
      });

      // Keyboard support (Enter or Space)
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cell.click();
        }
      });

      elements.weeklyStrip.appendChild(cell);
    });

    // Toggle Clear Day Filter Button
    if (state.selectedDate) {
      elements.clearDayFilterBtn.style.display = 'inline-flex';
      elements.activeDayBanner.style.display = 'flex';
      const parsed = new Date(state.selectedDate + 'T00:00:00');
      elements.filterBannerDate.textContent = parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      elements.clearDayFilterBtn.style.display = 'none';
      elements.activeDayBanner.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------------
     3. Tasks Rendering & Filtering
     ------------------------------------------------------------------------ */
  function renderTasks() {
    const filteredTasks = TaskManager.filter(state.currentFilter, state.searchQuery, state.selectedDate);
    elements.filteredCountBadge.textContent = filteredTasks.length;

    elements.taskListContainer.innerHTML = '';

    if (filteredTasks.length === 0) {
      elements.taskEmptyState.style.display = 'flex';
    } else {
      elements.taskEmptyState.style.display = 'none';

      filteredTasks.forEach(task => {
        const item = createTaskElement(task);
        elements.taskListContainer.appendChild(item);
      });
    }

    updateOverviewMetrics();
    updateProductivityInsights();
  }

  function createTaskElement(task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'is-completed' : ''}`;
    item.id = `task-el-${task.id}`;
    item.setAttribute('role', 'listitem');

    // Date formatting & overdue check
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = !task.completed && task.dueDate < todayStr;
    const taskDateObj = new Date(task.dueDate + 'T00:00:00');
    const formattedDate = taskDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    item.innerHTML = `
      <div class="custom-checkbox-wrapper" role="checkbox" aria-checked="${task.completed}" tabindex="0" title="Mark as ${task.completed ? 'pending' : 'completed'}">
        <div class="checkbox-visual">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <div class="task-details">
        <h4 class="task-title">${escapeHTML(task.title)}</h4>
        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="task-date-pill ${isOverdue ? 'is-overdue' : ''}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${isOverdue ? 'Overdue &bull; ' : ''}${formattedDate}</span>
          </span>

          <span class="task-priority-pill priority-${task.priority}">
            ${capitalize(task.priority)}
          </span>
        </div>
      </div>

      <div class="task-actions">
        <button class="action-icon-btn edit-btn" title="Edit task" aria-label="Edit task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-icon-btn delete-btn" title="Delete task" aria-label="Delete task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Event: Toggle complete
    const checkbox = item.querySelector('.custom-checkbox-wrapper');
    const toggleHandler = () => {
      const updated = TaskManager.toggleComplete(task.id);
      if (updated) {
        showToast(updated.completed ? 'Task marked as completed' : 'Task marked as pending');
        renderTasks();
        renderWeeklySchedule();
      }
    };
    checkbox.addEventListener('click', toggleHandler);
    checkbox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleHandler();
      }
    });

    // Event: Edit task
    const editBtn = item.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task);
    });

    // Event: Delete task
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(task);
    });

    return item;
  }

  /* ------------------------------------------------------------------------
     4. Overview Metrics & Circular Gauge
     ------------------------------------------------------------------------ */
  function updateOverviewMetrics() {
    const stats = TaskManager.getStats();

    elements.metricTotal.textContent = stats.total;
    elements.metricCompleted.textContent = stats.completed;
    elements.metricPending.textContent = stats.pending;

    // Update circular SVG progress indicator
    // Circumference of r=23 is 2 * PI * 23 = 144.51
    const circumference = 144.51;
    elements.progressCircleBar.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (stats.percentage / 100) * circumference;
    elements.progressCircleBar.style.strokeDashoffset = offset;
    elements.metricProgressPct.textContent = `${stats.percentage}%`;

    // Status text & headline
    if (stats.percentage === 100 && stats.total > 0) {
      elements.metricProgressStatus.textContent = 'Completed!';
      elements.metricProgressStatus.style.color = 'var(--accent-green)';
      elements.productivityHeadline.innerHTML = `All <strong>${stats.total} tasks</strong> completed today! Fantastic accomplishment.`;
    } else if (stats.percentage >= 50) {
      elements.metricProgressStatus.textContent = 'Great progress';
      elements.metricProgressStatus.style.color = 'var(--accent-blue)';
      elements.productivityHeadline.innerHTML = `You have completed <strong>${stats.completed} of ${stats.total} tasks</strong>. You are more than halfway there!`;
    } else {
      elements.metricProgressStatus.textContent = 'In progress';
      elements.metricProgressStatus.style.color = 'var(--accent-blue)';
      elements.productivityHeadline.innerHTML = `You have <strong>${stats.pending} pending tasks</strong> remaining. Let's focus and get them done!`;
    }
  }

  /* ------------------------------------------------------------------------
     5. Productivity Insights & Tip
     ------------------------------------------------------------------------ */
  function updateProductivityInsights() {
    const allTasks = TaskManager.getAll();
    let high = 0, med = 0, low = 0;

    allTasks.forEach(t => {
      if (!t.completed) {
        if (t.priority === 'high') high++;
        else if (t.priority === 'medium') med++;
        else if (t.priority === 'low') low++;
      }
    });

    elements.countHighPriority.textContent = high;
    elements.countMedPriority.textContent = med;
    elements.countLowPriority.textContent = low;

    // Smart motivational insight based on context
    const stats = TaskManager.getStats();
    if (high > 2) {
      elements.motivationalTipText.textContent = `"You have ${high} high-priority tasks pending. Prioritize the most critical one first to build clear momentum."`;
    } else if (stats.completed >= 3) {
      elements.motivationalTipText.textContent = `"Superb focus! Consistency is the quiet engine of high academic and software craftsmanship."`;
    } else {
      elements.motivationalTipText.textContent = `"Break larger engineering objectives into small, manageable tasks to maintain a clear flow state."`;
    }
  }

  /* ------------------------------------------------------------------------
     6. Daily Goals Controller
     ------------------------------------------------------------------------ */
  function renderGoals() {
    const goals = GoalManager.getAll();
    const progress = GoalManager.getProgress();

    elements.goalsProgressBadge.textContent = `${progress.completed}/${progress.total}`;
    elements.goalProgressFill.style.width = `${progress.percentage}%`;

    elements.goalsListContainer.innerHTML = '';

    if (goals.length === 0) {
      elements.goalsListContainer.innerHTML = `
        <p style="font-size: 0.82rem; color: var(--text-tertiary); text-align: center; padding: 0.75rem 0;">
          No daily goals yet. Add one above to set your intention for today!
        </p>
      `;
      return;
    }

    goals.forEach(goal => {
      const item = document.createElement('div');
      item.className = `goal-item ${goal.completed ? 'is-done' : ''}`;
      item.setAttribute('role', 'listitem');

      item.innerHTML = `
        <div class="goal-left" role="checkbox" aria-checked="${goal.completed}" tabindex="0">
          <div class="checkbox-visual">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="goal-text">${escapeHTML(goal.text)}</span>
        </div>
        <button class="goal-delete-btn" title="Delete goal" aria-label="Delete goal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Toggle goal
      const left = item.querySelector('.goal-left');
      const toggleGoalHandler = () => {
        GoalManager.toggle(goal.id);
        renderGoals();
        showToast(goal.completed ? 'Goal completed!' : 'Goal marked pending');
      };
      left.addEventListener('click', toggleGoalHandler);
      left.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleGoalHandler();
        }
      });

      // Delete goal
      const delBtn = item.querySelector('.goal-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        GoalManager.delete(goal.id);
        renderGoals();
        showToast('Goal deleted');
      });

      elements.goalsListContainer.appendChild(item);
    });
  }

  // Handle Add Goal Form Submit
  elements.addGoalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elements.newGoalInput.value;
    if (text.trim()) {
      GoalManager.add(text);
      elements.newGoalInput.value = '';
      renderGoals();
      showToast('Daily goal added');
    }
  });

  /* ------------------------------------------------------------------------
     7. Task Modal (Create & Edit)
     ------------------------------------------------------------------------ */
  function openCreateModal() {
    state.editingTaskId = null;
    elements.modalTitle.textContent = 'Create New Task';
    elements.modalTaskId.value = '';
    elements.modalTaskTitle.value = '';
    elements.modalTaskDesc.value = '';
    
    // Default due date: selected date or today
    const defaultDate = state.selectedDate || new Date().toISOString().split('T')[0];
    elements.modalTaskDate.value = defaultDate;

    // Reset priority to medium
    elements.modalPriorityInputs.forEach(input => {
      input.checked = input.value === 'medium';
    });

    elements.taskModal.classList.add('is-open');
    elements.taskModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => elements.modalTaskTitle.focus(), 150);
  }

  function openEditModal(task) {
    state.editingTaskId = task.id;
    elements.modalTitle.textContent = 'Edit Task';
    elements.modalTaskId.value = task.id;
    elements.modalTaskTitle.value = task.title;
    elements.modalTaskDesc.value = task.description || '';
    elements.modalTaskDate.value = task.dueDate;

    elements.modalPriorityInputs.forEach(input => {
      input.checked = input.value === task.priority;
    });

    elements.taskModal.classList.add('is-open');
    elements.taskModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => elements.modalTaskTitle.focus(), 150);
  }

  function closeModal() {
    elements.taskModal.classList.remove('is-open');
    elements.taskModal.setAttribute('aria-hidden', 'true');
    state.editingTaskId = null;
  }

  elements.openNewTaskBtn.addEventListener('click', openCreateModal);
  elements.emptyAddTaskBtn.addEventListener('click', openCreateModal);
  elements.modalCloseBtn.addEventListener('click', closeModal);
  elements.modalCancelBtn.addEventListener('click', closeModal);

  // Close modal on backdrop click
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) {
      closeModal();
    }
  });

  // Handle Task Form Submit
  elements.taskModalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = elements.modalTaskTitle.value.trim();
    const description = elements.modalTaskDesc.value.trim();
    const dueDate = elements.modalTaskDate.value;
    
    let priority = 'medium';
    elements.modalPriorityInputs.forEach(input => {
      if (input.checked) priority = input.value;
    });

    if (!title) {
      elements.modalTaskTitle.focus();
      return;
    }

    if (state.editingTaskId) {
      // Edit mode
      TaskManager.update(state.editingTaskId, {
        title,
        description,
        dueDate,
        priority
      });
      showToast('Task updated successfully');
    } else {
      // Create mode
      TaskManager.create({
        title,
        description,
        dueDate,
        priority
      });
      showToast('New task created');
    }

    closeModal();
    renderTasks();
    renderWeeklySchedule();
  });

  /* ------------------------------------------------------------------------
     8. Delete Task Confirmation Modal
     ------------------------------------------------------------------------ */
  function openDeleteModal(task) {
    state.deletingTaskId = task.id;
    elements.deleteTaskTitlePreview.textContent = task.title;
    elements.deleteModal.classList.add('is-open');
    elements.deleteModal.setAttribute('aria-hidden', 'false');
    elements.deleteModalConfirm.focus();
  }

  function closeDeleteModal() {
    elements.deleteModal.classList.remove('is-open');
    elements.deleteModal.setAttribute('aria-hidden', 'true');
    state.deletingTaskId = null;
  }

  elements.deleteModalClose.addEventListener('click', closeDeleteModal);
  elements.deleteModalCancel.addEventListener('click', closeDeleteModal);
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  elements.deleteModalConfirm.addEventListener('click', () => {
    if (state.deletingTaskId) {
      TaskManager.delete(state.deletingTaskId);
      closeDeleteModal();
      renderTasks();
      renderWeeklySchedule();
      showToast('Task deleted');
    }
  });

  /* ------------------------------------------------------------------------
     9. Global Search & Filter Controls
     ------------------------------------------------------------------------ */
  // Status filter buttons
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      state.currentFilter = btn.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Search input handler
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    elements.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderTasks();
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.searchClearBtn.style.display = 'none';
    renderTasks();
    elements.searchInput.focus();
  });

  // Clear day filter
  elements.clearDayFilterBtn.addEventListener('click', () => {
    state.selectedDate = null;
    renderWeeklySchedule();
    renderTasks();
  });

  elements.bannerClearBtn.addEventListener('click', () => {
    state.selectedDate = null;
    renderWeeklySchedule();
    renderTasks();
  });

  // Global Keyboard shortcuts (Escape key closes modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.taskModal.classList.contains('is-open')) {
        closeModal();
      }
      if (elements.deleteModal.classList.contains('is-open')) {
        closeDeleteModal();
      }
    }
  });

  /* ------------------------------------------------------------------------
     10. Non-intrusive Toast Notifications
     ------------------------------------------------------------------------ */
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);

    elements.toastMessage.textContent = message;
    elements.toast.classList.add('is-visible');

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('is-visible');
    }, 2800);
  }

  /* ------------------------------------------------------------------------
     11. Utilities
     ------------------------------------------------------------------------ */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /* ------------------------------------------------------------------------
     12. Initial Application Boot
     ------------------------------------------------------------------------ */
  initHeaderDate();
  renderWeeklySchedule();
  renderTasks();
  renderGoals();
});
