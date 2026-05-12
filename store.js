/**
 * store.js - State management and persistence
 */

export const STORAGE_KEY = 'hannibal_house_tasks';

export const store = {
    tasks: [],

    init() {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
            } catch (e) {
                console.error('Failed to parse saved tasks', e);
                this.tasks = [];
            }
        }
        return this.tasks;
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
    },

    addTask(task) {
        const newTask = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            completed: false,
            ...task
        };
        this.tasks.push(newTask);
        this.save();
        return newTask;
    },

    updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.save();
        }
    },

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
    },

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.save();
        }
    },

    getStats() {
        const pending = this.tasks.filter(t => !t.completed);
        const urgent = pending.filter(t => t.priority === 'urgent');
        const budget = this.tasks.reduce((acc, t) => acc + (parseFloat(t.price) || 0), 0);
        
        return {
            pending: pending.length,
            urgent: urgent.length,
            budget: budget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        };
    },

    bulkAdd(newTasks) {
        // Simple mapping for CSV import
        const mappedTasks = newTasks.map(t => ({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            completed: false,
            title: t.title || t.Title || 'Untitled Task',
            room: t.room || t.Room || t.Location || 'General',
            category: (t.category || t.Category || 'other').toLowerCase(),
            priority: (t.priority || t.Priority || 'medium').toLowerCase(),
            price: parseFloat(t.price || t.Price || 0),
            difficulty: parseInt(t.difficulty || t.Difficulty || 1),
            time: parseFloat(t.time || t.Time || 1),
            repeat: !!t.repeat
        }));
        
        this.tasks = [...this.tasks, ...mappedTasks];
        this.save();
    }
};
