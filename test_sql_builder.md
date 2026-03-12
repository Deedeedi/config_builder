# SQL Builder Implementation Test

## Test Cases

### Test 1: Open app and create a sql_query node
1. Click "Add Node"
2. Set display name to "Test SQL Query"
3. Set type to "sql_query"
4. Verify sql-builder section appears

### Test 2: SELECT MODE - Basic Query
1. In SELECT MODE, select columns from SELECT dropdown
2. Select a table from FROM dropdown
3. Verify SQL auto-generates with "SELECT col1, col2 FROM table_name"

### Test 3: SELECT MODE - No columns selected
1. Clear all SELECT selections
2. Verify SQL shows "SELECT * FROM table_name"

### Test 4: FROM Table Change
1. Select "table_1" from FROM
2. Select some columns in SELECT
3. Change FROM to "table_2"
4. Verify: SELECT gets cleared, WHERE conditions cleared, column pool updates

### Test 5: WHERE - Single Condition
1. SELECT a column from WHERE dropdown
2. Select operator (e.g., "=")
3. Enter a value
4. Click "+ Add WHERE Condition"
5. Verify WHERE appears in SQL as "WHERE column = value"

### Test 6: WHERE - Multiple Conditions with AND/OR
1. Add first WHERE condition: period = 202501
2. Add second WHERE condition with AND: metric_name = sales
3. Click AND dropdown and change to OR
4. Verify SQL shows proper AND/OR logic

### Test 7: BETWEEN Operator
1. Add WHERE with BETWEEN operator
2. Enter "100, 200"
3. Verify SQL shows "BETWEEN 100 AND 200"

### Test 8: IN Operator
1. Add WHERE with IN operator
2. Enter "val1, val2, val3"
3. Verify SQL shows "IN (val1, val2, val3)"

### Test 9: Mode Switching - SELECT to CUSTOMIZED
1. In SELECT MODE, manually edit SQL (add extra text)
2. Verify mode auto-switches to CUSTOMIZED MODE
3. Verify SELECT MODE controls disappear

### Test 10: Mode Switching - CUSTOMIZED to SELECT
1. In CUSTOMIZED MODE, type custom SQL
2. Switch dropdown to SELECT MODE
3. Verify SELECT MODE controls appear
4. Verify all fields reset

### Test 11: Clear/Reset Button
1. Configure SELECT, FROM, WHERE
2. Click "Clear/Reset" button
3. Verify all fields are cleared and SQL is empty

### Test 12: Save and Load
1. Configure a SQL query in SELECT MODE
2. Click Save
3. Click another node, then click back on this node
4. Verify all selections are restored

