 # Node Editor & Visualizer — Updated Spec

        """markdown
        This document describes the Node Editor and Canvas behavior implemented in this repository (updated to reflect recent changes in the codebase and conversation).

        ## Data model
        Nodes are plain JSON objects keyed by id. Example:

        ```json
        "node_1": {
            "type": "sql_query",
            "inputs": {
                "query": "select * from table_1 where period = 202501",
                "_from": "table_1",
                "_join": "table_2"
            },
            "meta_data": {
                "display_name": "Node 1",
                "parent_node": "",
                "child_node": []
            }
        }
        ```

        - `type` is one of the allowed node types defined in `node_config.json`.
        - `inputs.query` holds the generated or user-provided SQL for `sql_query` nodes.
        - `meta_data.parent_node` and `meta_data.child_node` define the hierarchy used by the canvas.

        ## Canvas / Diagram
        - The canvas limits the number of displayed nodes to 50. If more exist, a small notice is shown.
        - Nodes are shown as draggable boxes. Clicking a node opens the Node Editor in the sidebar.
        - Layout: an automatic hierarchical layout organizes nodes (parents above children). Nodes marked with `meta_data.skip_layout` or elements with `data-manual="true"` are excluded from automatic layout.
        - Links: arrows are drawn from child -> parent. Arrow paths use rectangular elbow routing (vertical → horizontal → vertical) and arrowheads are placed on rectangle borders (not centers) for clarity.
        - Interaction:
            - Dragging a node and dropping it near another will attach it as a child of that node (proximity-based).
            - Double-clicking on empty canvas creates a new `sql_query` node at the cursor position and marks it as manual so existing layout is preserved.
            - Zooming and re-centering are supported via native browser gestures and the Re-center control.

        ## Configuration (`node_config.json`)
        - `types`: array of allowed node types (e.g., `["sql_query","llm_query","human_approval","template"]`). The `Type` select in the editor is populated from this list.
        - `metric_schema`: a mapping of column names to a simple type token (used to populate SELECT and WHERE column choices when a per-table schema is not provided).
        - `input_tables`: list of available tables for FROM and JOIN selectors.
        - Optional: `table_schemas` can be added to provide per-table column lists. If present, it should map table name → { column_name: type, ... }.

        Example:
        ```json
        {
            "types": ["sql_query","llm_query","human_approval","template"],
            "metric_schema": {"period":"str","metric_name":"str","metric_value":"float"},
            "input_tables": ["table_1","table_2"],
            "table_schemas": {"table_1": {"id":"int","period":"str","value":"float"}}
        }
        ```

        ## Node Editor — `sql_query` builder
        When user selects `sql_query` type, a button `show SQL builder` appears under the `type` dropdown. 
        When user clicks the button `show SQL builder`, the SQL Builder panel shows up below the "Node Editor" section.

        ### SQL builder
        - Mode: the editor supports two modes for `sql_query` nodes: `SELECT MODE` and `CUSTOMIZED MODE` (free-text SQL input). The node editor UI displays different views depending on the active mode.
        
        ### SELECT MODE:
        The editor displays the following rows:
        
        1. **SELECT** — multi-select a set of column names (populated from `table_schemas[table]` if provided, otherwise `metric_schema`). 
           - If 0 columns are selected, the auto-generated SQL defaults to `SELECT *`.
           - SELECT dropdown is always available, even before a FROM table is selected.
           - Initially populated with columns from `metric_schema`.
        
        2. **FROM** — choose a single table from `input_tables`. 
           - The generated SQL uses `FROM <table>`.
           - When FROM "Apply" button is clicked:
             - SELECT and WHERE column lists update to show columns from the selected table's schema (from `table_schemas[table]` if available, otherwise `metric_schema`).
             - Previously selected columns in SELECT are **only cleared** if the new table's schema is different from the current schema.
             - If switching to a table with the same schema as before, previously selected columns are preserved.
           - Column updates happen **only on Apply button click**, not in real-time.
        
        3. **WHERE** — add one or more conditions:
           - Each condition consists of: Column selector, Operator selector (=, >, <, >=, <=, IN, BETWEEN), and Value input.
           - Columns are populated from the same schema as SELECT/FROM.
           - For BETWEEN operator: users enter two comma-separated values (start, end) - e.g., "100,200". Real-time SQL generation shows partial preview while typing.
           - For IN operator: users enter comma-separated values - e.g., "val1,val2,val3".
           - Multiple conditions are automatically combined using AND operators.
           - Each condition row has a small "✕" button to remove it.
           - "+ Add Condition" button adds new WHERE condition rows.
        
        4. **Auto-generated SQL** — the textbox displays the SQL generated from SELECT, FROM, and WHERE selections:
           - Updates in real-time as user types in WHERE value fields.
           - Updates when Apply buttons are clicked in SELECT or FROM rows.
           - Textbox is **editable** - users can manually modify the SQL.
           - If user manually edits the SQL, the mode automatically switches to CUSTOMIZED MODE.
        
        5. **Clear/Reset button** — clears all SELECT, FROM, WHERE, and SQL fields, returning the editor to an empty state in SELECT MODE.
        
        ### CUSTOMIZED MODE:
        - Displays only a SQL textbox where users can write or edit SQL scripts freely.
        - SELECT, FROM, and WHERE rows are not visible in this mode.
        - Switching from CUSTOMIZED MODE back to SELECT MODE resets all SELECT, FROM, and WHERE fields to empty state.
        - The SQL entered in CUSTOMIZED MODE is preserved in `inputs.query` when saving the node.

        ## Config.json loading
        Implemet
        
        