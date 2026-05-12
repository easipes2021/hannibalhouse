/**
 * utils.js - Helpers for sorting, filtering, and formatting
 */

export const sortTasks = (tasks, sortBy) => {
    const sorted = [...tasks];
    
    switch (sortBy) {
        case 'priority':
            const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
            return sorted.sort((a, b) => weight[b.priority] - weight[a.priority]);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'difficulty':
            return sorted.sort((a, b) => b.difficulty - a.difficulty);
        case 'time':
            return sorted.sort((a, b) => b.time - a.time);
        default:
            return sorted;
    }
};

export const filterTasks = (tasks, query) => {
    if (!query) return tasks;
    const q = query.toLowerCase();
    return tasks.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.room.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
