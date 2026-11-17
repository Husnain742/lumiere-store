import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  image: { type: String }, // Optional real photo uploaded by customer
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

const Review = mongoose.model("Review", ReviewSchema);
export default Review;