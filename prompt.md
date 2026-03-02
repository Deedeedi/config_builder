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











