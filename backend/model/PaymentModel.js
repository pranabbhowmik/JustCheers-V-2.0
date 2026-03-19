import mongoose from "mongoose";
import { Schema } from "mongoose";

const PaymentSchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
    },
    payment_getway: {
      type: String,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
    },
    transaction_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const PaymentModel = mongoose.model("Payment", PaymentSchema);

export default PaymentModel;
