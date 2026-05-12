/**
 * github.js - GitHub API integration for repository persistence
 */

export const githubSync = {
    async pushToRepo(token, repo, branch, path, content, message) {
        const timestamp = new Date().getTime();
        const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&t=${timestamp}`;
        
        // 1. Get current file SHA (if it exists)
        let sha = null;
        try {
            const res = await fetch(url, {
                headers: { 
                    'Authorization': `token ${token}`,
                    'If-None-Match': '' // Bypass some browser caches
                },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                sha = data.sha;
            }
        } catch (e) {
            console.log(`File ${path} may not exist yet, proceeding with create.`);
        }

        // 2. Push update
        const body = {
            message: message,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
            branch: branch
        };
        if (sha) body.sha = sha;

        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to sync to GitHub');
        }

        return await res.json();
    },

    async syncAll(token, repo, branch, data) {
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        
        // Sync tasks, lists, and users sequentially with small delays to prevent SHA conflicts
        await this.pushToRepo(token, repo, branch, 'data/tasks.json', data.tasks, 'Sync tasks');
        await delay(500);
        await this.pushToRepo(token, repo, branch, 'data/lists.json', data.lists, 'Sync lists');
        await delay(500);
        await this.pushToRepo(token, repo, branch, 'data/users.json', data.users, 'Sync users');
    }
};
