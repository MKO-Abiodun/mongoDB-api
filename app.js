require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const app = express();
const logRequest = require('./middleware/logger.js'); // Import the logger middleware
const { validateTodo, validatePatchTodo } = require('./middleware/validator.js');
const errorHandler = require('./middleware/errorHandler.js'); // Import the error handler middleware
const connectDB = require('./database/db.js'); // Import the database connection function
const Todo = require('./model/todo.model.js'); // Import the Todo model

app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS for all routes
app.use(logRequest); // Use the logger middleware for all routes
connectDB(); // Connect to the database


// GET All - Read
app.get('/todos', async (req, res) => {

  const todos = await Todo.find(); // Fetch all todos from the database
  res.status(200).json(todos); // Send array as JSON
});

// GET Completed - MUST be BEFORE /:id
app.get('/todos/completed', async (req, res, next) => {
 try {
  const completed = await Todo.find({ completed: true });
  res.json(completed); // Custom Read!
 }
 catch (error) {
  next(error); // Pass error to the error-handling middleware
 }
});

//Get all - Dynamic  with query parameters
app.get('/todos', async (req, res, next) => {
  try {
    const { completed } = req.query;
    let filter = {};
    if (completed === 'true') {
      filter.completed = true;
    } else if (completed === 'false') {
      filter.completed = false;
    }
    const todos = await Todo.find(filter);
    res.status(200).json(todos);
  } catch (error) {
    next(error); // Pass error to the error-handling middleware
  }
});

// GET Single - Task 1 - MUST be AFTER /active and /completed
app.get('/todos/:id', async (req, res, next) => {
 try {
  const todo = await Todo.findById(req.params.id);
  if (!todo) return res.status(404).json({ message: 'Invalid ID' });
  res.status(200).json(todo);
 }
 catch (error) {
  next(error); // Pass error to the error-handling middleware
 }
});

// POST New - Create - WITH VALIDATION - Task 2
app.post('/todos', validateTodo, async (req, res, next) => {
  try {
  const { task, completed } = req.body;
  const newTodo = new Todo({
    task,
    completed: completed || false, // Default to false if not provided
  })
  await newTodo.save(); // Save to the database

  res.status(201).json(newTodo); // Echo back
}
catch (error) {
  next(error); // Pass error to the error-handling middleware
}
});

// PATCH Update - Partial
app.patch('/todos/:id', validatePatchTodo, async (req, res, next) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!todo) return res.status(404).json({ message: 'Invalid ID' });
    res.status(200).json(todo);
  }
  catch (error) {
    next(error); // Pass error to the error-handling middleware
  }
});

// DELETE Remove
app.delete('/todos/:id', async (req, res, next) => {
 try {
   const todos = await Todo.findByIdAndDelete(req.params.id)
  if (todos.length === initialLength) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(200).json({ message: 'Todo deleted successfully' });
 } // Silent success
 catch (error) {
  next(error); // Pass error to the error-handling middleware
 }
});

app.use(errorHandler); // Use the error handler middleware

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
