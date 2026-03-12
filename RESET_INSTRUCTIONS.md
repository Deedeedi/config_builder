# How to Reset/Clear All Nodes

## Method 1: Using the Clear Page (Recommended)

1. Open: `http://localhost:8000/clear.html`
2. Click "Clear All Nodes" button
3. Confirm the action
4. You'll be automatically redirected back to the app with fresh nodes

## Method 2: Browser Developer Console

1. Open the app: `http://localhost:8000`
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Run: `clearAllNodes()`
5. Confirm the action
6. Page will refresh with fresh nodes

## Method 3: Manual localStorage Clear

1. Open the app: `http://localhost:8000`
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Application/Storage tab
4. Find Local Storage
5. Click on `http://localhost:8000`
6. Find key `factor_nodes_v1`
7. Delete it
8. Refresh the page

## Result

After any of these methods, the app will reset to show only the sample node (Node 1) with a default SQL query.

