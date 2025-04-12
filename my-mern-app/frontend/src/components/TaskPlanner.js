import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001";

const TaskPlanner = () => {
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        setUserId(res.data._id);
        fetchTasks(res.data._id);
      } catch (err) {
        console.error("❌ Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  const fetchTasks = async (uid) => {
    try {
      const res = await axios.get(`${API_URL}/api/planner/${uid}`);
      setTasks(res.data);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      console.error("❌ Cannot submit: userId is missing");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/planner`, { ...form, userId });
      setForm({ title: "", description: "", dueDate: "", priority: "medium" });
      fetchTasks(userId);
    } catch (err) {
      console.error("❌ Error creating task:", err);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await axios.patch(`${API_URL}/api/planner/${task._id}`, { completed: !task.completed });
      fetchTasks(userId);
    } catch (err) {
      console.error("❌ Error updating task:", err);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high": return "border-red-500";
      case "medium": return "border-yellow-500";
      case "low": return "border-green-500";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 text-black dark:text-white">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 Personal Task Planner</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            type="text"
            required
            placeholder="Task title"
            className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
          <input
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            type="date"
            required
            className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description (optional)"
            className="p-2 rounded border col-span-1 md:col-span-2 dark:bg-gray-700 dark:text-white"
          />
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Add Task
          </button>
        </form>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task._id} className={`p-4 rounded border-l-4 shadow dark:bg-gray-700 ${getPriorityClass(task.priority)}`}>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task)}
                    className="mt-1"
                  />
                  <div>
                    <h3 className={`font-semibold text-lg ${task.completed ? "line-through text-gray-500" : "text-gray-900 dark:text-white"}`}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Due: {task.dueDate.slice(0, 10)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No tasks yet. Add one above to get started!!</p>
        )}
      </div>
    </div>
  );
};

export default TaskPlanner;
