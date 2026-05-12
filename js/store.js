/**
 * store.js - State management and persistence
 */

export const STORAGE_KEY = 'hannibal_house_tasks';
export const LISTS_KEY = 'hannibal_house_lists';
export const THEME_KEY = 'hannibal_house_theme';
export const USERS_KEY = 'hannibal_house_users';
export const ACTIVE_USER_KEY = 'hannibal_house_active_user';

export const store = {
    tasks: [],
    lists: [],
    users: [],
    activeUserId: null,
    theme: 'dark',

    init() {
        // Load Tasks
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        if (savedTasks) {
            try { this.tasks = JSON.parse(savedTasks); } catch (e) { this.tasks = []; }
        }

        // Load Lists
        const savedLists = localStorage.getItem(LISTS_KEY);
        if (savedLists) {
            try { this.lists = JSON.parse(savedLists); } catch (e) { this.lists = []; }
        }

        // Load Users
        const savedUsers = localStorage.getItem(USERS_KEY);
        if (savedUsers) {
            try { this.users = JSON.parse(savedUsers); } catch (e) { this.users = []; }
        }
        if (this.users.length === 0) {
            // Default user
            this.addUser('Owner');
        }

        // Load Active User
        const savedActiveUser = localStorage.getItem(ACTIVE_USER_KEY);
        this.activeUserId = savedActiveUser || this.users[0]?.id;

        // Load Theme
        const savedTheme = localStorage.getItem(THEME_KEY);
        this.theme = savedTheme || 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);

        return { tasks: this.tasks, lists: this.lists, users: this.users, activeUserId: this.activeUserId };
    },

    addUser(name) {
        const newUser = { id: crypto.randomUUID(), name: name };
        this.users.push(newUser);
        this.saveUsers();
        if (!this.activeUserId) this.setActiveUser(newUser.id);
        return newUser;
    },

    setActiveUser(id) {
        this.activeUserId = id;
        localStorage.setItem(ACTIVE_USER_KEY, id);
        window.dispatchEvent(new CustomEvent('userChanged'));
    },

    saveUsers() {
        localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    },

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        return this.theme;
    },

    saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
    },

    saveLists() {
        localStorage.setItem(LISTS_KEY, JSON.stringify(this.lists));
        window.dispatchEvent(new CustomEvent('listsUpdated'));
    },

    // Lists Methods
    addList(name) {
        const newList = {
            id: crypto.randomUUID(),
            name: name,
            items: []
        };
        this.lists.push(newList);
        this.saveLists();
        return newList;
    },

    deleteList(id) {
        this.lists = this.lists.filter(l => l.id !== id);
        this.saveLists();
    },

    addListItem(listId, itemName) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.items.push({
                id: crypto.randomUUID(),
                name: itemName,
                completed: false,
                userId: this.activeUserId
            });
            this.saveLists();
        }
    },

    toggleListItem(listId, itemId) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            const item = list.items.find(i => i.id === itemId);
            if (item) {
                item.completed = !item.completed;
                this.saveLists();
            }
        }
    },

    deleteListItem(listId, itemId) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.items = list.items.filter(i => i.id !== itemId);
            this.saveLists();
        }
    },

    // Tasks Methods
    addTask(task) {
        const newTask = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            completed: false,
            userId: this.activeUserId,
            ...task
        };
        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    },

    updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.saveTasks();
        }
    },

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    },

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
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
        const mappedTasks = newTasks.map(t => ({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            completed: false,
            userId: this.activeUserId,
            title: t.title || 'Untitled Task',
            room: t.room || 'General',
            category: (t.category || 'other').toLowerCase(),
            priority: (t.priority || 'medium').toLowerCase(),
            price: parseFloat(t.price || 0),
            difficulty: parseInt(t.difficulty || 1),
            time: parseFloat(t.time || 1),
            repeat: !!t.repeat
        }));
        
        this.tasks = [...this.tasks, ...mappedTasks];
        this.saveTasks();
    }
};
