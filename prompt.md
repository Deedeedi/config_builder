 # Node Editor & Visualizer — Updated Spec

        """markdown
        This document describes the Node Editor and Canvas behavior implemented in this repository (updated to reflect recent changes in the codebase and conversation).

        ## Data model
        Nodes are plain JSON objects keyed by id. Example for SELECT MODE:

        ```json
        "node_1": {
            "type": "sql_query",
            "inputs": {
                "mode": "select",
                "query": "select col1, col2 from table_1 where period = 202501",
                "_select": ["col1", "col2"],
                "_from": "table_1",
                "_where": [
                    {"column": "period", "operator": "=", "value": "202501"}
                ]
            },
            "meta_data": {
                "display_name": "Node 1",
                "parent_node": "",
                "child_node": []
            }
        }
        ```

        Example for CUSTOMIZED MODE:

        ```json
        "node_2": {
            "type": "sql_query",
            "inputs": {
                "mode": "customized",
                "query": "select * from table_1 where period > 202501 or metric_value < 100"
            },
            "meta_data": {
                "display_name": "Node 2",
                "parent_node": "",
                "child_node": []
            }
        }
        ```

        - `type` is one of the allowed node types defined in `node_config.json`.
        - `inputs.mode` indicates the current mode: `"select"` for SELECT MODE or `"customized"` for CUSTOMIZED MODE.
        - For SELECT MODE: `inputs._select`, `inputs._from`, and `inputs._where` hold the structured query components. `inputs.query` is auto-generated from these fields.
        - For CUSTOMIZED MODE: only `inputs.query` is used; the `_select`, `_from`, and `_where` fields are empty or absent.
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
        - Mode: the editor supports two modes for `sql_query` nodes: `SELECT MODE` and `CUSTOMIZED MODE` (free-text SQL input). The node editor UI displays different views depending on the active mode.
        ### SELECT MODE:
        The editor displays the following rows:
        1. SELECT — multi-select a set of column names (populated from `table_schemas[table]` if provided, otherwise `metric_schema`). If 0 columns are selected, the auto-generated SQL defaults to `SELECT *`.
        2. FROM — choose a single table from `input_tables`. The generated SQL uses `FROM <table>`. Applying FROM populates the ON-left select with columns from the chosen table. If the FROM table is changed after columns have been selected, the selected columns are cleared and the column list is filtered to the new table's schema.
        3. WHERE — add one or more conditions by choosing a column (from the same schema), an operator (=, >, <, >=, <=, IN, BETWEEN), and entering value(s). For BETWEEN, users enter two values (start and end). For IN, users freely input values in a textbox. Multiple conditions are combined using user-selectable AND/OR operators between each condition. The auto-generated SQL handles parentheses as needed.
        4. Auto-generated SQL — the textbox displays the SQL generated from the SELECT, FROM, and WHERE selections above and updates in real-time as the user makes selections. The textbox is editable, allowing users to manually modify the SQL. If the user manually edits the SQL, the mode automatically switches to CUSTOMIZED MODE.
        5. Clear/Reset button — clears all SELECT, FROM, WHERE, and SQL fields, returning the editor to an empty state in SELECT MODE.
        ### CUSTOMIZED MODE:
        The editor displays only the SQL textbox. Users can write or edit SQL scripts freely. The SELECT, FROM, and WHERE rows are not visible in this mode. Switching from CUSTOMIZED MODE back to SELECT MODE resets all SELECT, FROM, and WHERE fields.
