/**
 * github.js - GitHub API integration for repository persistence
 */

export const githubSync = {
    async pushToRepo(token, repo, branch, path, content, message) {
        const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
        
        // 1. Get current file SHA (if it exists)
        let sha = null;
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `token ${token}` }
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
        // Sync tasks, lists, and users sequentially
        await this.pushToRepo(token, repo, branch, 'data/tasks.json', data.tasks, 'Sync tasks from Hannibal House Dashboard');
        await this.pushToRepo(token, repo, branch, 'data/lists.json', data.lists, 'Sync lists from Hannibal House Dashboard');
        await this.pushToRepo(token, repo, branch, 'data/users.json', data.users, 'Sync users from Hannibal House Dashboard');
    }
};
