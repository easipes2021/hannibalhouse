import { store } from './store.js';
import { renderTask, updateStats } from './components.js';
import { sortTasks, filterTasks, formatDate } from './utils.js';

// DOM Elements
const taskList = document.getElementById('priority-task-list');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const mappingModal = document.getElementById('mapping-modal');
const mappingForm = document.getElementById('mapping-form');
const mappingContainer = document.getElementById('mapping-container');
const taskForm = document.getElementById('task-form');
const closeModalBtns = document.querySelectorAll('.close-modal');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('task-search');
const importBtn = document.getElementById('import-btn');
const csvInput = document.getElementById('csv-input');
const themeToggle = document.getElementById('theme-toggle');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.content-view');

// Lists Elements
const listsNav = document.getElementById('lists-nav');
const listItemsContainer = document.getElementById('list-items');
const addListBtn = document.getElementById('add-list-btn');
const addListItemBtn = document.getElementById('add-list-item-btn');
const deleteListBtn = document.getElementById('delete-list-btn');
const activeListName = document.getElementById('active-list-name');

// User Elements
const userSelector = document.getElementById('user-selector');
const addUserBtn = document.getElementById('add-user-btn');

// App State
let currentSort = 'priority';
let searchQuery = '';
let activeView = 'dashboard';
let activeListId = null;
let pendingCsvData = null;

const init = () => {
    store.init();
    renderUsers();
    render();
    setupEventListeners();
};

const renderUsers = () => {
    userSelector.innerHTML = '';
    store.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        option.selected = user.id === store.activeUserId;
        userSelector.appendChild(option);
    });
};

const render = () => {
    // ... rest of render logic ...
    // 1. Handle Navigation Highlighting
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === activeView);
    });

    // 2. Show Active View
    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== `${activeView}-view`);
    });

    // 3. Render Tasks (only if in task-related views)
    if (activeView === 'dashboard' || activeView === 'tasks' || activeView === 'maintenance' || activeView === 'renovations' || activeView === 'cleaning') {
        renderTasksView();
    }

    // 4. Render Lists (if in lists view)
    if (activeView === 'lists') {
        renderListsView();
    }
    
    // Update stats
    updateStats(store.getStats());
    
    // Refresh icons
    if (window.lucide) {
        lucide.createIcons();
    }
};

const renderTasksView = () => {
    taskList.innerHTML = '';
    let tasks = store.tasks;

    // Filter by view/category if needed
    if (activeView === 'maintenance') tasks = tasks.filter(t => t.category === 'maintenance');
    if (activeView === 'renovations') tasks = tasks.filter(t => t.category === 'renovation');
    if (activeView === 'cleaning') tasks = tasks.filter(t => t.category === 'cleaning');

    tasks = filterTasks(tasks, searchQuery);
    tasks = sortTasks(tasks, currentSort);
    
    tasks.forEach(task => {
        const taskEl = renderTask(task, (id) => store.toggleTask(id), (id) => store.deleteTask(id));
        taskList.appendChild(taskEl);
    });
};

const renderListsView = () => {
    listsNav.innerHTML = '';
    store.lists.forEach(list => {
        const btn = document.createElement('button');
        btn.className = `nav-item ${activeListId === list.id ? 'active' : ''}`;
        btn.innerHTML = `<i data-lucide="list"></i> <span>${list.name}</span>`;
        btn.onclick = () => {
            activeListId = list.id;
            render();
        };
        listsNav.appendChild(btn);
    });

    const activeList = store.lists.find(l => l.id === activeListId);
    if (activeList) {
        activeListName.innerHTML = `
            ${activeList.name}
            <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted); display: block; margin-top: 4px;">
                Created: ${formatDate(activeList.createdAt)}
            </span>
        `;
        addListItemBtn.classList.remove('hidden');
        deleteListBtn.classList.remove('hidden');
        listItemsContainer.innerHTML = '';
        activeList.items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `task-item ${item.completed ? 'completed' : ''}`;
            itemEl.innerHTML = `
                <div class="task-checkbox">
                    ${item.completed ? '<i data-lucide="check" style="width: 14px; color: white"></i>' : ''}
                </div>
                <div style="flex: 1">
                    <span class="task-item-title">${item.name}</span>
                    <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">Added by: ${store.users.find(u => u.id === item.userId)?.name || 'Unknown'}</span>
                </div>
                <button class="delete-btn"><i data-lucide="trash-2" style="width: 14px"></i></button>
            `;
            itemEl.querySelector('.task-checkbox').onclick = () => store.toggleListItem(activeList.id, item.id);
            itemEl.querySelector('.delete-btn').onclick = () => store.deleteListItem(activeList.id, item.id);
            listItemsContainer.appendChild(itemEl);
        });
    } else {
        activeListName.textContent = 'Select a list';
        addListItemBtn.classList.add('hidden');
        deleteListBtn.classList.add('hidden');
        listItemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 40px;">Choose a list from the sidebar or create a new one.</p>';
    }
};

const setupEventListeners = () => {
    // User Selection
    const userModal = document.getElementById('user-modal');
    const userForm = document.getElementById('user-form');

    userSelector.addEventListener('change', (e) => {
        store.setActiveUser(e.target.value);
    });

    addUserBtn.addEventListener('click', () => {
        userModal.classList.add('active');
        userForm.reset();
    });

    userForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        if (name) {
            const newUser = store.addUser(name);
            renderUsers();
            store.setActiveUser(newUser.id);
            userModal.classList.remove('active');
        }
    };

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        store.toggleTheme();
    });

    // Navigation / View Switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            activeView = item.dataset.view;
            render();
        });
    });

    // Modal toggle
    addTaskBtn.addEventListener('click', () => {
        taskModal.classList.add('active');
        taskForm.reset();
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskModal.classList.remove('active');
            mappingModal.classList.remove('active');
        });
    });
    
    // Form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(taskForm);
        const taskData = {
            title: formData.get('task-title'),
            room: formData.get('task-room'),
            category: formData.get('task-category'),
            priority: formData.get('task-priority'),
            difficulty: parseInt(formData.get('task-difficulty')),
            price: parseFloat(formData.get('task-price')),
            time: parseFloat(formData.get('task-time')),
            repeat: document.getElementById('task-repeat').checked,
            repeatInterval: formData.get('repeat-interval')
        };
        
        store.addTask(taskData);
        taskModal.classList.remove('active');
    });

    // Repeat options toggle
    const taskRepeat = document.getElementById('task-repeat');
    const repeatOptions = document.getElementById('repeat-options');
    taskRepeat.addEventListener('change', () => {
        repeatOptions.classList.toggle('hidden', !taskRepeat.checked);
    });
    
    // Sorting
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        render();
    });
    
    // Searching
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
    });
    
    // CSV Import
    importBtn.addEventListener('click', () => {
        csvInput.click();
    });
    
    csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                complete: (results) => {
                    handleCsvImport(results);
                }
            });
        }
    });

    // Shopping List Events
    const listModal = document.getElementById('list-modal');
    const listItemModal = document.getElementById('list-item-modal');
    const listForm = document.getElementById('list-form');
    const listItemForm = document.getElementById('list-item-form');

    addListBtn.onclick = () => {
        listModal.classList.add('active');
        listForm.reset();
    };

    listForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('list-name').value;
        if (name) {
            const newList = store.addList(name);
            activeListId = newList.id;
            activeView = 'lists';
            listModal.classList.remove('active');
            render();
            renderUsers();
        }
    };

    addListItemBtn.onclick = () => {
        listItemModal.classList.add('active');
        listItemForm.reset();
    };

    listItemForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('item-name').value;
        if (name && activeListId) {
            store.addListItem(activeListId, name);
            listItemModal.classList.remove('active');
            render();
        }
    };

    deleteListBtn.onclick = () => {
        if (confirm('Delete this list?')) {
            store.deleteList(activeListId);
            activeListId = null;
            render();
        }
    };

    // Close Modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskModal.classList.remove('active');
            mappingModal.classList.remove('active');
            listModal.classList.remove('active');
            listItemModal.classList.remove('active');
            userModal.classList.remove('active');
        });
    });

    // Mapping Form submission
    mappingForm.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(mappingForm);
        const mapping = {};
        formData.forEach((value, key) => { mapping[key] = value; });
        
        const mappedTasks = pendingCsvData.map(row => {
            const task = {};
            for (const [internalKey, csvKey] of Object.entries(mapping)) {
                task[internalKey] = row[csvKey];
            }
            return task;
        });

        store.bulkAdd(mappedTasks);
        mappingModal.classList.remove('active');
        alert(`Successfully imported ${mappedTasks.length} tasks!`);
        render();
    };

    // Listen for data updates
    window.addEventListener('tasksUpdated', render);
    window.addEventListener('listsUpdated', render);
};

const handleCsvImport = (results) => {
    let headers = results.meta.fields || [];
    
    // Fallback: If PapaParse didn't find headers in meta, try to get them from the first row keys
    if (headers.length === 0 && results.data.length > 0) {
        headers = Object.keys(results.data[0]);
    }

    if (headers.length === 0) {
        alert("Could not find any columns in the CSV. Please make sure the file has a header row.");
        return;
    }

    pendingCsvData = results.data;
    
    // Populate mapping modal
    const fields = [
        { key: 'title', label: 'Title' },
        { key: 'room', label: 'Room/Location' },
        { key: 'category', label: 'Category' },
        { key: 'priority', label: 'Priority' },
        { key: 'price', label: 'Price' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'time', label: 'Time' }
    ];

    mappingContainer.innerHTML = '';
    fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'mapping-row';
        row.innerHTML = `
            <label>${field.label}</label>
            <select name="${field.key}">
                <option value="">-- Skip Field --</option>
                ${headers.map(h => `<option value="${h}" ${h.toLowerCase() === field.key.toLowerCase() ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
        `;
        mappingContainer.appendChild(row);
    });

    mappingModal.classList.add('active');
};

// Start the app
init();
