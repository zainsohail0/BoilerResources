// models/PlannerTask.js
import mongoose from 'mongoose';

const plannerTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // assuming auth
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('PlannerTask', plannerTaskSchema);