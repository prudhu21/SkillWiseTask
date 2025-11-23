import React, { useRef, useState } from 'react';
import API from '../services/api';

type Props = {
  onImported?: () => void;
};

const ImportExport: React.FC<Props> = ({ onImported }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('csvFile', file);
    try {
      const res = await API.post('/products/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert(`Added: ${res.data.added}, Skipped: ${res.data.skipped}`);
      onImported?.();
    } catch (err: any) {
      alert('Import failed: ' + (err?.response?.data?.message || err?.message));
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const exportCSV = async () => {
    try {
      const res = await API.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + (err?.response?.data?.message || err?.message));
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-outline-primary"  style={{borderRadius:'10px'}} onClick={() => fileRef.current?.click()} disabled={loading}>
        {loading ? 'Importing...' : 'Import'}
      </button>

      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onFileChange} />

      <button className="btn btn-outline-primary"  style={{borderRadius:'10px'}} onClick={exportCSV}>Export</button>
    </div>
  );
};

export default ImportExport;
