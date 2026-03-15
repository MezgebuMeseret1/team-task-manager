import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: String,

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Task workflow
    status: {
      type: String,
      enum: ["todo", "accepted", "rejected", "in-progress", "completed"],
      default: "todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // ⭐ Task payment rate
    rate: {
      type: Number,
      required: true,
      default: 0,
    },

    // ⭐ Billable task fields
    billable: {
      type: Boolean,
      default: false,
    },

    hours: {
      type: Number,
      default: 0,
    },

    // ⭐ Invoice reference
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    // ⭐ Quick invoice status for UI
    invoiceStatus: {
      type: String,
      enum: ["not-invoiced", "pending", "approved", "paid"],
      default: "not-invoiced",
      index: true,
    },

    dueDate: Date,

    // ⭐ When task completed
    completedAt: Date,

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Soft delete filter
taskSchema.pre(/^find/, function () {
  this.find({ isDeleted: false });
});

export default mongoose.model("Task", taskSchema);