const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'sample_tasks.csv');
const tasksJsonPath = path.join(__dirname, 'data', 'tasks.json');

const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

const tasks = lines.slice(1).map(line => {
    const values = line.split(',');
    const task = {
        id: Math.random().toString(36).substr(2, 9), // Simple ID generator for script
        createdAt: new Date().toISOString(),
        completed: false,
        userId: 'admin' // Placeholder
    };
    
    headers.forEach((header, index) => {
        let val = values[index];
        const key = header.toLowerCase();
        
        if (key === 'price' || key === 'difficulty' || key === 'time') {
            val = parseFloat(val) || 0;
        } else if (key === 'repeat') {
            val = val === 'true';
        }
        
        task[key] = val;
    });
    
    return task;
});

fs.writeFileSync(tasksJsonPath, JSON.stringify(tasks, null, 2));
console.log(`Imported ${tasks.length} tasks from CSV to JSON.`);
