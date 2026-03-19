import mongoose from "mongoose";
import { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AlcoholItem",
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const OrderItem = mongoose.model("OrderItem", OrderItemSchema);
export default OrderItem;
