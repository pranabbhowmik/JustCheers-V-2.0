import mongoose from "mongoose";
import { Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    delivery_partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
    },
    total_amound: {
      type: Number,
      required: true,
    },
    order_status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "packing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    Payment_Status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    delivery_address: {
      type: String,
      required: true,
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;
