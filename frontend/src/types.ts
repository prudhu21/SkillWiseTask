// frontend/src/types.ts
export type Product = {
  id: number;
  name: string;
  unit?: string | null;
  category?: string | null;
  brand?: string | null;
  stock: number;
  status?: string | null;
  image?: string | null;
};

export type InventoryHistory = {
  id: number;
  product_id: number;
  old_quantity: number;
  new_quantity: number;
  change_date: string;
  user_info?: string | null;
};

export type User = {
  id: string;
  username: string;
  email?: string;
  role?: string;
};
