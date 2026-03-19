import mongoose from "mongoose";
import { Schema } from "mongoose";

const ShopSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop_name: {
      type: String,
      required: true,
    },
    shop_address: {
      type: String,
      required: true,
    },
    shop_latitude: {
      type: String,
      required: true,
    },
    shop_longitude: {
      type: String,
      required: true,
    },
    shop_profile: {
      type: String,
    },
    is_Active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Shop = mongoose.model("Shop", ShopSchema);
export default Shop;
