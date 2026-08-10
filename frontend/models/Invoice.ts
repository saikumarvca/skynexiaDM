import * as mongoose from "mongoose";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemMasterId?: mongoose.Types.ObjectId;
}

export interface IInvoice extends mongoose.Document {
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  lineItems: IInvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  paidAt?: Date;
  sentAt?: Date;
  isRecurring: boolean;
  recurringIntervalDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new mongoose.Schema<IInvoice>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    invoiceNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"],
      default: "DRAFT",
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true, default: 0 },
        itemMasterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ItemMaster",
          required: false,
        },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    notes: { type: String },
    paidAt: { type: Date },
    sentAt: { type: Date },
    isRecurring: { type: Boolean, default: false },
    recurringIntervalDays: { type: Number },
  },
  { timestamps: true },
);

InvoiceSchema.index({ clientId: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });

const Invoice =
  (mongoose.models.Invoice as mongoose.Model<IInvoice> | undefined) ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
