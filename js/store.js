/**
 * store.js - State management using Supabase for cloud persistence
 */

const SUPABASE_URL = 'https://dewyghwhnkjtbxncraju.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRld3lnaHdobmtqdGJ4bmNyYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTA5MTEsImV4cCI6MjA5NDE2NjkxMX0.0wdZocow_DS0O0sTpjXDY2lQQVcuXSAlEBu3cNSzLRo';

// @ts-ignore - Supabase is loaded from CDN in index.html
let supabase;

export const THEME_KEY = 'hannibal_house_theme';
export const ACTIVE_USER_KEY = 'hannibal_house_active_user';

export const store = {
    tasks: [],
    lists: [],
    users: [],
    activeUserId: null,
    theme: 'dark',

    async init() {
        // Initialize Supabase client
        if (!window.supabase) {
            console.error('Supabase library not loaded!');
            return;
        }
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // 1. Fetch initial data from Supabase
        await this.fetchAll();

        // 2. Set up Real-time Subscriptions
        this.setupSubscriptions();

        // 3. Load UI preferences
        const savedTheme = localStorage.getItem(THEME_KEY);
        this.theme = savedTheme || 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);

        const savedActiveUser = localStorage.getItem(ACTIVE_USER_KEY);
        if (!this.activeUserId && this.users.length === 0) {
            const newUser = await this.addUser('Owner');
            this.activeUserId = newUser.id;
        } else {
            this.activeUserId = savedActiveUser || (this.users.length > 0 ? this.users[0].id : null);
        }

        return { tasks: this.tasks, lists: this.lists, users: this.users, activeUserId: this.activeUserId };
    },

    async fetchAll() {
        const [tasksRes, listsRes, usersRes] = await Promise.all([
            supabase.from('tasks').select('*').order('created_at', { ascending: false }),
            supabase.from('lists').select('*, list_items(*)').order('created_at', { ascending: false }),
            supabase.from('users').select('*').order('name')
        ]);

        this.tasks = tasksRes.data || [];
        // Map lists to match old format where items are nested
        this.lists = (listsRes.data || []).map(l => ({
            ...l,
            items: l.list_items || []
        }));
        this.users = usersRes.data || [];
    },

    setupSubscriptions() {
        supabase.channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => this.refreshAndNotify('tasksUpdated'))
            .subscribe();

        supabase.channel('public:lists')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => this.refreshAndNotify('listsUpdated'))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' }, () => this.refreshAndNotify('listsUpdated'))
            .subscribe();
            
        supabase.channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => this.refreshAndNotify('userChanged'))
            .subscribe();
    },

    async refreshAndNotify(eventName) {
        await this.fetchAll();
        window.dispatchEvent(new CustomEvent(eventName));
    },

    // User Methods
    async addUser(name) {
        const { data, error } = await supabase.from('users').insert([{ name }]).select();
        if (error) console.error(error);
        return data ? data[0] : null;
    },

    setActiveUser(id) {
        this.activeUserId = id;
        localStorage.setItem(ACTIVE_USER_KEY, id);
        window.dispatchEvent(new CustomEvent('userChanged'));
    },

    // List Methods
    async addList(name) {
        const { data, error } = await supabase.from('lists').insert([{ name }]).select();
        if (error) console.error(error);
        return data ? data[0] : null;
    },

    async updateList(id, name) {
        await supabase.from('lists').update({ name }).eq('id', id);
    },

    async deleteList(id) {
        await supabase.from('lists').delete().eq('id', id);
    },

    async addListItem(listId, itemName) {
        await supabase.from('list_items').insert([{
            list_id: listId,
            name: itemName,
            user_id: this.activeUserId
        }]);
    },

    async updateListItem(listId, itemId, name) {
        await supabase.from('list_items').update({ name }).eq('id', itemId);
    },

    async toggleListItem(listId, itemId) {
        const list = this.lists.find(l => l.id === listId);
        const item = list?.items.find(i => i.id === itemId);
        if (item) {
            await supabase.from('list_items').update({ completed: !item.completed }).eq('id', itemId);
        }
    },

    async deleteListItem(listId, itemId) {
        await supabase.from('list_items').delete().eq('id', itemId);
    },

    // Task Methods
    async addTask(task) {
        const { data, error } = await supabase.from('tasks').insert([{
            ...task,
            user_id: this.activeUserId
        }]).select();
        if (error) console.error(error);
        return data ? data[0] : null;
    },

    async updateTask(id, updates) {
        await supabase.from('tasks').update(updates).eq('id', id);
    },

    async deleteTask(id) {
        await supabase.from('tasks').delete().eq('id', id);
    },

    async toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
        }
    },

    async bulkAdd(newTasks) {
        const formatted = newTasks.map(t => ({
            title: t.title || 'Untitled Task',
            room: t.room || 'General',
            category: (t.category || 'other').toLowerCase(),
            priority: (t.priority || 'medium').toLowerCase(),
            price: parseFloat(t.price || 0),
            difficulty: parseInt(t.difficulty || 1),
            time: parseFloat(t.time || 1),
            repeat: !!t.repeat,
            user_id: this.activeUserId
        }));
        await supabase.from('tasks').insert(formatted);
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

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        return this.theme;
    }
};
