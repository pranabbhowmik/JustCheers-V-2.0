import mongoose from "mongoose";
import { Schema } from "mongoose";

const deliveryPartnerSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    is_online: {
      type: Boolean,
      default: false,
    },
    delivery_profile: {
      type: String,
    },

    vehicle_type: {
      type: String,
      enum: ["bike", "cycle", "scooter", "electric_scooter"],
      required: true,
    },
    license_number: {
      type: String,
      required: true,
    },
    current_latitude: {
      type: String,
      default: 0,
    },
    current_longitude: {
      type: String,
      default: 0,
    },
    last_location_update: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const DeliveryPartner = mongoose.model(
  "DeliveryPartner",
  deliveryPartnerSchema,
);
export default DeliveryPartner;
