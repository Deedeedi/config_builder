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
        - Mode: the editor supports two modes for `sql_query` nodes: `pre-defined` (a guided multi-row builder) and `customized` (free-text SQL input).

        Pre-defined builder flow (rows):
        User select from different modes below:
        ### SELECT MODE:
        1. SELECT — multi-select a set of column names (populated from `table_schemas[table]` if provided, otherwise `metric_schema`)
        2. FROM — choose a single table from `input_tables`. The generated SQL uses `FROM <table>`. Applying FROM populates the ON-left select with columns from the chosen table.
        3. WHERE — choose a column (from the same schema) and an operator (=, >, <, >=, <=, IN, BETWEEN) and enter value(s).
        ### JOIN MODE:
        1. Choose table a first from a set of tables. Check node_config.json>schema, to find the corresponding schema for table a. SELECT (Table a) — multi-select a set of column names (populated from `table_schemas[table]` if provided, otherwise `metric_schema`). Selected columns are prefixed with alias `a.` in the generated SQL.
        2. Choose table b then from a set of tables. Check node_config.json>schema, to find the corresponding schema for table b. SELECT (Table b) — multi-select a set of column names (populated from `table_schemas[table]` if provided, otherwise `metric_schema`). Selected columns are prefixed with alias `b.` in the generated SQL.
        3. FROM — automatically fill table a's name in generated SQL. The generated SQL uses `FROM <table> a` (alias `a`). 
        4. JOIN — choose a join type (LEFT/RIGHT/INNER/CROSS) and automatically populates table b's name. The generated SQL uses `<LEFT/RIGHT/INNER/CROSS> JOIN <table> b` (alias `b`). 
        5. ON — choose a left and right column to join on. Options are populated as `a.<col>` (left) and `b.<col>` (right). The generated SQL uses `ON a.col = b.col`.
        6. WHERE — choose a column (from the same schema) and an operator (=, >, <, >=, <=, IN, BETWEEN) and enter value(s). WHERE applies to `a.<column>` and `b.<column>` in the SQL.
        ### GROUPBY MODE:
        1. SELECT — choose one or more grouping columns (multi-select) plus any aggregate targets.
            - Grouping columns are selected from the chosen table's schema and will appear in the GROUP BY clause (aliased as `a.<col>`).
            - For each non-grouped column the user can optionally pick an aggregate from a droplist of functions: AVG, SUM, MIN, MAX, COUNT, COUNT DISTINCT, STDDEV, VARIANCE (default: SUM). Aggregates are emitted as e.g. `SUM(a.value) AS sum_value`.
            - UI note: show grouping columns and aggregate selections as separate rows/chips so it's clear which columns are grouped vs aggregated.

        2. AGGREGATE DROPLIST — per-column control:
            - A compact droplist next to each selectable column with entries: AVG, SUM, MIN, MAX, COUNT, COUNT DISTINCT, STDDEV, VARIANCE, NONE.
            - Choosing NONE treats the column as a grouping column (if selected in the group area) or disallows it from SELECT unless also present in GROUP BY.
            - Selecting an aggregate marks that column as an aggregated selector and disables it from appearing in the GROUP BY list automatically.

        3. FROM — identical to other modes: choose table from input_tables. SELECT and GROUP BY options are populated from `table_schemas[table]` if present, otherwise from `metric_schema`.

        4. WHERE — standard row-level filters applied before grouping (applies to `a.<column>`). Same operators as WHERE in other modes (=, >, <, >=, <=, IN, BETWEEN).

        5. GROUP BY — shows chosen grouping columns; user can reorder group columns if needed (affects output but not SQL correctness). All non-aggregated SELECT columns are automatically included here.

        6. HAVING (optional) — builder for conditions on aggregated expressions:
            - Choose an aggregate expression (e.g., SUM(a.value)), an operator, and value(s). Operators include (=, >, <, >=, <=, IN, BETWEEN).
            - HAVING is emitted after GROUP BY and can reference the selected aggregate aliases or re-create the aggregate expression.

        7. ORDER BY (optional) — allow ordering by grouping columns or aggregate expressions; provide ASC/DESC control.

        8. Generated SQL:
            - The editor composes SQL from the above selections. Examples:
              - Single-group, one aggregate:
                 SELECT period, SUM(metric_value) AS sum_metric_value
                 FROM table_1
                 WHERE period >= '202501'
                 GROUP BY period
              - Multi-group with HAVING:
                 SELECT category, period, AVG(metric_value) AS avg_value, COUNT(*) AS cnt
                 FROM table_1
                 GROUP BY category, period
                 HAVING AVG(metric_value) > 100
                 ORDER BY avg_value DESC

        ### PIPELINE MODE
        [TBD]
        Notes:
        - The UI enforces SQL correctness rules: any non-aggregated column in SELECT must be included in GROUP BY. If user tries to select a non-aggregated column without grouping it, show a validation prompt and offer to add it to GROUP BY automatically.
        - Aggregates applied to JOIN mode should allow selecting the source table (a or b) for the aggregated column.
        - Final SQL appears in the generated text area and remains editable by the user; manual edits persist on Save.
        - Consider adding a "COUNT(*)" quick button for common counts and a "DISTINCT" toggle for aggregates that support it.

        **Note**:
        - Alias convention: the `FROM` table is aliased as `a`, the `JOIN` table as `b`. All selected columns are emitted with these aliases in the generated SQL (e.g., `SELECT a.period, a.metric_value FROM table_1 a LEFT JOIN table_2 b ON a.id = b.id`).
        - After finishing the flow the editor shows a generated SQL text area. The user can still edit the SQL by hand; the edited SQL is persisted on Save.

        Customized mode:
        - The user can paste/type arbitrary SQL into a free-text field; this will be saved as-is.

        ## Persistence
        - Node JSON is persisted to `localStorage` under the key `factor_nodes_v1`.
        - `sql_query` nodes store their final SQL in `inputs.query` and may also persist `_from` and `_join` helper fields.

        ## UX notes & TODOs
        - SELECT ordering currently uses the browser's multi-select ordering; if deterministic ordering is required, add an explicit ordering UI (up/down controls or draggable chips).
        - Multiple WHERE conditions (AND/OR) are not yet supported; consider an 'Add condition' UI for complex filters.
        - Server-side saving of `node_config.json` was discussed but not applied; if you want server persistence, I can add an API endpoint and write-safe handling.

        ---

        This spec mirrors the current implementation. If you'd like any behavior changed (different alias letters, deterministic SELECT ordering, richer WHERE builder, or server-backed config saving), tell me which item to implement next and I'll proceed.
        """














