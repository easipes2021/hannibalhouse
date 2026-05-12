/**
 * main.js - Application entry point
 */
import { store } from './store.js';
import { renderTask, updateStats } from './components.js';
import { sortTasks, filterTasks } from './utils.js';

// DOM Elements
const taskList = document.getElementById('priority-task-list');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const closeModalBtns = document.querySelectorAll('.close-modal');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('task-search');
const importBtn = document.getElementById('import-btn');
const csvInput = document.getElementById('csv-input');
const taskRepeat = document.getElementById('task-repeat');
const repeatOptions = document.getElementById('repeat-options');

// App State
let currentSort = 'priority';
let searchQuery = '';

const init = () => {
    store.init();
    render();
    setupEventListeners();
};

const render = () => {
    // Clear list
    taskList.innerHTML = '';
    
    // Process tasks
    let tasks = filterTasks(store.tasks, searchQuery);
    tasks = sortTasks(tasks, currentSort);
    
    // Render each task
    tasks.forEach(task => {
        const taskEl = renderTask(
            task, 
            (id) => store.toggleTask(id),
            (id) => store.deleteTask(id)
        );
        taskList.appendChild(taskEl);
    });
    
    // Update stats
    updateStats(store.getStats());
    
    // Refresh icons
    if (window.lucide) {
        lucide.createIcons();
    }
};

const setupEventListeners = () => {
    // Modal toggle
    addTaskBtn.addEventListener('click', () => {
        taskModal.classList.add('active');
        taskForm.reset();
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            taskModal.classList.remove('active');
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
            repeat: taskRepeat.checked,
            repeatInterval: formData.get('repeat-interval')
        };
        
        store.addTask(taskData);
        taskModal.classList.remove('active');
    });

    // Repeat options toggle
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
                complete: (results) => {
                    store.bulkAdd(results.data);
                    alert(`Successfully imported ${results.data.length} tasks!`);
                    render();
                },
                error: (err) => {
                    console.error('CSV Parsing Error:', err);
                    alert('Error parsing CSV file.');
                }
            });
        }
    });

    // Listen for data updates
    window.addEventListener('tasksUpdated', render);
};

// Start the app
init();
