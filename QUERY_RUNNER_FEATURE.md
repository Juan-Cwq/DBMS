# Query Runner Feature

## Overview

A MySQL Workbench-inspired query execution and management interface that allows you to run, save, and manage SQL queries.

## Features

### 🎯 Query Editor
- **Syntax-aware textarea** for writing SQL queries
- **Copy to clipboard** - Quick copy button
- **Download query** - Save queries as `.sql` files
- **Monospace font** for better code readability

### ▶️ Query Execution
- **Run Query button** - Execute SQL with visual feedback
- **Simulated execution** - Demonstrates query results without a real database
- **Execution timing** - Shows query execution time
- **Result display**:
  - **SELECT queries**: Table view with columns and rows
  - **INSERT/UPDATE/DELETE**: Affected rows count
  - **CREATE/ALTER**: Success messages

### 💾 Save Queries
- **Save with custom names** - Organize your frequently used queries
- **Persistent storage** - Saved in browser localStorage
- **Quick load** - Click any saved query to load it into the editor
- **Delete saved queries** - Remove queries you no longer need

### 📜 Query History
- **Automatic tracking** - Every executed query is saved
- **Last 50 queries** - Keeps recent history
- **Timestamp tracking** - See when each query was run
- **Result preview** - View what each query returned
- **Load from history** - Rerun previous queries instantly

### 🎨 UI Features
- **Clean, modern interface** inspired by MySQL Workbench
- **Smooth animations** with Framer Motion
- **Responsive design** - Works on all screen sizes
- **Dark/Light theme support** via DaisyUI

## How to Use

### 1. Access Query Runner
Click the **"Query Runner"** tab in the dashboard

### 2. Write a Query
Type or paste your SQL query in the editor:
```sql
SELECT * FROM customers WHERE loyalty_points > 100;
```

### 3. Run the Query
Click the **"Run Query"** button to execute

### 4. View Results
- **SELECT queries**: See data in a table
- **Other queries**: See success message and affected rows

### 5. Save for Later
Click **"Save Query"**, enter a name, and it's saved for future use

### 6. Access History
Click **"History"** to see all previously executed queries

## Example Queries to Try

### SELECT Query
```sql
SELECT id, name, email FROM users WHERE created_at > '2024-01-01';
```

### CREATE TABLE
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);
```

### INSERT Data
```sql
INSERT INTO customers (name, email, phone) 
VALUES ('John Doe', 'john@example.com', '555-0123');
```

### UPDATE Records
```sql
UPDATE orders SET status = 'completed' WHERE order_id = 123;
```

### DELETE Records
```sql
DELETE FROM temp_data WHERE created_at < '2023-01-01';
```

## Technical Details

### Simulated Execution
The Query Runner simulates database execution:
- **SELECT**: Returns sample data with 3 rows
- **CREATE**: Returns success message
- **INSERT/UPDATE/DELETE**: Returns random affected row count
- **Execution time**: Random 5-100ms for realism

### Storage
- **Saved Queries**: `localStorage.schemacraft_saved_queries`
- **Query History**: `localStorage.schemacraft_query_history`
- **Max History**: 50 most recent queries

### Integration
- **Works with AI-generated SQL** - Generated queries can be loaded into Query Runner
- **Standalone use** - Can also write queries from scratch
- **Export/Import ready** - Easy to extend with real database connections

## Future Enhancements

Potential features for future versions:
- 🔌 **Real database connections** (PostgreSQL, MySQL, SQLite)
- 📊 **Query explain plans** and optimization suggestions
- 🔍 **Syntax highlighting** in the editor
- 📈 **Query performance analytics**
- 🗂️ **Organize saved queries** into folders
- 🔄 **Import/Export** saved queries
- 👥 **Share queries** with team members
- 🎯 **Query templates** for common operations

## Benefits

✅ **Learn SQL** - Practice queries without setting up a database  
✅ **Test AI-generated code** - Verify generated SQL works correctly  
✅ **Build query library** - Save and organize useful queries  
✅ **Quick prototyping** - Test query logic before production  
✅ **Educational** - Great for learning and teaching SQL  

---

**Built with React, Framer Motion, and DaisyUI** 🚀
