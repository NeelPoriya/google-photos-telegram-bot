import mongoose, { Schema } from "mongoose";

const RequestSchema = new Schema(
  {
    chat_id: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message_id: {
      type: Number,
    },
    request: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "SENT"],
    },
    download_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Request = mongoose.model("Request", RequestSchema);

export default Request;
