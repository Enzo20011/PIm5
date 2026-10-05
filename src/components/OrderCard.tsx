import { useState } from 'react';
import { FiChevronDown, FiClock } from 'react-icons/fi';
import { ORDER_STATUS_LABELS } from '../types';
import type { Order } from '../types';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const OrderCard = ({ order }: { order: Order }) => {
  const [open, setOpen] = useState(false);
  const items = order.items ?? [];
  const units = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono break-all">#{order.id}</p>
          <p className="text-gray-900 dark:text-white font-medium flex items-center mt-1">
            <FiClock className="mr-1 text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <span className={`mt-2 inline-block px-2 py-1 rounded-md text-xs font-bold ${statusStyles[order.status] ?? statusStyles.processing}`}>
            {(ORDER_STATUS_LABELS[order.status] ?? order.status).toUpperCase()}
          </span>
        </div>
        <div className="text-right w-full sm:w-auto">
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">${order.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{units} unidad(es)</p>
        </div>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-brand-600 dark:text-brand-400 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {open ? 'Ocultar detalle' : 'Ver detalle'}
        <FiChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="px-6 py-4 space-y-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
          {items.map(it => (
            <li key={it.id} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="w-10 h-10 rounded object-cover shrink-0" />}
                <span className="text-gray-900 dark:text-white truncate">{it.name}</span>
              </div>
              <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {it.quantity} x ${it.price} = <span className="font-semibold text-gray-900 dark:text-white">${it.quantity * it.price}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
