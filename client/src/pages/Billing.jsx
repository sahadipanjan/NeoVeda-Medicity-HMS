import React, { useState, useEffect, useCallback } from 'react';
import { billingAPI } from '../services/api';

const STATUS_BADGES = { 'Pending': 'badge-warning', 'Partial': 'badge-info', 'Paid': 'badge-success', 'Cancelled': 'badge-danger', 'Refunded': 'badge-purple' };
const PAY_MODES = ['Cash', 'Card', 'UPI', 'NEFT', 'Insurance', 'Mixed'];

export default function Billing() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filterStatus, setFilterStatus] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showPay, setShowPay] = useState(null);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);
    const [payMode, setPayMode] = useState('Cash');

    const [form, setForm] = useState({
        patient_id: '', department_id: '', items: [{ description: '', item_type: 'Consultation', quantity: 1, unit_price: '' }],
        discount: 0, tax_percent: 18, notes: ''
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 }; if (filterStatus) params.payment_status = filterStatus;
            const res = await billingAPI.list(params);
            setInvoices(res.data); setPagination(res.pagination);
        } catch { } finally { setLoading(false); }
    }, [page, filterStatus]);

    useEffect(() => { load(); }, [load]);
    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const addItem = () => setForm({ ...form, items: [...form.items, { description: '', item_type: 'Procedure', quantity: 1, unit_price: '' }] });
    const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
    const updateItem = (i, field, val) => {
        const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items });
    };

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await billingAPI.create(form); showToast('Invoice created'); setShowCreate(false); load();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const handlePayment = async (id) => {
        try {
            await billingAPI.recordPayment(id, 'Paid', payMode);
            showToast(`Payment recorded (${payMode})`); setShowPay(null); load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="fade-in">
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

            <div className="page-header">
                <div><h1>💰 Billing</h1><p className="page-subtitle">Invoice management & payment tracking</p></div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>➕ Create Invoice</button>
            </div>

            <div className="search-bar">
                <select className="form-select" style={{ maxWidth: 200 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {['Pending', 'Partial', 'Paid', 'Cancelled', 'Refunded'].map(s => <option key={s}>{s}</option>)}
                </select>
                <button className="btn btn-ghost" onClick={load}>🔄 Refresh</button>
            </div>

            {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                <>
                    <div className="table-container">
                        <table>
                            <thead><tr>
                                <th>Invoice #</th><th>Patient</th><th>Total (₹)</th><th>GST (₹)</th><th>Grand Total (₹)</th><th>Status</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr><td colSpan="7"><div className="empty-state"><p>No invoices found</p></div></td></tr>
                                ) : invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td style={{ fontWeight: 600 }}>{inv.invoice_no}</td>
                                        <td>{inv.patient_name} {inv.patient_last_name}</td>
                                        <td>₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                                        <td>₹{Number(inv.tax_amount).toLocaleString('en-IN')}</td>
                                        <td style={{ fontWeight: 700 }}>₹{Number(inv.net_amount).toLocaleString('en-IN')}</td>
                                        <td><span className={`badge ${STATUS_BADGES[inv.payment_status] || 'badge-info'}`}>{inv.payment_status}</span></td>
                                        <td>
                                            {inv.payment_status === 'Pending' && (
                                                <button className="btn btn-success btn-sm" onClick={() => setShowPay(inv.id)}>💳 Pay</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination?.totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span className="pagination-info">Page {page} of {pagination.totalPages}</span>
                            <button disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}

            {/* Payment Modal */}
            {showPay && (
                <div className="modal-overlay" onClick={() => setShowPay(null)}>
                    <div className="modal slide-up" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>💳 Record Payment</h2><button className="modal-close" onClick={() => setShowPay(null)}>×</button></div>
                        <div className="form-group"><label className="form-label">Payment Mode</label>
                            <select className="form-select" value={payMode} onChange={e => setPayMode(e.target.value)}>
                                {PAY_MODES.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                            <button className="btn btn-ghost" onClick={() => setShowPay(null)}>Cancel</button>
                            <button className="btn btn-success" onClick={() => handlePayment(showPay)}>✅ Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal slide-up" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>➕ Create Invoice</h2><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
                        <form onSubmit={handleCreate}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Patient ID *</label>
                                    <input className="form-input" type="number" required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Department ID *</label>
                                    <input className="form-input" type="number" required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} /></div>
                            </div>

                            <h4 style={{ marginBottom: 12 }}>Line Items</h4>
                            {form.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                                    <div style={{ flex: 2 }}>
                                        {i === 0 && <label className="form-label">Description</label>}
                                        <input className="form-input" required placeholder="Service" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {i === 0 && <label className="form-label">Category</label>}
                                        <select className="form-select" value={item.item_type} onChange={e => updateItem(i, 'item_type', e.target.value)}>
                                            {['Consultation', 'Procedure', 'Lab Test', 'Radiology', 'Pharmacy', 'Ward Charge', 'Surgery', 'Other'].map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ width: 60 }}>
                                        {i === 0 && <label className="form-label">Qty</label>}
                                        <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div style={{ width: 100 }}>
                                        {i === 0 && <label className="form-label">Price (₹)</label>}
                                        <input className="form-input" type="number" required placeholder="₹" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                                    </div>
                                    {form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)}>✕</button>}
                                </div>
                            ))}
                            <button type="button" className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 16 }}>➕ Add Item</button>

                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Discount (₹)</label>
                                    <input className="form-input" type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">GST %</label>
                                    <input className="form-input" type="number" value={form.tax_percent} onChange={e => setForm({ ...form, tax_percent: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Notes</label>
                                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
