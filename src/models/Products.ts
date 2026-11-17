import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  sizes: string[]; // Added for dynamic size management
  discountPercentage?: number; 
  saleEndDate?: Date | null;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  images: { type: [String], required: true },
  sizes: { type: [String], default: [] }, // Array of available sizes (e.g., ["7", "8"] or ["S", "M"])
  discountPercentage: { type: Number, default: 0 }, 
  saleEndDate: { type: Date, default: null },
}, { timestamps: true });

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;