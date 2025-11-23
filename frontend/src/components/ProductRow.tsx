import React, { useState } from 'react';
import API from '../services/api';
import type { Product } from '../types';

type Props = {
  product: Product;
  onUpdated: (p: Product) => void;
  onViewHistory: (id: number) => void;
  onDeleted?: (id: number) => void;
};

const TOAST_DURATION = 3500; 

const UPLOADED_FALLBACK_IMAGE = '/mnt/data/a3417286-95ca-4731-aa4f-3532ce8bf4e5.png';

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  try {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('role', 'status');
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.zIndex = '99999';
    el.style.minWidth = '180px';
    el.style.maxWidth = '360px';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    el.style.color = '#fff';
    el.style.fontSize = '13px';
    el.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
    el.style.marginTop = '8px';
    el.style.opacity = '0';
    el.style.transition = 'transform 220ms ease, opacity 220ms ease';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '10px';
    el.style.paddingRight = '12px';

    if (type === 'success') {
      el.style.background = 'linear-gradient(90deg,#10B981,#059669)';
    } else if (type === 'error') {
      el.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
    } else {
      el.style.background = 'linear-gradient(90deg,#6b7280,#4b5563)';
    }

    const icon = document.createElement('span');
    icon.style.display = 'inline-flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.borderRadius = '6px';
    icon.style.opacity = '0.95';
    icon.style.background = 'rgba(255,255,255,0.18)';
    icon.style.flex = '0 0 28px';
    icon.style.fontSize = '14px';
    icon.style.fontWeight = '700';
    icon.style.color = '#fff';

    if (type === 'success') icon.textContent = '✓';
    else if (type === 'error') icon.textContent = '!';
    else icon.textContent = 'i';

    const text = document.createElement('div');
    text.style.flex = '1';
    text.style.lineHeight = '1.1';
    text.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.style.marginLeft = '8px';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.color = 'rgba(255,255,255,0.85)';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '14px';
    closeBtn.style.padding = '6px';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => {
      if (el.parentElement) el.parentElement.removeChild(el);
    };

    el.appendChild(icon);
    el.appendChild(text);
    el.appendChild(closeBtn);

    const containerId = 'toast-container-bottom-right';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.right = '20px';
      container.style.bottom = '20px';
      container.style.zIndex = '99998';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      container.style.alignItems = 'flex-end';
      document.body.appendChild(container);
    }
    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });

    const t = setTimeout(() => {
      if (el.parentElement) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        setTimeout(() => {
          try { el.remove(); } catch {}
        }, 220);
      }
      clearTimeout(t);
    }, TOAST_DURATION);
  } catch (e) {
    // fallback
    try { alert(message); } catch {}
  }
}

const ProductRow: React.FC<Props> = ({ product, onUpdated, onViewHistory, onDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Product>({ ...product });
  const [saving, setSaving] = useState(false);

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='%23f3f3f3'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'>No Image</text></svg>"
    );

  const safeImage = (url?: string | null) => {
    if (!url) return UPLOADED_FALLBACK_IMAGE;
    try {
      const lower = url.toLowerCase();
      if (lower.includes('via.placeholder.com') || lower.includes('lh3.googleusercontent.com/pw/')) {
        return `https://picsum.photos/seed/${encodeURIComponent(product.name.replace(/\s+/g, '-'))}/150`;
      }
      return url;
    } catch {
      return UPLOADED_FALLBACK_IMAGE;
    }
  };

  const save = async () => {
    setSaving(true);

    // Defensive cast for stock
    const stockNum = Number(form.stock);
    if (form.stock === null || form.stock === undefined || Number.isNaN(stockNum)) {
      showToast('Stock must be a valid number', 'error');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        unit: form.unit,
        category: form.category,
        brand: form.brand,
        stock: stockNum,
        status: form.status,
        image: form.image,
        userInfo: 'admin@example.com', // replace with actual user from auth when available
      };

      const res = await API.put<Product>(`/products/${product.id}`, payload);
      onUpdated(res.data);
      setIsEditing(false);
      showToast(`Updated "${res.data.name}"`, 'success');
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      const details = err?.response?.data?.details;
      const shown = serverMsg ?? err?.message ?? 'Update failed';
      if (details) {
        showToast(`${shown} — ${details}`, 'error');
      } else {
        showToast(shown, 'error');
      }
      console.error('[ProductRow] update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({ ...product });
    showToast(`Edit cancelled for "${product.name}"`, 'info');
  };

  const handleDelete = async () => {
    if (!confirm(`Delete product "${product.name}"? This cannot be undone.`)) {
      showToast('Delete cancelled', 'info');
      return;
    }
    try {
      await API.delete(`/products/${product.id}`);
      if (onDeleted) onDeleted(product.id);
      showToast(`Deleted "${product.name}"`, 'success');
    } catch (err: any) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Delete failed';
      showToast(msg, 'error');
    }
  };

  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={{ padding: 8 }}>
        <img
          src={safeImage(product.image)}
          alt={product.name}
          style={{ width: 48, height: 48, objectFit: 'cover' }}
          onError={(e) => {
            const targ = e.currentTarget as HTMLImageElement;
            // if the uploaded fallback fails for some reason, use inline placeholder SVG
            if (targ.src !== placeholder) targ.src = placeholder;
          }}
        />
      </td>

      <td style={{ padding: 8 }}>
        {isEditing ? (
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        ) : (
          product.name
        )}
      </td>

      <td style={{ padding: 8 }}>
        {isEditing ? (
          <input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        ) : (
          product.unit
        )}
      </td>

      <td style={{ padding: 8 }}>
        {isEditing ? (
          <input value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        ) : (
          product.category
        )}
      </td>

      <td style={{ padding: 8 }}>
        {isEditing ? (
          <input value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        ) : (
          product.brand
        )}
      </td>

      <td style={{ padding: 8 }}>
        {isEditing ? (
          <input
            type="number"
            value={String(form.stock ?? '')}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            style={{ width: 80 }}
          />
        ) : (
          product.stock
        )}
      </td>

      <td style={{ padding: 8 }}>
        <span style={{ color: product.stock > 0 ? 'green' : 'red' }}>
          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>

      <td style={{ padding: 8 }}>
        {isEditing ? (
          <>
            <button
              onClick={save}
              disabled={saving}
              style={{
                marginLeft: 8,
                color: 'white',
                background: '#31d123ff',
                borderRadius: '5px',
                borderColor: '#10B981',
                width: '60px',
                height: '30px',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                marginLeft: 8,
                color: 'white',
                background: '#eb8c19ff',
                borderRadius: '5px',
                borderColor: '#eb8c19ff',
                width: '60px',
                height: '30px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                marginLeft: 8,
                color: 'white',
                background: '#10B981',
                borderRadius: '5px',
                borderColor: '#10B981',
                width: '60px',
                height: '30px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>

            <button
              onClick={() => onViewHistory(product.id)}
              style={{
                marginLeft: 8,
                color: 'white',
                background: '#5A67D8',
                borderRadius: '5px',
                borderColor: '#5A67D8',
                width: '60px',
                height: '30px',
                cursor: 'pointer',
              }}
            >
              History
            </button>

            <button
              onClick={handleDelete}
              style={{
                marginLeft: 8,
                color: 'white',
                background: 'red',
                borderRadius: '5px',
                borderColor: 'red',
                width: '60px',
                height: '30px',
              }}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

export default ProductRow;
