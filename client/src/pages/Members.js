import React, { useEffect, useState, useCallback } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    PencilSquareIcon,
    TrashIcon,
    CreditCardIcon,
    ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import Papa from 'papaparse';
import { Button, Input, Modal, Select } from '../components/UI';
import ReceiptModal from '../components/ReceiptModal';

const Members = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPlan, setFilterPlan] = useState('All');

    // Member Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        planId: '',
        status: 'Active'
    });

    // History Modal states
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Receipt state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [membersRes, plansRes] = await Promise.all([
                api.get('/members'),
                api.get('/plans')
            ]);
            setMembers(membersRes.data);
            setPlans(plansRes.data);

            if (plansRes.data.length > 0 && !formData.planId) {
                setFormData(prev => ({ ...prev, planId: plansRes.data[0]._id }));
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [formData.planId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (member = null) => {
        if (member) {
            setCurrentMember(member);
            setFormData({
                firstName: member.personalInfo.firstName,
                lastName: member.personalInfo.lastName,
                email: member.email,
                phone: member.personalInfo.phone || '',
                planId: member.currentPlan?._id || plans[0]?._id || '',
                status: member.status
            });
        } else {
            setCurrentMember(null);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                planId: plans[0]?._id || '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleViewHistory = async (member) => {
        setCurrentMember(member);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/members/${member._id}/payments`);
            setPaymentHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewReceipt = (payment) => {
        // Hydrate payment with member data for the receipt
        const fullPayment = {
            ...payment,
            member: currentMember
        };
        setSelectedPayment(fullPayment);
        setIsReceiptOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentMember) {
                await api.patch(`/members/${currentMember._id}`, {
                    personalInfo: { firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone },
                    planId: formData.planId,
                    status: formData.status
                });
            } else {
                const res = await api.post('/members', {
                    ...formData,
                    firebaseUid: `mock_${Date.now()}`
                });

                const selectedPlan = plans.find(p => p._id === formData.planId);
                if (selectedPlan) {
                    await api.post('/payments', {
                        memberId: res.data._id,
                        planId: formData.planId,
                        amount: selectedPlan.price,
                        transactionId: 'Initial Registration',
                        status: 'Paid'
                    });
                }
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save member');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                await api.delete(`/members/${id}`);
                fetchData();
            } catch (err) {
                alert('Failed to delete member');
            }
        }
    };

    const downloadCSV = () => {
        const data = filteredMembers.map(m => ({
            Name: `${m.personalInfo.firstName} ${m.personalInfo.lastName}`,
            Email: m.email,
            Plan: m.currentPlan?.name || 'N/A',
            Status: m.status,
            EndDate: m.endDate ? new Date(m.endDate).toLocaleDateString() : 'N/A'
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `members_ledger_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = filterPlan === 'All' || m.currentPlan?.name === filterPlan;
        return matchesSearch && matchesPlan;
    });

    const uniquePlansList = ['All', ...new Set(members.map(m => m.currentPlan?.name).filter(Boolean))];

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Personnel Directory</h3>
                    <p className="text-slate-500 font-medium">Manage subscriber accounts and billing status.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={downloadCSV}>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Export Data
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Onboard Member
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/20">
                    <div className="relative w-full md:w-96">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find by name or email..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-3">Filter By Tier:</span>
                        <select
                            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none focus:ring-0 uppercase tracking-wider"
                            value={filterPlan}
                            onChange={(e) => setFilterPlan(e.target.value)}
                        >
                            {uniquePlansList.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 font-black text-xs uppercase italic tracking-widest">Hydrating directory records...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-5">Full Identity</th>
                                    <th className="px-8 py-5">Subscription Grade</th>
                                    <th className="px-8 py-5">Activity State</th>
                                    <th className="px-8 py-5">Expiry Cycle</th>
                                    <th className="px-8 py-5 text-right">Operational Tools</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                                    <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary font-black text-sm mr-4 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                                                    {member.personalInfo.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">
                                                        {member.personalInfo.firstName} {member.personalInfo.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-bold lowercase">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col text-xs uppercase tracking-tight">
                                                <span className="font-black text-slate-700">{member.currentPlan?.name || 'Standard Tier'}</span>
                                                <span className="text-primary font-bold italic">{member.currentPlan ? `$${member.currentPlan.price}` : 'No Charge'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    member.status === 'Suspended' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                                                {member.endDate ? new Date(member.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => handleViewHistory(member)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100 hover:border-emerald-200" title="Financial Ledger">
                                                    <CreditCardIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleOpenModal(member)} className="p-2 text-slate-400 hover:text-primary transition-colors bg-white rounded-xl shadow-sm border border-slate-100 hover:border-primary/20" title="Edit Profile">
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(member._id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100 hover:border-rose-200" title="Terminate Account">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em] italic">
                                            No matches found in directory.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Member Onboarding/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentMember ? 'Revise subscriber' : 'Member Onboarding'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Legal First Name"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                        <Input
                            label="Legal Last Name"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Electronic Mail Address"
                        type="email"
                        required
                        disabled={!!currentMember}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Input
                        label="Primary Phone Interface"
                        placeholder="+1 (000) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Service Tier Assignment"
                            value={formData.planId}
                            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                            options={plans.map(p => ({ value: p._id, label: `${p.name} ($${p.price})` }))}
                        />
                        <Select
                            label="Operational State"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            options={[
                                { value: 'Active', label: 'Active' },
                                { value: 'Suspended', label: 'Suspended' },
                                { value: 'Expired', label: 'Expired' }
                            ]}
                        />
                    </div>
                    <div className="flex space-x-3 pt-8 border-t border-slate-100 mt-6">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Abort
                        </Button>
                        <Button type="submit" className="flex-1">
                            {currentMember ? 'Apply Updates' : 'Commit Onboarding'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Payment History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={`Ledger: ${currentMember?.personalInfo.firstName} ${currentMember?.personalInfo.lastName}`}
            >
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {historyLoading ? (
                        <p className="text-center py-20 text-slate-400 font-black text-xs uppercase animate-pulse">Querying ledger records...</p>
                    ) : paymentHistory.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {paymentHistory.map((pay) => (
                                <div key={pay._id} className="py-5 flex justify-between items-center group hover:bg-slate-50/50 px-2 rounded-2xl transition-all">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{pay.plan?.name || 'Custom Offset'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {new Date(pay.paymentDate).toLocaleDateString()} 〈 {pay.transactionId || 'SYS_GEN'} 〉
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">${pay.amount.toFixed(2)}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${pay.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{pay.status}</p>
                                        </div>
                                        <button
                                            onClick={() => handleViewReceipt(pay)}
                                            className="p-2 text-slate-300 hover:text-primary transition-colors"
                                        >
                                            <ChevronDoubleRightIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-20 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">No financial traffic recorded for this identity.</p>
                    )}
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6">
                    <Button variant="secondary" className="w-full" onClick={() => setIsHistoryOpen(false)}>Close Ledger</Button>
                </div>
            </Modal>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default Members;
