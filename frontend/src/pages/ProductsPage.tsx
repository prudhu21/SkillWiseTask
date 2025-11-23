import React, { useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import ProductTable from '../components/ProductTable';
import ImportExport from '../components/ImportExport';
import HistorySidebar from '../components/HistorySidebar';
import type { Product } from '../types';
import '../index.css';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchProducts = async (q?: { search?: string; category?: string }) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q?.search) params.search = q.search;
      if (q?.category) params.category = q.category;
      const res = await API.get<Product[]>('/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.error('fetchProducts err', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const setC = new Set<string>();
    products.forEach((p) => { if (p.category) setC.add(p.category); });
    return Array.from(setC);
  }, [products]);

  const onUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const onDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Add product state & handlers
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', unit: '', category: '', brand: '', stock: 0, status: 'active', image: '' });

  const handleAddChange = (field: keyof Product, value: any) => {
    setNewProduct((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const submitNewProduct = async () => {
    if (!newProduct.name || String(newProduct.name).trim() === '') {
      alert('Name is required');
      return;
    }
    try {
      const payload = {
        name: String(newProduct.name).trim(),
        unit: newProduct.unit || '',
        category: newProduct.category || '',
        brand: newProduct.brand || '',
        stock: Number(newProduct.stock || 0),
        status: newProduct.status || 'active',
        image: newProduct.image || ''
      };
      const res = await API.post<Product>('/products', payload);
      // prepend the new product
      setProducts((prev) => [res.data, ...prev]);
      setShowAdd(false);
      setNewProduct({ name: '', unit: '', category: '', brand: '', stock: 0, status: 'active', image: '' });
    } catch (err: any) {
      console.error('create product err', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to create';
      alert(String(msg));
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
          />

          <button
            type="button"
            onClick={() => fetchProducts({ search, category })}
            style={{
              marginLeft: 6,
              background: '#0b5cff',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Search
          </button>

            <select
              className={`form-select ${category === '' ? 'placeholder-select' : ''}`}
              value={category}
              onChange={(e) => {
                const newCat = e.target.value;
                setCategory(newCat);
                // fetch immediately when category changes
                fetchProducts({ search, category: newCat });
              }}
              style={{ width: 220, padding: '6px 8px', borderRadius: 6, border: '1px solid #e6e9ef' }}
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          
          <button className="btn btn-primary" onClick={() => setShowAdd((s) => !s)}>{showAdd ? 'Cancel' : 'Add A New Product'}</button>
        </div>
        <div>
          <ImportExport onImported={() => fetchProducts({ search, category })} />
        </div>
      </header>

      {showAdd && (
        <section className="card" style={{ padding: 12, marginBottom: 12 }}>
          <h5 style={{ marginTop: 0, marginBottom: 8 }}>Add New Product</h5>
          <div style={{ display: 'flex', flexDirection:'column' }}>
            <div>
              <label className="form-label">Name :- </label>
              <input className="form-control" placeholder="Name" value={newProduct.name} onChange={(e) => handleAddChange('name', e.target.value)} />
            </div><br/>
            <div>
              <label className="form-label">Unit :- </label>
              <input className="form-control" placeholder="Unit" value={newProduct.unit ?? ''} onChange={(e) => handleAddChange('unit', e.target.value)} />
            </div><br/>
            <div>
              <label className="form-label">Category :- </label>
              <input className="form-control" placeholder="Category" value={newProduct.category ?? ''} onChange={(e) => handleAddChange('category', e.target.value)} />
            </div><br/>
            <div>
              <label className="form-label">Brand :- </label>
              <input className="form-control" placeholder="Brand" value={newProduct.brand ?? ''} onChange={(e) => handleAddChange('brand', e.target.value)} />
            </div><br/>
            <div>
              <label className="form-label">Stock :- </label>
              <input className="form-control" placeholder="Stock" type="number" value={newProduct.stock ?? 0} onChange={(e) => handleAddChange('stock', Number(e.target.value || 0))} />
            </div><br/>
            <div>
              <label className="form-label">Status :- </label>
              <select className="form-select" value={newProduct.status ?? 'active'} onChange={(e) => handleAddChange('status', e.target.value as any)}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div><br/>
            <div style={{ minWidth: 240 }}>
              <label className="form-label">Image URL :- </label>
              <input className="form-control" placeholder="Image URL" value={newProduct.image ?? ''} onChange={(e) => handleAddChange('image', e.target.value)} />
            </div><br/>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12,justifyContent:'flex-center',marginLeft:'45%' }}>
            <button className="btn btn-primary" onClick={submitNewProduct}>Save</button><br/>
            <button className="btn btn-secondary" onClick={() => { setShowAdd(false); }}>Cancel</button><br/>
          </div>
        </section>
      )}

      <ProductTable products={products} onUpdate={onUpdateProduct} onViewHistory={setSelectedProductId} onDelete={onDeleteProduct} loading={loading} />

      {selectedProductId && <HistorySidebar productId={selectedProductId} onClose={() => setSelectedProductId(null)} />}
    </div>
  );
};

export default ProductsPage;
