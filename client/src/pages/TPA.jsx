import React, { useState, useEffect, useCallback } from 'react';
import { tpaAPI } from '../services/api';

const TABS = [
    { key: 'vendors', icon: '🏢', label: 'TPA Vendors' },
    { key: 'policies', icon: '📋', label: 'Policies' },
    { key: 'preauth', icon: '🔐', label: 'Pre-Auth' },
    { key: 'claims', icon: '📑', label: 'Claims' },
    { key: 'tariffs', icon: '💹', label: 'Tariffs' },
];

const PANEL_TYPES = ['CGHS', 'ECHS', 'Private', 'PSU'];
const ITEM_TYPES = ['Consultation', 'Procedure', 'Lab Test', 'Radiology', 'Pharmacy', 'Ward Charge', 'Surgery', 'Other'];
const PREAUTH_STATUSES = ['Initiated', 'Submitted', 'Query Raised', 'Approved', 'Partially Approved', 'Rejected', 'Enhancement Requested', 'Enhancement Approved', 'Cancelled'];
const CLAIM_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Query Raised', 'Approved', 'Partially Settled', 'Settled', 'Rejected', 'Appealed', 'Closed'];

const STATUS_BADGES = {
    'Initiated': 'badge-info', 'Submitted': 'badge-primary', 'Query Raised': 'badge-warning',
    'Approved': 'badge-success', 'Partially Approved': 'badge-info', 'Rejected': 'badge-danger',
    'Enhancement Requested': 'badge-warning', 'Enhancement Approved': 'badge-success', 'Cancelled': 'badge-danger',
    'Draft': 'badge-secondary', 'Under Review': 'badge-primary', 'Partially Settled': 'badge-info',
    'Settled': 'badge-success', 'Appealed': 'badge-warning', 'Closed': 'badge-secondary',
};

export default function TPA() {
    const [tab, setTab] = useState('vendors');
    const [toast, setToast] = useState(null);
    const showToast = useCallback((msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }, []);

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <h1>🏥 TPA / Insurance</h1>
            </div>

            <div className="tab-bar" style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button key={t.key}
                        className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'vendors' && <VendorsTab showToast={showToast} />}
            {tab === 'policies' && <PoliciesTab showToast={showToast} />}
            {tab === 'preauth' && <PreAuthTab showToast={showToast} />}
            {tab === 'claims' && <ClaimsTab showToast={showToast} />}
            {tab === 'tariffs' && <TariffsTab showToast={showToast} />}
        </div>
    );
}

/* ═══════════════════════════════════════════
   VENDORS TAB
   ═══════════════════════════════════════════ */
function VendorsTab({ showToast }) {
    const [vendors, setVendors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ vendor_code: '', name: '', panel_type: 'CGHS', contact_person: '', phone: '', email: '', empanelment_date: '', expiry_date: '', settlement_tat_days: 30, irdai_registration_no: '', toll_free_helpline: '' });

    const load = useCallback(async () => {
        try { const res = await tpaAPI.vendors(); setVendors(res.data || []); } catch (e) { console.error(e); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await tpaAPI.createVendor(form); showToast('Vendor registered'); setShowForm(false); load(); }
        catch (err) { showToast(err.message || 'Failed to create vendor', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>TPA Vendors ({vendors.length})</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Vendor'}
                </button>
            </div>

            {showForm && (
                <form className="card" style={{ padding: 20, marginBottom: 20 }} onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <div><label className="form-label">Vendor Code *</label>
                            <input className="form-input" required value={form.vendor_code} onChange={e => setForm({ ...form, vendor_code: e.target.value })} placeholder="TPA-MEDI-01" /></div>
                        <div><label className="form-label">Name *</label>
                            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Medi Assist TPA" /></div>
                        <div><label className="form-label">Panel Type *</label>
                            <select className="form-select" value={form.panel_type} onChange={e => setForm({ ...form, panel_type: e.target.value })}>
                                {PANEL_TYPES.map(p => <option key={p}>{p}</option>)}
                            </select></div>
                        <div><label className="form-label">Contact Person</label>
                            <input className="form-input" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
                        <div><label className="form-label">Phone</label>
                            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div><label className="form-label">Email</label>
                            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                        <div><label className="form-label">Empanelment Date</label>
                            <input className="form-input" type="date" value={form.empanelment_date} onChange={e => setForm({ ...form, empanelment_date: e.target.value })} /></div>
                        <div><label className="form-label">Expiry Date</label>
                            <input className="form-input" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
                        <div><label className="form-label">Settlement TAT (days)</label>
                            <input className="form-input" type="number" value={form.settlement_tat_days} onChange={e => setForm({ ...form, settlement_tat_days: parseInt(e.target.value) })} /></div>
                        <div><label className="form-label">IRDAI Reg No</label>
                            <input className="form-input" value={form.irdai_registration_no} onChange={e => setForm({ ...form, irdai_registration_no: e.target.value })} placeholder="003" /></div>
                        <div><label className="form-label">Toll-Free Helpline</label>
                            <input className="form-input" value={form.toll_free_helpline} onChange={e => setForm({ ...form, toll_free_helpline: e.target.value })} placeholder="1800-XXX-XXXX" /></div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">Register Vendor</button>
                </form>
            )}

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="table">
                    <thead><tr>
                        <th>Code</th><th>Name</th><th>IRDAI#</th><th>Panel</th><th>Helpline</th><th>Email</th><th>TAT</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                        {vendors.length === 0 ? (
                            <tr><td colSpan="8"><div className="empty-state"><p>No vendors registered</p></div></td></tr>
                        ) : vendors.map(v => (
                            <tr key={v.id}>
                                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.vendor_code}</td>
                                <td>{v.name}</td>
                                <td style={{ fontFamily: 'monospace' }}>{v.irdai_registration_no || '—'}</td>
                                <td><span className={`badge ${v.panel_type === 'CGHS' ? 'badge-primary' : v.panel_type === 'ECHS' ? 'badge-info' : 'badge-purple'}`}>{v.panel_type}</span></td>
                                <td>{v.toll_free_helpline || v.phone || '—'}</td>
                                <td style={{ fontSize: '0.8rem' }}>{v.email || '—'}</td>
                                <td>{v.settlement_tat_days}d</td>
                                <td><span className={`badge ${v.is_active ? 'badge-success' : 'badge-danger'}`}>{v.is_active ? 'Active' : 'Inactive'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   POLICIES TAB
   ═══════════════════════════════════════════ */
function PoliciesTab({ showToast }) {
    const [policies, setPolicies] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [form, setForm] = useState({
        patient_id: '', tpa_vendor_id: '', policy_number: '', insurance_company: '', plan_name: '',
        policy_start_date: '', policy_end_date: '', sum_insured: '', co_payment_percent: 0,
        deductible_amount: 0, room_rent_limit: '', member_id: '', relation_to_primary: 'Self'
    });

    const load = useCallback(async () => {
        try {
            const [polRes, venRes] = await Promise.all([tpaAPI.policies(), tpaAPI.vendors()]);
            setPolicies(polRes.data || []);
            setVendors(venRes.data || []);
        } catch (e) { console.error(e); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await tpaAPI.createPolicy(form); showToast('Policy registered'); setShowForm(false); load(); }
        catch (err) { showToast(err.message || 'Failed to create policy', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Insurance Policies</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Register Policy'}
                </button>
            </div>

            {showForm && (
                <form className="card" style={{ padding: 20, marginBottom: 20 }} onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <div><label className="form-label">Patient ID *</label>
                            <input className="form-input" required type="number" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} /></div>
                        <div><label className="form-label">TPA Vendor *</label>
                            <select className="form-select" required value={form.tpa_vendor_id} onChange={e => setForm({ ...form, tpa_vendor_id: e.target.value })}>
                                <option value="">Select vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.panel_type})</option>)}
                            </select></div>
                        <div><label className="form-label">Policy Number *</label>
                            <input className="form-input" required value={form.policy_number} onChange={e => setForm({ ...form, policy_number: e.target.value })} /></div>
                        <div><label className="form-label">Insurance Company *</label>
                            <input className="form-input" required value={form.insurance_company} onChange={e => setForm({ ...form, insurance_company: e.target.value })} placeholder="Star Health" /></div>
                        <div><label className="form-label">Plan Name</label>
                            <input className="form-input" value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })} /></div>
                        <div><label className="form-label">Start Date *</label>
                            <input className="form-input" type="date" required value={form.policy_start_date} onChange={e => setForm({ ...form, policy_start_date: e.target.value })} /></div>
                        <div><label className="form-label">End Date *</label>
                            <input className="form-input" type="date" required value={form.policy_end_date} onChange={e => setForm({ ...form, policy_end_date: e.target.value })} /></div>
                        <div><label className="form-label">Sum Insured (₹) *</label>
                            <input className="form-input" type="number" required value={form.sum_insured} onChange={e => setForm({ ...form, sum_insured: e.target.value })} /></div>
                        <div><label className="form-label">Co-Payment %</label>
                            <input className="form-input" type="number" step="0.01" value={form.co_payment_percent} onChange={e => setForm({ ...form, co_payment_percent: e.target.value })} /></div>
                        <div><label className="form-label">Deductible (₹)</label>
                            <input className="form-input" type="number" value={form.deductible_amount} onChange={e => setForm({ ...form, deductible_amount: e.target.value })} /></div>
                        <div><label className="form-label">Room Rent Limit (₹/day)</label>
                            <input className="form-input" type="number" value={form.room_rent_limit} onChange={e => setForm({ ...form, room_rent_limit: e.target.value })} /></div>
                        <div><label className="form-label">Member ID</label>
                            <input className="form-input" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} /></div>
                        <div><label className="form-label">Relation</label>
                            <select className="form-select" value={form.relation_to_primary} onChange={e => setForm({ ...form, relation_to_primary: e.target.value })}>
                                {['Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'].map(r => <option key={r}>{r}</option>)}
                            </select></div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">Register Policy</button>
                </form>
            )}

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="table">
                    <thead><tr>
                        <th>Patient</th><th>Policy #</th><th>Company</th><th>TPA</th><th>Sum Insured</th><th>Balance</th><th>Co-Pay</th><th>Deductible</th><th>Valid Till</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                        {policies.length === 0 ? (
                            <tr><td colSpan="10"><div className="empty-state"><p>No policies found</p></div></td></tr>
                        ) : policies.map(p => (
                            <tr key={p.id}>
                                <td>{p.patient_name} {p.patient_last_name}<br /><small style={{ color: 'var(--text-muted)' }}>{p.uhid}</small></td>
                                <td style={{ fontWeight: 600 }}>{p.policy_number}</td>
                                <td>{p.insurance_company}</td>
                                <td>{p.vendor_name}<br /><span className="badge badge-info">{p.panel_type}</span></td>
                                <td>₹{Number(p.sum_insured).toLocaleString('en-IN')}</td>
                                <td style={{ fontWeight: 600, color: Number(p.balance_available) < Number(p.sum_insured) * 0.2 ? 'var(--danger)' : 'var(--success)' }}>
                                    ₹{Number(p.balance_available).toLocaleString('en-IN')}</td>
                                <td>{p.co_payment_percent}%</td>
                                <td>₹{Number(p.deductible_amount).toLocaleString('en-IN')}</td>
                                <td>{new Date(p.policy_end_date).toLocaleDateString('en-IN')}</td>
                                <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>{p.is_active ? 'Active' : 'Expired'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   PRE-AUTH TAB
   ═══════════════════════════════════════════ */
function PreAuthTab({ showToast }) {
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [statusModal, setStatusModal] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [form, setForm] = useState({ admission_id: '', insurance_policy_id: '', requested_amount: '', diagnosis: '', procedure_planned: '', icd_code: '' });
    const [statusForm, setStatusForm] = useState({ status: '', approved_amount: '', tpa_reference_no: '', query_details: '', remarks: '' });

    const load = useCallback(async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const [res, venRes] = await Promise.all([tpaAPI.preauthList(params), tpaAPI.vendors({ is_active: 'true' })]);
            setRequests(res.data || []);
            setVendors(venRes.data || []);
        } catch (e) { console.error(e); }
    }, [statusFilter]);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await tpaAPI.createPreauth(form); showToast('Pre-auth initiated'); setShowForm(false); load(); }
        catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        try { await tpaAPI.updatePreauthStatus(statusModal, statusForm); showToast('Status updated'); setStatusModal(null); load(); }
        catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Pre-Authorization Requests</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select className="form-select" style={{ width: 220 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {PREAUTH_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 260 }} id="preauth-vendor-filter" defaultValue="">
                        <option value="">All TPA Vendors ({vendors.length})</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.panel_type})</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ New Pre-Auth'}
                    </button>
                </div>
            </div>

            {showForm && (
                <form className="card" style={{ padding: 20, marginBottom: 20 }} onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <div><label className="form-label">Admission ID *</label>
                            <input className="form-input" required type="number" value={form.admission_id} onChange={e => setForm({ ...form, admission_id: e.target.value })} /></div>
                        <div><label className="form-label">Insurance Policy ID *</label>
                            <input className="form-input" required type="number" value={form.insurance_policy_id} onChange={e => setForm({ ...form, insurance_policy_id: e.target.value })} /></div>
                        <div><label className="form-label">Requested Amount (₹) *</label>
                            <input className="form-input" required type="number" value={form.requested_amount} onChange={e => setForm({ ...form, requested_amount: e.target.value })} /></div>
                        <div><label className="form-label">ICD Code</label>
                            <input className="form-input" value={form.icd_code} onChange={e => setForm({ ...form, icd_code: e.target.value })} placeholder="J18.9" /></div>
                        <div style={{ gridColumn: 'span 2' }}><label className="form-label">Diagnosis *</label>
                            <textarea className="form-input" required rows={2} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label className="form-label">Procedure Planned</label>
                            <textarea className="form-input" rows={2} value={form.procedure_planned} onChange={e => setForm({ ...form, procedure_planned: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">Initiate Pre-Auth</button>
                </form>
            )}

            {statusModal && (
                <div className="modal-overlay" onClick={() => setStatusModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <h3>Update Pre-Auth Status</h3>
                        <form onSubmit={handleStatusUpdate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div><label className="form-label">Status *</label>
                                    <select className="form-select" required value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                                        <option value="">Select</option>
                                        {PREAUTH_STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select></div>
                                <div><label className="form-label">Approved Amount (₹)</label>
                                    <input className="form-input" type="number" value={statusForm.approved_amount} onChange={e => setStatusForm({ ...statusForm, approved_amount: e.target.value })} /></div>
                                <div><label className="form-label">TPA Reference No</label>
                                    <input className="form-input" value={statusForm.tpa_reference_no} onChange={e => setStatusForm({ ...statusForm, tpa_reference_no: e.target.value })} /></div>
                                <div><label className="form-label">Remarks</label>
                                    <textarea className="form-input" rows={2} value={statusForm.remarks} onChange={e => setStatusForm({ ...statusForm, remarks: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-primary" type="submit">Update</button>
                                <button className="btn btn-ghost" type="button" onClick={() => setStatusModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="table">
                    <thead><tr>
                        <th>PA #</th><th>Patient</th><th>Admission</th><th>TPA</th><th>Requested</th><th>Approved</th><th>Status</th><th>Date</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="9"><div className="empty-state"><p>No pre-auth requests</p></div></td></tr>
                        ) : requests.map(r => (
                            <tr key={r.id}>
                                <td style={{ fontWeight: 600 }}>{r.preauth_no}</td>
                                <td>{r.patient_name} {r.patient_last_name}<br /><small style={{ color: 'var(--text-muted)' }}>{r.uhid}</small></td>
                                <td>{r.admission_no}</td>
                                <td>{r.vendor_name}<br /><span className="badge badge-info">{r.panel_type}</span></td>
                                <td>₹{Number(r.requested_amount).toLocaleString('en-IN')}</td>
                                <td style={{ fontWeight: 600 }}>{r.approved_amount ? `₹${Number(r.approved_amount).toLocaleString('en-IN')}` : '—'}</td>
                                <td><span className={`badge ${STATUS_BADGES[r.status] || 'badge-info'}`}>{r.status}</span></td>
                                <td style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                                <td>
                                    {!['Cancelled', 'Rejected'].includes(r.status) && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setStatusModal(r.id); setStatusForm({ status: '', approved_amount: '', tpa_reference_no: r.tpa_reference_no || '', query_details: '', remarks: '' }); }}>
                                            ✏️ Update
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   CLAIMS TAB
   ═══════════════════════════════════════════ */
function ClaimsTab({ showToast }) {
    const [claims, setClaims] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [settleModal, setSettleModal] = useState(null);
    const [statusModal, setStatusModal] = useState(null);
    const [form, setForm] = useState({ admission_id: '', insurance_policy_id: '', billing_id: '', preauth_id: '', claim_type: 'Cashless', total_bill_amount: '', remarks: '' });
    const [settleForm, setSettleForm] = useState({ settled_amount: '', tds_deducted: 0, settlement_utr: '', disallowance_amount: 0 });
    const [statusForm, setStatusForm] = useState({ status: '', approved_amount: '', tpa_reference_no: '', remarks: '' });

    const load = useCallback(async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const res = await tpaAPI.claims(params);
            setClaims(res.data || []);
        } catch (e) { console.error(e); }
    }, [statusFilter]);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await tpaAPI.createClaim(form); showToast('Claim created'); setShowForm(false); load(); }
        catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    const handleSettle = async (e) => {
        e.preventDefault();
        try { await tpaAPI.settleClaim(settleModal, settleForm); showToast('Settlement recorded'); setSettleModal(null); load(); }
        catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        try { await tpaAPI.updateClaimStatus(statusModal, statusForm); showToast('Status updated'); setStatusModal(null); load(); }
        catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Insurance Claims</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {CLAIM_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ New Claim'}
                    </button>
                </div>
            </div>

            {showForm && (
                <form className="card" style={{ padding: 20, marginBottom: 20 }} onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <div><label className="form-label">Admission ID *</label>
                            <input className="form-input" required type="number" value={form.admission_id} onChange={e => setForm({ ...form, admission_id: e.target.value })} /></div>
                        <div><label className="form-label">Insurance Policy ID *</label>
                            <input className="form-input" required type="number" value={form.insurance_policy_id} onChange={e => setForm({ ...form, insurance_policy_id: e.target.value })} /></div>
                        <div><label className="form-label">Billing ID</label>
                            <input className="form-input" type="number" value={form.billing_id} onChange={e => setForm({ ...form, billing_id: e.target.value })} /></div>
                        <div><label className="form-label">Pre-Auth ID</label>
                            <input className="form-input" type="number" value={form.preauth_id} onChange={e => setForm({ ...form, preauth_id: e.target.value })} /></div>
                        <div><label className="form-label">Claim Type</label>
                            <select className="form-select" value={form.claim_type} onChange={e => setForm({ ...form, claim_type: e.target.value })}>
                                <option>Cashless</option><option>Reimbursement</option>
                            </select></div>
                        <div><label className="form-label">Total Bill Amount (₹) *</label>
                            <input className="form-input" required type="number" value={form.total_bill_amount} onChange={e => setForm({ ...form, total_bill_amount: e.target.value })} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label className="form-label">Remarks</label>
                            <textarea className="form-input" rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">Create Claim</button>
                </form>
            )}

            {/* Status Update Modal */}
            {statusModal && (
                <div className="modal-overlay" onClick={() => setStatusModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <h3>Update Claim Status</h3>
                        <form onSubmit={handleStatusUpdate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div><label className="form-label">Status *</label>
                                    <select className="form-select" required value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                                        <option value="">Select</option>
                                        {CLAIM_STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select></div>
                                <div><label className="form-label">Approved Amount (₹)</label>
                                    <input className="form-input" type="number" value={statusForm.approved_amount} onChange={e => setStatusForm({ ...statusForm, approved_amount: e.target.value })} /></div>
                                <div><label className="form-label">TPA Reference No</label>
                                    <input className="form-input" value={statusForm.tpa_reference_no} onChange={e => setStatusForm({ ...statusForm, tpa_reference_no: e.target.value })} /></div>
                                <div><label className="form-label">Remarks</label>
                                    <textarea className="form-input" rows={2} value={statusForm.remarks} onChange={e => setStatusForm({ ...statusForm, remarks: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-primary" type="submit">Update</button>
                                <button className="btn btn-ghost" type="button" onClick={() => setStatusModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settlement Modal */}
            {settleModal && (
                <div className="modal-overlay" onClick={() => setSettleModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <h3>Record Settlement</h3>
                        <form onSubmit={handleSettle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div><label className="form-label">Settled Amount (₹) *</label>
                                    <input className="form-input" required type="number" value={settleForm.settled_amount} onChange={e => setSettleForm({ ...settleForm, settled_amount: e.target.value })} /></div>
                                <div><label className="form-label">TDS Deducted (₹)</label>
                                    <input className="form-input" type="number" value={settleForm.tds_deducted} onChange={e => setSettleForm({ ...settleForm, tds_deducted: e.target.value })} /></div>
                                <div><label className="form-label">Settlement UTR * </label>
                                    <input className="form-input" required value={settleForm.settlement_utr} onChange={e => setSettleForm({ ...settleForm, settlement_utr: e.target.value })} placeholder="NEFT/RTGS reference" /></div>
                                <div><label className="form-label">Disallowance (₹)</label>
                                    <input className="form-input" type="number" value={settleForm.disallowance_amount} onChange={e => setSettleForm({ ...settleForm, disallowance_amount: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-success" type="submit">Record Settlement</button>
                                <button className="btn btn-ghost" type="button" onClick={() => setSettleModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="table">
                    <thead><tr>
                        <th>Claim #</th><th>Patient</th><th>Type</th><th>TPA</th><th>Bill Amt</th><th>Approved</th><th>Settled</th><th>Patient Pay</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {claims.length === 0 ? (
                            <tr><td colSpan="10"><div className="empty-state"><p>No claims found</p></div></td></tr>
                        ) : claims.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 600 }}>{c.claim_no}</td>
                                <td>{c.patient_name} {c.patient_last_name}<br /><small style={{ color: 'var(--text-muted)' }}>{c.uhid}</small></td>
                                <td><span className={`badge ${c.claim_type === 'Cashless' ? 'badge-primary' : 'badge-warning'}`}>{c.claim_type}</span></td>
                                <td>{c.vendor_name}</td>
                                <td>₹{Number(c.total_bill_amount).toLocaleString('en-IN')}</td>
                                <td>{c.approved_amount ? `₹${Number(c.approved_amount).toLocaleString('en-IN')}` : '—'}</td>
                                <td style={{ fontWeight: 600, color: c.settled_amount ? 'var(--success)' : 'inherit' }}>
                                    {c.settled_amount ? `₹${Number(c.settled_amount).toLocaleString('en-IN')}` : '—'}</td>
                                <td>₹{Number(c.patient_payable).toLocaleString('en-IN')}</td>
                                <td><span className={`badge ${STATUS_BADGES[c.status] || 'badge-info'}`}>{c.status}</span></td>
                                <td style={{ display: 'flex', gap: 4 }}>
                                    {!['Settled', 'Closed', 'Rejected'].includes(c.status) && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setStatusModal(c.id); setStatusForm({ status: '', approved_amount: '', tpa_reference_no: c.tpa_reference_no || '', remarks: '' }); }}>✏️</button>
                                    )}
                                    {['Approved', 'Under Review', 'Partially Settled'].includes(c.status) && (
                                        <button className="btn btn-success btn-sm" onClick={() => { setSettleModal(c.id); setSettleForm({ settled_amount: '', tds_deducted: 0, settlement_utr: '', disallowance_amount: 0 }); }}>💰 Settle</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   TARIFFS TAB
   ═══════════════════════════════════════════ */
function TariffsTab({ showToast }) {
    const [tariffs, setTariffs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [panelFilter, setPanelFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({
        tariff_code: '', panel_type: 'CGHS', item_type: 'Consultation', procedure_name: '', procedure_code: '',
        nabh_rate: '', non_nabh_rate: '', hospital_rate: '', effective_from: new Date().toISOString().slice(0, 10)
    });

    const load = useCallback(async () => {
        try {
            const params = {};
            if (panelFilter) params.panel_type = panelFilter;
            if (searchTerm) params.search = searchTerm;
            const res = await tpaAPI.tariffs(params);
            setTariffs(res.data || []);
        } catch (e) { console.error(e); }
    }, [panelFilter, searchTerm]);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await tpaAPI.createTariff(form); showToast('Tariff created'); setShowForm(false); load(); }
        catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Tariff Master</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" style={{ width: 200 }} placeholder="Search procedure..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <select className="form-select" style={{ width: 140 }} value={panelFilter} onChange={e => setPanelFilter(e.target.value)}>
                        <option value="">All Panels</option>
                        {['CGHS', 'ECHS', 'Private', 'Hospital'].map(p => <option key={p}>{p}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Cancel' : '+ Add Tariff'}
                    </button>
                </div>
            </div>

            {showForm && (
                <form className="card" style={{ padding: 20, marginBottom: 20 }} onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <div><label className="form-label">Tariff Code *</label>
                            <input className="form-input" required value={form.tariff_code} onChange={e => setForm({ ...form, tariff_code: e.target.value })} placeholder="CGHS-GEN-001" /></div>
                        <div><label className="form-label">Panel Type *</label>
                            <select className="form-select" value={form.panel_type} onChange={e => setForm({ ...form, panel_type: e.target.value })}>
                                {['CGHS', 'ECHS', 'Private', 'Hospital'].map(p => <option key={p}>{p}</option>)}
                            </select></div>
                        <div><label className="form-label">Item Type *</label>
                            <select className="form-select" value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })}>
                                {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select></div>
                        <div><label className="form-label">Procedure Code</label>
                            <input className="form-input" value={form.procedure_code} onChange={e => setForm({ ...form, procedure_code: e.target.value })} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label className="form-label">Procedure Name *</label>
                            <input className="form-input" required value={form.procedure_name} onChange={e => setForm({ ...form, procedure_name: e.target.value })} placeholder="General Physician Consultation" /></div>
                        <div><label className="form-label">NABH Rate (₹)</label>
                            <input className="form-input" type="number" step="0.01" value={form.nabh_rate} onChange={e => setForm({ ...form, nabh_rate: e.target.value })} /></div>
                        <div><label className="form-label">Non-NABH Rate (₹)</label>
                            <input className="form-input" type="number" step="0.01" value={form.non_nabh_rate} onChange={e => setForm({ ...form, non_nabh_rate: e.target.value })} /></div>
                        <div><label className="form-label">Hospital Rate (₹)</label>
                            <input className="form-input" type="number" step="0.01" value={form.hospital_rate} onChange={e => setForm({ ...form, hospital_rate: e.target.value })} /></div>
                        <div><label className="form-label">Effective From</label>
                            <input className="form-input" type="date" value={form.effective_from} onChange={e => setForm({ ...form, effective_from: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">Create Tariff Entry</button>
                </form>
            )}

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="table">
                    <thead><tr>
                        <th>Code</th><th>Panel</th><th>Type</th><th>Procedure</th><th>NABH Rate</th><th>Non-NABH</th><th>Hospital Rate</th><th>Effective</th>
                    </tr></thead>
                    <tbody>
                        {tariffs.length === 0 ? (
                            <tr><td colSpan="8"><div className="empty-state"><p>No tariffs found</p></div></td></tr>
                        ) : tariffs.map(t => (
                            <tr key={t.id}>
                                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{t.tariff_code}</td>
                                <td><span className={`badge ${t.panel_type === 'CGHS' ? 'badge-primary' : t.panel_type === 'ECHS' ? 'badge-info' : t.panel_type === 'Private' ? 'badge-purple' : 'badge-warning'}`}>{t.panel_type}</span></td>
                                <td>{t.item_type}</td>
                                <td>{t.procedure_name}{t.procedure_code ? <><br /><small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.procedure_code}</small></> : ''}</td>
                                <td style={{ fontWeight: 600 }}>{t.nabh_rate ? `₹${Number(t.nabh_rate).toLocaleString('en-IN')}` : '—'}</td>
                                <td>{t.non_nabh_rate ? `₹${Number(t.non_nabh_rate).toLocaleString('en-IN')}` : '—'}</td>
                                <td>{t.hospital_rate ? `₹${Number(t.hospital_rate).toLocaleString('en-IN')}` : '—'}</td>
                                <td style={{ fontSize: '0.8rem' }}>{new Date(t.effective_from).toLocaleDateString('en-IN')}{t.effective_to ? ` — ${new Date(t.effective_to).toLocaleDateString('en-IN')}` : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
