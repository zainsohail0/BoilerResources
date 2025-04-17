// routes/planner.js
import express from 'express';
import PlannerTask from '../models/Planner.js';

const router = express.Router();

// 🔹 Get all tasks for a user
router.get('/:userId', async (req, res) => {
  try {
    const tasks = await PlannerTask.find({ userId: req.params.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Create a new task
router.post('/', async (req, res) => {
  try {
    const task = new PlannerTask(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🔹 Update task completion (or other fields)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await PlannerTask.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🔹 Delete a task
router.delete('/:id', async (req, res) => {
  try {
    await PlannerTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
