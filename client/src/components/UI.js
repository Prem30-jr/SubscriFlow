import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const variants = {
        primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20',
        secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200',
        ghost: 'text-slate-600 hover:bg-slate-50',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
    };

    return (
        <button
            className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = ({ label, error, ...props }) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
            <input
                className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm placeholder:text-slate-400 ${error ? 'border-red-500 ring-red-100 shadow-sm' : 'border-slate-200 ring-primary/10'
                    }`}
                {...props}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export const Select = ({ label, error, options = [], ...props }) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
            <select
                className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm ${error ? 'border-red-500 ring-red-100' : 'border-slate-200 ring-primary/10'
                    }`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="px-8 py-6 border-b border-slate-50 flex bg-slate-50/50 justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

