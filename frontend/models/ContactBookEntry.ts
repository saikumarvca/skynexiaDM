import * as mongoose from "mongoose";

export interface IContactBookEntry extends mongoose.Document {
  ownerUserId: string;
  displayName: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactBookEntrySchema: mongoose.Schema = new mongoose.Schema(
  {
    ownerUserId: { type: String, required: true, index: true },
    displayName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    notes: { type: String, trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

ContactBookEntrySchema.index({ ownerUserId: 1, updatedAt: -1 });
ContactBookEntrySchema.index({ tags: 1 });

const ContactBookEntry =
  (mongoose.models.ContactBookEntry as
    | mongoose.Model<IContactBookEntry>
    | undefined) ||
  mongoose.model<IContactBookEntry>(
    "ContactBookEntry",
    ContactBookEntrySchema,
  );

export default ContactBookEntry;
