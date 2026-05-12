/**
 * components.js - UI rendering logic
 */
import { formatCurrency } from './utils.js';

export const renderTask = (task, onToggle, onDelete) => {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.dataset.id = task.id;
    
    div.innerHTML = `
        <div class="task-checkbox">
            ${task.completed ? '<i data-lucide="check" style="width: 14px; color: white"></i>' : ''}
        </div>
        <div class="task-content">
            <span class="task-item-title">${task.title}</span>
            <div class="task-meta">
                <span><i data-lucide="map-pin" style="width: 12px"></i> ${task.room}</span>
                <span><i data-lucide="clock" style="width: 12px"></i> ${task.time}h</span>
                <span><i data-lucide="dollar-sign" style="width: 12px"></i> ${formatCurrency(task.price)}</span>
                ${task.repeat ? `<span><i data-lucide="refresh-cw" style="width: 12px"></i> Repeat</span>` : ''}
            </div>
        </div>
        <div class="task-actions">
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            <button class="delete-btn" title="Delete Task"><i data-lucide="trash-2" style="width: 14px"></i></button>
        </div>
    `;

    // Click on checkbox
    div.querySelector('.task-checkbox').addEventListener('click', (e) => {
        e.stopPropagation();
        onToggle(task.id);
    });

    // Click on delete
    div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            onDelete(task.id);
        }
    });

    // Click on item for details/edit (simplified for now)
    div.addEventListener('click', () => {
        // Toggle full item as well or open edit
    });

    return div;
};

export const updateStats = (stats) => {
    document.getElementById('pending-count').textContent = stats.pending;
    document.getElementById('urgent-count').textContent = stats.urgent;
    document.getElementById('total-budget').textContent = stats.budget;
};
