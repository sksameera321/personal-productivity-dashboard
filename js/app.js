/**
 * Capitalio FocusFlow — Application Controller
 * Inspired by Capitalio Wealth Management Dashboard (Watermelon UI)
 * Developer: Sameera Bhanu | B.Tech CSE (First Year)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Storage & Domain Managers
  Storage.seedInitialDataIfEmpty();
  TaskManager.init();
  GoalManager.init();

  // 2. State Management
  const state = {
    currentFilter: 'all',      // 'all' | 'pending' | 'completed'
    searchQuery: '',
    selectedDate: null,        // YYYY-MM-DD or null
    selectedPeriod: 'week',    // 'week' | 'month' | 'all'
    theme: localStorage.getItem('ppd_theme') || 'light',
    editingTaskId: null,
    deletingTaskId: null
  };

  // Apply Theme Immediately
  document.documentElement.setAttribute('data-theme', state.theme);

  // 3. Cache DOM Elements
  const el = {
    greetingTitle: document.getElementById('greeting-title'),
    lastUpdatedClock: document.getElementById('last-updated-clock'),
    dateRangeText: document.getElementById('date-range-text'),
    
    // Top Summary Metrics
    metricTotal: document.getElementById('metric-total-tasks'),
    metricCompleted: document.getElementById('metric-completed-tasks'),
    metricCompletedPctSub: document.getElementById('metric-completed-pct-sub'),
    metricPending: document.getElementById('metric-pending-tasks'),
    metricHighPriorityCount: document.getElementById('metric-high-priority-count'),
    metricProgressPct: document.getElementById('metric-progress-pct'),
    metricProgressStatus: document.getElementById('metric-progress-status'),
    metricGoalsRatioSub: document.getElementById('metric-goals-ratio-sub'),
    metricTopProgressBar: document.getElementById('metric-top-progress-bar'),

    // Sidebar & Navigation
    sidebar: document.getElementById('app-sidebar'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    sidebarPendingCount: document.getElementById('sidebar-pending-count'),
    sidebarGoalsCount: document.getElementById('sidebar-goals-count'),
    sidebarThemeToggle: document.getElementById('sidebar-theme-toggle'),
    topbarThemeToggle: document.getElementById('topbar-theme-toggle'),
    navLinks: document.querySelectorAll('.nav-link'),

    // Velocity & Weekly Schedule Strip
    weeklyStrip: document.getElementById('weekly-schedule-strip'),
    clearDayFilterBtn: document.getElementById('clear-day-filter-btn'),
    velocityAreaChart: document.getElementById('velocity-area-chart'),
    kpiCompletedVelocity: document.getElementById('kpi-completed-velocity'),
    kpiFocusHours: document.getElementById('kpi-focus-hours'),
    kpiStreakDays: document.getElementById('kpi-streak-days'),
    kpiGoalRatio: document.getElementById('kpi-goal-ratio'),

    // Donut Allocation Panel
    allocationDonutSvg: document.getElementById('allocation-donut-svg'),
    donutCenterTotal: document.getElementById('donut-center-total'),
    allocHighVal: document.getElementById('alloc-high-val'),
    allocMedVal: document.getElementById('alloc-med-val'),
    allocLowVal: document.getElementById('alloc-low-val'),
    allocDoneVal: document.getElementById('alloc-done-val'),

    // Tasks Holdings Table
    tasksTableBody: document.getElementById('tasks-table-body'),
    taskEmptyState: document.getElementById('task-empty-state'),
    filteredCountBadge: document.getElementById('filtered-task-count-badge'),
    filterSegButtons: document.querySelectorAll('.filter-seg-btn'),
    activeDayBanner: document.getElementById('active-day-filter-banner'),
    filterBannerDate: document.getElementById('filter-banner-date'),
    bannerClearBtn: document.getElementById('banner-clear-btn'),
    
    // Search
    searchInput: document.getElementById('task-search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    
    // Period Selectors
    periodButtons: document.querySelectorAll('.period-btn'),

    // Modals
    openNewTaskBtn: document.getElementById('open-new-task-btn'),
    emptyAddTaskBtn: document.getElementById('empty-add-task-btn'),
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

    deleteModal: document.getElementById('delete-modal'),
    deleteTaskTitlePreview: document.getElementById('delete-task-title-preview'),
    deleteModalClose: document.getElementById('delete-modal-close'),
    deleteModalCancel: document.getElementById('delete-modal-cancel'),
    deleteModalConfirm: document.getElementById('delete-modal-confirm'),

    // Daily Goals
    addGoalForm: document.getElementById('add-goal-form'),
    newGoalInput: document.getElementById('new-goal-input'),
    goalsListContainer: document.getElementById('goals-list-container'),
    goalsProgressBadge: document.getElementById('goals-progress-badge'),
    goalProgressFill: document.getElementById('goal-progress-fill'),

    // Smart Insights
    insightTitle1: document.getElementById('insight-title-1'),
    insightDesc1: document.getElementById('insight-desc-1'),

    // Toast
    toast: document.getElementById('toast-notification'),
    toastMessage: document.getElementById('toast-message')
  };

  /* ------------------------------------------------------------------------
     1. Date & Realtime Clock Header
     ------------------------------------------------------------------------ */
  function updateHeaderDate() {
    const now = new Date();
    const hours = now.getHours();

    // Contextual Greeting
    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) greeting = 'Good afternoon';
    else if (hours >= 17 || hours < 5) greeting = 'Good evening';
    el.greetingTitle.textContent = `${greeting}, Sameera — Overview`;

    // Last updated string
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    el.lastUpdatedClock.textContent = `Last updated today at ${timeStr}`;
  }

  /* ------------------------------------------------------------------------
     2. Theme Switcher (Capitalio Dark / Light)
     ------------------------------------------------------------------------ */
  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('ppd_theme', state.theme);
    showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`);
    renderVelocityChart(); // Redraw chart colors
  }

  if (el.sidebarThemeToggle) el.sidebarThemeToggle.addEventListener('click', toggleTheme);
  if (el.topbarThemeToggle) el.topbarThemeToggle.addEventListener('click', toggleTheme);

  // Mobile Menu Toggle
  if (el.mobileMenuBtn) {
    el.mobileMenuBtn.addEventListener('click', () => {
      el.sidebar.classList.toggle('is-mobile-open');
    });
  }

  // Close mobile sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (el.sidebar && el.sidebar.classList.contains('is-mobile-open')) {
      if (!el.sidebar.contains(e.target) && !el.mobileMenuBtn.contains(e.target)) {
        el.sidebar.classList.remove('is-mobile-open');
      }
    }
  });

  /* ------------------------------------------------------------------------
     3. Weekly Schedule Strip Generator
     ------------------------------------------------------------------------ */
  function renderWeeklySchedule() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 Sunday, 1 Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }

    // Date range text (e.g. Nov 9 – Nov 15)
    const mStart = weekDays[0].toLocaleDateString('en-US', { month: 'short' });
    const mEnd = weekDays[6].toLocaleDateString('en-US', { month: 'short' });
    el.dateRangeText.textContent = `${mStart} ${weekDays[0].getDate()} – ${mEnd} ${weekDays[6].getDate()}`;

    el.weeklyStrip.innerHTML = '';
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

      const chip = document.createElement('div');
      chip.className = `day-chip ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`;
      chip.setAttribute('role', 'tab');
      chip.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      chip.setAttribute('tabindex', '0');

      let dotHtml = '';
      if (totalDayTasks > 0) {
        dotHtml = `<span class="day-chip-dot" title="${totalDayTasks} task(s)"></span>`;
      }

      chip.innerHTML = `
        <span class="day-chip-name">${dayName}</span>
        <span class="day-chip-num">${dayNum}</span>
        ${dotHtml}
      `;

      chip.addEventListener('click', () => {
        if (state.selectedDate === dateStr) {
          state.selectedDate = null;
        } else {
          state.selectedDate = dateStr;
        }
        renderWeeklySchedule();
        renderTasks();
      });

      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          chip.click();
        }
      });

      el.weeklyStrip.appendChild(chip);
    });

    if (state.selectedDate) {
      el.clearDayFilterBtn.style.display = 'inline-flex';
      el.activeDayBanner.style.display = 'flex';
      const parsed = new Date(state.selectedDate + 'T00:00:00');
      el.filterBannerDate.textContent = parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      el.clearDayFilterBtn.style.display = 'none';
      el.activeDayBanner.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------------
     4. Capitalio SVG Velocity Area Chart Generator
     ------------------------------------------------------------------------ */
  function renderVelocityChart() {
    const allTasks = TaskManager.getAll();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    // Collect daily task counts across the 7 days
    const daysData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const count = allTasks.filter(t => t.dueDate === dStr).length;
      const completed = allTasks.filter(t => t.dueDate === dStr && t.completed).length;
      daysData.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: Math.max(count, 1), // baseline 1 for visual aesthetics
        completed: completed
      });
    }

    const svgWidth = 700;
    const svgHeight = 220;
    const paddingX = 40;
    const paddingY = 30;

    const maxVal = Math.max(...daysData.map(d => d.count), 4);
    const stepX = (svgWidth - paddingX * 2) / (daysData.length - 1);

    // Compute point coordinates
    const points = daysData.map((d, i) => {
      const x = paddingX + i * stepX;
      const y = (svgHeight - paddingY) - (d.count / maxVal) * (svgHeight - paddingY * 2);
      return { x, y, ...d };
    });

    // Build smooth cubic bezier curve
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    // Area closed path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

    const isDark = state.theme === 'dark';
    const strokeColor = '#2563EB';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#A1A1AA' : '#71717A';

    let gridLines = '';
    for (let y = paddingY; y <= svgHeight - paddingY; y += (svgHeight - paddingY * 2) / 3) {
      gridLines += `<line x1="${paddingX}" y1="${y}" x2="${svgWidth - paddingX}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
    }

    let labelsHtml = '';
    let circlesHtml = '';
    points.forEach((p) => {
      labelsHtml += `<text x="${p.x}" y="${svgHeight - 8}" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="500">${p.label}</text>`;
      circlesHtml += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2.5" />
      `;
    });

    el.velocityAreaChart.innerHTML = `
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563EB" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#2563EB" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaD}" fill="url(#areaGradient)" />
      <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${circlesHtml}
      ${labelsHtml}
    `;
  }

  /* ------------------------------------------------------------------------
     5. Capitalio Priority Allocation Donut Chart Generator
     ------------------------------------------------------------------------ */
  function renderAllocationDonut() {
    const all = TaskManager.getAll();
    const total = all.length;

    let high = 0, med = 0, low = 0, done = 0;
    all.forEach(t => {
      if (t.completed) done++;
      else if (t.priority === 'high') high++;
      else if (t.priority === 'medium') med++;
      else if (t.priority === 'low') low++;
    });

    el.donutCenterTotal.textContent = total;

    // Percentages
    const calcPct = (cnt) => total > 0 ? Math.round((cnt / total) * 100) : 0;
    const highPct = calcPct(high);
    const medPct = calcPct(med);
    const lowPct = calcPct(low);
    const donePct = calcPct(done);

    el.allocHighVal.textContent = `${high} (${highPct}%)`;
    el.allocMedVal.textContent = `${med} (${medPct}%)`;
    el.allocLowVal.textContent = `${low} (${lowPct}%)`;
    el.allocDoneVal.textContent = `${done} (${donePct}%)`;

    // SVG Donut generation: radius = 38, circumference = 2 * PI * 38 = 238.76
    const C = 238.76;
    const radius = 38;
    const cx = 50;
    const cy = 50;

    if (total === 0) {
      el.allocationDonutSvg.innerHTML = `
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--border)" stroke-width="9" />
      `;
      return;
    }

    const segments = [
      { color: '#E10B05', pct: highPct },
      { color: '#FF7A00', pct: medPct },
      { color: '#7466F6', pct: lowPct },
      { color: '#00DA92', pct: donePct }
    ];

    let currentOffset = 0;
    let svgPaths = '';

    segments.forEach(seg => {
      if (seg.pct <= 0) return;
      const strokeLen = (seg.pct / 100) * C;
      svgPaths += `
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
          stroke="${seg.color}" stroke-width="9"
          stroke-dasharray="${strokeLen} ${C - strokeLen}"
          stroke-dashoffset="${-currentOffset}"
        />
      `;
      currentOffset += strokeLen;
    });

    el.allocationDonutSvg.innerHTML = svgPaths;
  }

  /* ------------------------------------------------------------------------
     6. Tasks Holdings Table Rendering
     ------------------------------------------------------------------------ */
  function renderTasks() {
    const filteredTasks = TaskManager.filter(state.currentFilter, state.searchQuery, state.selectedDate);
    el.filteredCountBadge.textContent = `${filteredTasks.length} Tasks`;
    el.sidebarPendingCount.textContent = TaskManager.getAll().filter(t => !t.completed).length;

    el.tasksTableBody.innerHTML = '';

    if (filteredTasks.length === 0) {
      el.taskEmptyState.style.display = 'flex';
      el.tasksTableBody.parentElement.style.display = 'none';
    } else {
      el.taskEmptyState.style.display = 'none';
      el.tasksTableBody.parentElement.style.display = 'table';

      filteredTasks.forEach((task, index) => {
        const row = createTaskRow(task, index + 1);
        el.tasksTableBody.appendChild(row);
      });
    }

    updateOverviewMetrics();
    renderVelocityChart();
    renderAllocationDonut();
  }

  function createTaskRow(task, rowNum) {
    const tr = document.createElement('tr');
    tr.className = `task-row ${task.completed ? 'is-completed' : ''}`;
    tr.id = `task-row-${task.id}`;

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = !task.completed && task.dueDate < todayStr;
    const dateObj = new Date(task.dueDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Category icon based on priority or content
    let iconSvg = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    `;
    if (task.priority === 'high') {
      iconSvg = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E10B05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `;
    }

    tr.innerHTML = `
      <td class="task-num-cell">#0${rowNum}</td>
      <td>
        <div class="task-asset-cell">
          <div class="task-type-icon">
            ${iconSvg}
          </div>
          <div class="task-title-group">
            <span class="task-item-title">${escapeHTML(task.title)}</span>
            <span class="task-item-desc">${task.description ? escapeHTML(task.description) : 'Academic objective'}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="date-pill ${isOverdue ? 'overdue' : ''}">
          ${isOverdue ? 'Overdue &bull; ' : ''}${formattedDate}
        </span>
      </td>
      <td>
        <span class="priority-pill priority-${task.priority}">
          ${capitalize(task.priority)}
        </span>
      </td>
      <td style="text-align: center;">
        <div class="task-check-box" role="checkbox" aria-checked="${task.completed}" tabindex="0" title="Toggle status">
          ${task.completed ? `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </div>
      </td>
      <td class="row-actions-cell">
        <button class="action-btn-icon edit-btn" title="Edit task" aria-label="Edit task">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-btn-icon delete-btn delete" title="Delete task" aria-label="Delete task">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;

    // Toggle Complete Handler
    const checkBtn = tr.querySelector('.task-check-box');
    const toggleHandler = () => {
      const updated = TaskManager.toggleComplete(task.id);
      if (updated) {
        showToast(updated.completed ? 'Task completed' : 'Task pending');
        renderTasks();
        renderWeeklySchedule();
      }
    };
    checkBtn.addEventListener('click', toggleHandler);
    checkBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleHandler();
      }
    });

    // Edit Handler
    tr.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task);
    });

    // Delete Handler
    tr.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(task);
    });

    return tr;
  }

  /* ------------------------------------------------------------------------
     7. Summary Metrics Updater
     ------------------------------------------------------------------------ */
  function updateOverviewMetrics() {
    const stats = TaskManager.getStats();
    const all = TaskManager.getAll();

    el.metricTotal.textContent = stats.total;
    el.metricCompleted.textContent = stats.completed;
    el.metricCompletedPctSub.textContent = `${stats.percentage}%`;
    el.metricPending.textContent = stats.pending;

    const highCount = all.filter(t => !t.completed && t.priority === 'high').length;
    el.metricHighPriorityCount.textContent = highCount;

    // Daily Goals ratio
    const goalProg = GoalManager.getProgress();
    el.metricProgressPct.textContent = `${stats.percentage}%`;
    el.metricGoalsRatioSub.textContent = `(${goalProg.completed}/${goalProg.total} Goals)`;
    el.metricTopProgressBar.style.width = `${stats.percentage}%`;

    if (stats.percentage === 100 && stats.total > 0) {
      el.metricProgressStatus.textContent = 'Completed!';
      el.metricProgressStatus.className = 'trend-positive';
    } else if (stats.percentage >= 50) {
      el.metricProgressStatus.textContent = 'High Velocity';
      el.metricProgressStatus.className = 'trend-positive';
    } else {
      el.metricProgressStatus.textContent = 'In Progress';
      el.metricProgressStatus.className = 'trend-amber';
    }

    // Dynamic Insight adaptation
    if (highCount > 1) {
      el.insightTitle1.textContent = 'Focus on Critical High-Priority';
      el.insightDesc1.textContent = `You have ${highCount} high-priority assignments pending. Tackling these first creates compound momentum.`;
    } else {
      el.insightTitle1.textContent = 'Optimal Schedule Balance';
      el.insightDesc1.textContent = 'Workload is distributed smoothly across priorities. Continue with your scheduled study blocks.';
    }
  }

  /* ------------------------------------------------------------------------
     8. Daily Goals Manager
     ------------------------------------------------------------------------ */
  function renderGoals() {
    const goals = GoalManager.getAll();
    const progress = GoalManager.getProgress();

    el.goalsProgressBadge.textContent = `${progress.completed}/${progress.total}`;
    el.sidebarGoalsCount.textContent = `${progress.completed}/${progress.total}`;
    el.goalProgressFill.style.width = `${progress.percentage}%`;

    el.goalsListContainer.innerHTML = '';

    if (goals.length === 0) {
      el.goalsListContainer.innerHTML = `
        <p style="font-size: 0.78rem; color: var(--muted-foreground); text-align: center; padding: 0.75rem 0;">
          No daily goals recorded. Add a personal focus target above!
        </p>
      `;
      return;
    }

    goals.forEach(goal => {
      const item = document.createElement('div');
      item.className = `goal-row ${goal.completed ? 'is-done' : ''}`;
      item.setAttribute('role', 'listitem');

      item.innerHTML = `
        <div class="goal-left-side" role="checkbox" aria-checked="${goal.completed}" tabindex="0">
          <div class="goal-checkbox">
            ${goal.completed ? `
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ` : ''}
          </div>
          <span class="goal-text-content">${escapeHTML(goal.text)}</span>
        </div>
        <button class="goal-del-btn" title="Delete goal" aria-label="Delete goal">&times;</button>
      `;

      // Toggle goal
      const left = item.querySelector('.goal-left-side');
      const toggleGoal = () => {
        GoalManager.toggle(goal.id);
        renderGoals();
        updateOverviewMetrics();
        showToast(goal.completed ? 'Goal completed!' : 'Goal pending');
      };
      left.addEventListener('click', toggleGoal);
      left.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleGoal();
        }
      });

      // Delete goal
      item.querySelector('.goal-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        GoalManager.delete(goal.id);
        renderGoals();
        updateOverviewMetrics();
        showToast('Goal deleted');
      });

      el.goalsListContainer.appendChild(item);
    });
  }

  el.addGoalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = el.newGoalInput.value;
    if (text && text.trim()) {
      GoalManager.add(text);
      el.newGoalInput.value = '';
      renderGoals();
      updateOverviewMetrics();
      showToast('New daily goal added');
    }
  });

  /* ------------------------------------------------------------------------
     9. Task Modal Dialogs (Create & Edit)
     ------------------------------------------------------------------------ */
  function openCreateModal() {
    state.editingTaskId = null;
    el.modalTitle.textContent = 'Create New Task';
    el.modalTaskId.value = '';
    el.modalTaskTitle.value = '';
    el.modalTaskDesc.value = '';

    const defaultDate = state.selectedDate || new Date().toISOString().split('T')[0];
    el.modalTaskDate.value = defaultDate;

    el.modalPriorityInputs.forEach(input => {
      input.checked = input.value === 'medium';
    });

    el.taskModal.classList.add('is-open');
    el.taskModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.modalTaskTitle.focus(), 150);
  }

  function openEditModal(task) {
    state.editingTaskId = task.id;
    el.modalTitle.textContent = 'Edit Task';
    el.modalTaskId.value = task.id;
    el.modalTaskTitle.value = task.title;
    el.modalTaskDesc.value = task.description || '';
    el.modalTaskDate.value = task.dueDate;

    el.modalPriorityInputs.forEach(input => {
      input.checked = input.value === task.priority;
    });

    el.taskModal.classList.add('is-open');
    el.taskModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.modalTaskTitle.focus(), 150);
  }

  function closeModal() {
    el.taskModal.classList.remove('is-open');
    el.taskModal.setAttribute('aria-hidden', 'true');
    state.editingTaskId = null;
  }

  el.openNewTaskBtn.addEventListener('click', openCreateModal);
  el.emptyAddTaskBtn.addEventListener('click', openCreateModal);
  el.modalCloseBtn.addEventListener('click', closeModal);
  el.modalCancelBtn.addEventListener('click', closeModal);

  el.taskModal.addEventListener('click', (e) => {
    if (e.target === el.taskModal) closeModal();
  });

  el.taskModalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = el.modalTaskTitle.value.trim();
    const description = el.modalTaskDesc.value.trim();
    const dueDate = el.modalTaskDate.value;

    let priority = 'medium';
    el.modalPriorityInputs.forEach(input => {
      if (input.checked) priority = input.value;
    });

    if (!title) return;

    if (state.editingTaskId) {
      TaskManager.update(state.editingTaskId, { title, description, dueDate, priority });
      showToast('Task updated successfully');
    } else {
      TaskManager.create({ title, description, dueDate, priority });
      showToast('New task created');
    }

    closeModal();
    renderTasks();
    renderWeeklySchedule();
  });

  /* ------------------------------------------------------------------------
     10. Delete Confirmation Modal
     ------------------------------------------------------------------------ */
  function openDeleteModal(task) {
    state.deletingTaskId = task.id;
    el.deleteTaskTitlePreview.textContent = task.title;
    el.deleteModal.classList.add('is-open');
    el.deleteModal.setAttribute('aria-hidden', 'false');
    el.deleteModalConfirm.focus();
  }

  function closeDeleteModal() {
    el.deleteModal.classList.remove('is-open');
    el.deleteModal.setAttribute('aria-hidden', 'true');
    state.deletingTaskId = null;
  }

  el.deleteModalClose.addEventListener('click', closeDeleteModal);
  el.deleteModalCancel.addEventListener('click', closeDeleteModal);
  el.deleteModal.addEventListener('click', (e) => {
    if (e.target === el.deleteModal) closeDeleteModal();
  });

  el.deleteModalConfirm.addEventListener('click', () => {
    if (state.deletingTaskId) {
      TaskManager.delete(state.deletingTaskId);
      closeDeleteModal();
      renderTasks();
      renderWeeklySchedule();
      showToast('Task deleted');
    }
  });

  /* ------------------------------------------------------------------------
     11. Search & Filter Controls
     ------------------------------------------------------------------------ */
  el.filterSegButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      el.filterSegButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.getAttribute('data-filter');
      renderTasks();
    });
  });

  el.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    el.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderTasks();
  });

  el.searchClearBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    state.searchQuery = '';
    el.searchClearBtn.style.display = 'none';
    renderTasks();
    el.searchInput.focus();
  });

  el.clearDayFilterBtn.addEventListener('click', () => {
    state.selectedDate = null;
    renderWeeklySchedule();
    renderTasks();
  });

  el.bannerClearBtn.addEventListener('click', () => {
    state.selectedDate = null;
    renderWeeklySchedule();
    renderTasks();
  });

  // Period Selector Buttons
  el.periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      el.periodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedPeriod = btn.getAttribute('data-period');
      showToast(`Showing period: ${btn.textContent}`);
      renderVelocityChart();
    });
  });

  // Global Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (el.taskModal.classList.contains('is-open')) closeModal();
      if (el.deleteModal.classList.contains('is-open')) closeDeleteModal();
    }
  });

  /* ------------------------------------------------------------------------
     12. Toast Capsule Notifications
     ------------------------------------------------------------------------ */
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    el.toastMessage.textContent = message;
    el.toast.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('is-visible');
    }, 2800);
  }

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
     13. Initial Boot
     ------------------------------------------------------------------------ */
  updateHeaderDate();
  renderWeeklySchedule();
  renderTasks();
  renderGoals();
});
