"use client";

import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, ShoppingCart, X } from "lucide-react";

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/wishlist/");
      const list = Array.isArray(res) ? res : res?.results || [];
      setItems(list);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function remove(productId: number) {
    await apiDelete(`/api/wishlist/${productId}/`);
    await load();
  }

  async function addToCart(item: any) {
    await apiPost("/api/cart/items/", { product_id: item.product?.id || item.product_id, quantity: 1 });
    alert("Added to cart");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
        <p className="text-sm text-slate-500">{items.length} saved items</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-600 font-medium">Your wishlist is empty</p>
          <Link href="/products" className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item: any) => {
            const product = item.product || item;
            return (
              <div key={item.id || product.id} className="bg-white rounded-lg border border-slate-200 p-4 relative">
                <button onClick={() => remove(item.id || product.id)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </button>
                <Link href={`/products/${product.id}`}>
                  <img src={product.image_external_url || product.image || "/placeholder.png"} alt={product.name} className="w-full h-40 object-cover rounded-md" />
                </Link>
                <div className="mt-3">
                  <Link href={`/products/${product.id}`} className="font-medium text-slate-900 hover:text-indigo-600 line-clamp-1">{product.name}</Link>
                  <div className="text-lg font-bold text-indigo-600 mt-1">৳{parseFloat(product.price || 0).toLocaleString()}</div>
                  <button onClick={() => addToCart(item)} className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}