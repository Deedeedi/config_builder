As a full stack developer, your task to build a GUI with javascript, html, css for user to edit and visualize node which is defined in the format of json below:
```json
"node_1":
{
    "type": "sql_query",
    "inputs":
    {
        "query": "select * from table_1 where period = {{current_period}}",
        "table_1": "table_1_name",
        "current_period": 202503
    },
    "meta_data":{
        "display_name": "node name to display",
        "parent_node" : "node_2",
        "child_node": ["node_1_1", "node_1_2"]
    }

}

```
## Diagram Canvas
* Limit the maximum number of nodes displayed in the UI to 50.
* Visualize the hierachy in the UI by boxes and arrows through the relation defined in "meta_data". 
    - use arrows to suggest relation. Always direct from children to parents. The arrow should start from one object's border and arrow shape's tip (instead of center) should point to another object's border (instead of center).
    - use rectangle lines instead of curve lines for arrows. Avoid overlaps when auto-arranging. Automatically balance the nodes in the GUI
* User can interactively edit on each node by two approaches:
    -  through a form object. 
    - by dragging close to another node to build connection (i.e. dragged node should be child node of the closer node)
* Automatically render and balance node location based on its hierachy. With parent node at the top and child nodes at bottom.
* Users can zoom in/out by mouse or touchpad. Also can re-center with a rectangle icon at the bottom.
* Double clicking on background area to create a new node. The newly added node should not change layout of existing node

## Node Editor
* Create a user config file in node_config.json.
* Make `node_type` to be a drop list with restricted values defined in node_config.json. Users administrator can add/modify/delete allowed values for it in the config file. Currentlythe value allowed should be ["sql_query", "llm_query", "human_approval", "template"]
* For `inputs`. Depending on `node_type`:
    - if `node_type` == "sql_query", make a conditional drop list:
        > first layer: user choose from ["pre-defined", "customized"]
        > second layer: when user chooses "predefined", show below in mutlple rows:
            1. Show `SELECT`, following up with column names selection from several rectangle labels, which are defined in node_config.json>"metric_schema". Users can drag as many column name labels from all column names and put them in order behind `SELECT`. After this step is done, user clicks on a check button on the same row and proceed to next row.
            metric_schema should be:
                "metric_schema":{
                    "period": "str",
                    "metric_name": "str",
                    "metric_value": "float",
                    "metric_unit": "str",
                    "inner_boundary": "str",
                    "inner_boundary": "str"
                }
            2. Show `FROM`, following up with a table name selection. Use the same way show all table names options (i.e. rectangle labels), which is also defined in node_config.json>"input_tables". User can only select one table in this row. After this step is done, user clicks on a check button on the same row and proceed to next row.
            3. Show `WHERE`, following up with available column names in several rectangle labels (similar to step 1). After user select one column label, show available SQL common operators (e.g. [=, >, <, >=, <=, in, between]). After selection, user can put values in a textbox following up. After this step is done, user clicks on a check button on the same row and proceed to next row. User can also skip this step by clicking check button directly.
            4. Show `JOIN`, users can select `LEFT JOIN`, `RIGHT JOIN`, `INNER JOIN` and `CROSS JOIN`, following up with a table name selection from node_config.json>"input_tables". After this step is done, user clicks on a check button on the same row and proceed to next row. User can also click on skip button in this step to skip the step directly.
            5. If 4 is not skipped by user, show `ON`, where users can select columns to be merged from both left sided table and right sided table.  After this step is done, user clicks on a check button on the same row and proceed to next row. User cannot skip this step if 4 is not skipped. Otherwise, this row will conditionally not showing up
        After all those steps are done, show a textbox with a complete accurate SQL query automatically constructed with combined all information above. Users can still modify in the textbox.
        
        when user chooses "customized", show a textbox for user to input the sql query directly.

            
            











