const mongoose = require("mongoose");

const kycDocumentSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    pan: {
      type: String, // filename
      required: true,
    },
    salary: {
      type: String, // filename
      required: true,
    },
    employer: {
      type: String,
    },
    kyc_status: {
      type: String,
      enum: ["verified", "rejected"],
      required: true,
    },
    risk_score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KycDocument", kycDocumentSchema);
