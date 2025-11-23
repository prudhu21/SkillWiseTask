import React, { useEffect, useState } from 'react';
import API from '../services/api';

type InventoryHistory = {
  id: number;
  change_date: string;
  old_quantity: number;
  new_quantity: number;
  user_info?: string | null;
};

type Props = {
  productId: number;
  onClose: () => void;
};

const HistorySidebar: React.FC<Props> = ({ productId, onClose }) => {
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await API.get<InventoryHistory[]>(`/products/${productId}/history`);
        if (!cancelled) setHistory(res.data);
      } catch (err) {
        console.error('history err', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <aside style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: '#fff', borderLeft: '1px solid #ddd', padding: 16, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Inventory History</h3>
        <button onClick={onClose}>Close</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div>
          {history.length === 0 ? <div>No history available</div> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.map(h => (
                <li key={h.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                  <div style={{ fontSize: 12, color: '#555' }}>{new Date(h.change_date).toLocaleString()}</div>
                  <div>Old: {h.old_quantity} → New: {h.new_quantity}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>By: {h.user_info ?? 'system'}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
};

export default HistorySidebar;
