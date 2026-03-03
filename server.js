const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// In-memory task list (simple)
let tasks = [
  { id: 1, title: "Learn REST", completed: false },
  { id: 2, title: "Build API", completed: false },
];

// Helper to generate next id
function getNextId() {
  const maxId = tasks.reduce((mx, t) => Math.max(mx, t.id), 0);
  return maxId + 1;
}

// GET all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// GET task by ID
app.get("/tasks/:id", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// POST create new task
app.post("/tasks", (req, res) => {
  const title = String(req.body.title || "").trim();
  if (!title) return res.status(400).json({ message: "Title is required" });

  const newTask = { id: getNextId(), title, completed: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT update task
app.put("/tasks/:id", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);

  if (!task) return res.status(404).json({ message: "Task not found" });

  if (typeof req.body.title === "string") {
    const newTitle = req.body.title.trim();
    if (newTitle) task.title = newTitle;
  }
  if (typeof req.body.completed === "boolean") {
    task.completed = req.body.completed;
  }

  res.json(task);
});

// DELETE task
app.delete("/tasks/:id", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const idx = tasks.findIndex((t) => t.id === id);

  if (idx === -1) return res.status(404).json({ message: "Task not found" });

  tasks.splice(idx, 1);
  res.json({ message: "Task deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
