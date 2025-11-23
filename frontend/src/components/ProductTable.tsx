import React from 'react';
import type { Product } from '../types';
import ProductRow from './ProductRow';

type Props = {
  products: Product[];
  onUpdate: (p: Product) => void;
  onDelete?: (id: number) => void;
  onViewHistory: (id: number) => void;
  loading?: boolean;
};

const ProductTable: React.FC<Props> = ({ products, onUpdate, onDelete, onViewHistory, loading }) => {
  if (loading) return <div>Loading...</div>;
  const list = Array.isArray(products) ? products : [];
  if (list.length === 0) return <div>No products</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{fontFamily:"Arial, sans-serif",fontSize:'20px'}}>
          <th>Image</th>
          <th>Name</th>
          <th>Unit</th>
          <th>Category</th>
          <th>Brand</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {list.map((p) => (
          <ProductRow key={p.id} product={p} onUpdated={onUpdate} onViewHistory={onViewHistory} onDeleted={onDelete} />
        ))}
      </tbody>
    </table>
  );
};

export default ProductTable;
