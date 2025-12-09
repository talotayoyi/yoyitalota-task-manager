// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentView = 'today';
let currentFilter = 'all';

const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const addTaskBtn = document.getElementById('addTaskBtn');
const addTaskForm = document.getElementById('addTaskForm');
const taskNameInput = document.getElementById('taskNameInput');
const submitTaskBtn = document.getElementById('submitTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Sidebar toggle
menuToggle?.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebar?.addEventListener('click', () => sidebar.classList.remove('open'));

// Project filter navigation
document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.project-item').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        currentFilter = item.dataset.filter === 'Inbox' ? 'all' : item.dataset.filter;
        renderTasks();
        sidebar.classList.remove('open');
    });
});

// Bottom navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        updateViewTitle();
        renderTasks();
    });
});

// Sidebar navigation items
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        currentView = item.dataset.view;
        updateViewTitle();
        renderTasks();
        sidebar.classList.remove('open');
    });
});

// Clear all data button
document.getElementById('clearAllBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone!')) {
        tasks = [];
        saveTasks();
        renderTasks();
        alert('All tasks have been cleared!');
    }
});

// Add task form toggle
addTaskBtn.addEventListener('click', () => {
    addTaskForm.style.display = 'block';
    addTaskBtn.style.display = 'none';
    taskNameInput.focus();
});

cancelTaskBtn.addEventListener('click', () => {
    addTaskForm.style.display = 'none';
    addTaskBtn.style.display = 'flex';
    taskNameInput.value = '';
    document.getElementById('dueDateInput').value = '';
});

// Submit new task
submitTaskBtn.addEventListener('click', () => {
    const taskName = taskNameInput.value.trim();
    if (!taskName) {
        alert('Task name cannot be empty!');
        return;
    }

    tasks.push({
        id: Date.now(),
        name: taskName,
        dueDate: document.getElementById('dueDateInput').value,
        category: document.getElementById('categorySelect').value,
        completed: false
    });

    saveTasks();
    addTaskForm.style.display = 'none';
    addTaskBtn.style.display = 'flex';
    taskNameInput.value = '';
    document.getElementById('dueDateInput').value = '';
    renderTasks();
});

// Search and sort
searchInput.addEventListener('input', renderTasks);
document.getElementById('sortSelect').addEventListener('change', renderTasks);

// Toggle task completion
function toggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) task.completed = !task.completed;
    saveTasks();
    renderTasks();
}

// Delete task
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
}

// Render all tasks
function renderTasks() {
    const searchQuery = searchInput.value.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = tasks.filter(task => {
        if (currentView === 'today') {
            // Show all incomplete tasks in today view (not just today's date)
            return !task.completed;
        } else if (currentView === 'upcoming') {
            if (task.completed) return false;
            if (!task.dueDate) return false;
            return new Date(task.dueDate) >= today;
        } else if (currentView === 'completed') {
            return task.completed;
        }
        return !task.completed;
    });

    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.category === currentFilter);
    }

    filtered = filtered.filter(t => t.name.toLowerCase().includes(searchQuery));

    const sortBy = document.getElementById('sortSelect').value;
    if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date') {
        filtered.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    taskList.innerHTML = '';
    if (filtered.length === 0) {
        taskList.innerHTML = '<div class="empty-state"><p>No tasks to show</p></div>';
    } else {
        filtered.forEach(task => taskList.appendChild(createTaskElement(task)));
    }

    updateCounters();
    updateViewTitle();
}

// Create task element
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = task.completed ? 'task-item completed' : 'task-item';
    div.innerHTML = `
        <div class="task-left">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleComplete(${task.id})"></div>
            <div class="task-details">
                <div class="task-name ${task.completed ? 'completed' : ''}">${task.name}</div>
                <div class="task-meta">
                    ${task.dueDate ? `<span>${task.dueDate}</span>` : ''}
                    <span>${task.category}</span>
                </div>
            </div>
        </div>
        <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
    `;
    return div;
}

// Update counters
function updateCounters() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('headerTaskCount').textContent = `${total} task${total !== 1 ? 's' : ''}`;

    document.getElementById('inboxCount').textContent = tasks.filter(t => !t.completed).length;
    document.getElementById('workCount').textContent = tasks.filter(t => t.category === 'Work' && !t.completed).length;
    document.getElementById('schoolCount').textContent = tasks.filter(t => t.category === 'School' && !t.completed).length;
    document.getElementById('personalCount').textContent = tasks.filter(t => t.category === 'Personal' && !t.completed).length;
}

// Update view title
function updateViewTitle() {
    const titles = { inbox: 'Inbox', today: 'Today', upcoming: 'Upcoming', completed: 'Completed' };
    document.getElementById('viewTitle').textContent = titles[currentView] || 'Today';
    document.querySelector('.date-title').textContent = titles[currentView] || 'Today';
}

// Initialize
renderTasks();