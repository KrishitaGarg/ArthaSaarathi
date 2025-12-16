const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
    },

    stage: {
      type: String,
      default: "inquiry",
    },

    name: {
      type: String,
    },

    phone: {
      type: String,
    },

    income: {
      type: Number,
    },

    loan_amount: {
      type: Number,
    },

    kyc_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    risk_score: {
      type: Number,
    },

    eligibility_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    offers: {
      type: Array,
    },

    selected_offer: {
      type: Object,
    },

    sanction_letter_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", sessionSchema);
