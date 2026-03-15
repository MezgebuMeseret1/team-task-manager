import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "paid"],
      default: "draft",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    dueDate: Date,

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    taskInvoiced: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Always exclude deleted invoices
invoiceSchema.pre(/^find/, function () {
  this.find({ isDeleted: false });
});

// Prevent duplicate invoices per task
invoiceSchema.index(
  { task: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export default mongoose.model("Invoice", invoiceSchema);