import { referrerPolicy } from "helmet";
import mongoose from "mongoose";
import { Schema } from "mongoose";

const DeliverySchema = new Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    delivery_partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
    },
    latitude: {
      type: String,
    },
    longitude: {
      type: String,
    },
  },
  { timestamps: true },
);

const Delivery = mongoose.model("Delivery", DeliverySchema);
export default Delivery;
