# Node Hierarchy Visualizer (Static)

Small single-page app to visualize and edit JSON-defined nodes and their hierarchy.

How to run

- Open `index.html` in a browser, or run a simple static server in the project root:

```bash
# from project root
npm i -g serve   # optional, or use python -m http.server
serve . -p 5000
```

Features

- Render nodes as draggable boxes.
- Draw curved SVG links using `meta_data.child_node` relations.
- Edit type, display name, parent, and inputs (JSON) in the sidebar.
- Add and delete nodes; data persisted to localStorage.

Files

- `index.html` — app shell
- `styles.css` — styling
- `app.js` — main logic
- `nodes.json` — sample minimal nodes
