import React from 'react';
import { X, Printer } from 'lucide-react';

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer: any; // Full customer obj if available
    location: any;
    total_price: number;
    amount_paid: number;
    detailed_status: string;
    items: any[];
}

interface WaybillModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
}

export default function WaybillModal({ isOpen, onClose, orders }: WaybillModalProps) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto print:bg-white print:static print:h-auto print:overflow-visible">
            {/* Modal Container */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl m-4 print:shadow-none print:w-full print:max-w-none print:m-0 print:rounded-none">

                {/* Header (Hidden in Print) */}
                <div className="flex justify-between items-center p-6 border-b border-stone-100 print:hidden">
                    <h2 className="text-xl font-bold font-serif text-cashmere-maroon">Print Waybills ({orders.length})</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-cashmere-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-800">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                            <X size={20} className="text-stone-400" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable on screen, Full on Print */}
                <div className="p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
                    <div className="space-y-8 print:space-y-0">
                        {orders.map((order, index) => (
                            <div key={order.id} className="waybill-page border border-stone-800 p-4 mb-8 print:mb-0 print:break-after-page print:border-2 min-h-[500px]">
                                {/* Header / Branding */}
                                <div className="text-center mb-6 border-b-2 border-stone-800 pb-2">
                                    <h1 className="text-2xl font-bold uppercase tracking-widest">QuiGo Express</h1>
                                    <p className="text-xs font-bold">Shipping & Logistics Services</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 h-full">
                                    {/* Sender Info (Static for Cashmere) */}
                                    <div className="border-2 border-stone-800 rounded-lg p-3">
                                        <h3 className="font-bold text-white bg-stone-800 -mx-3 -mt-3 p-1 px-3 mb-2 text-sm">SENDER INFO</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-stone-300 pb-1">
                                                <span className="font-bold">Name:</span>
                                                <span>CASHMERE</span>
                                            </div>
                                            <div className="flex justify-between border-b border-stone-300 pb-1">
                                                <span className="font-bold">Phone:</span>
                                                <span>01xxxxxxxxx</span>
                                            </div>
                                            <div className="flex justify-between border-b border-stone-300 pb-1">
                                                <span className="font-bold">Date:</span>
                                                <span>{new Date().toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold block mb-1">Address:</span>
                                                <span className="text-xs">Cairo, Egypt</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receiver Info */}
                                    <div className="border-2 border-stone-800 rounded-lg p-3">
                                        <h3 className="font-bold text-white bg-stone-800 -mx-3 -mt-3 p-1 px-3 mb-2 text-sm">RECEIVER INFO</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-stone-300 pb-1">
                                                <span className="font-bold">Name:</span>
                                                <span>{order.customer_name}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-stone-300 pb-1">
                                                <span className="font-bold">Phone:</span>
                                                <span>{order.customer?.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-stone-300 pb-1">
                                                <span className="font-bold">Area:</span>
                                                <span className="uppercase">{order.location?.name || 'Cairo'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold block mb-1">Address:</span>
                                                <span className="text-xs h-12 block">{order.customer?.address || 'Shipping Address...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipment Details */}
                                <div className="mt-4 border-2 border-stone-800 rounded-lg p-3">
                                    <h3 className="font-bold text-white bg-stone-800 -mx-3 -mt-3 p-1 px-3 mb-2 text-sm">SHIPMENT VALUE</h3>
                                    <div className="space-y-2 text-sm font-bold">
                                        <div className="flex justify-between items-center border-b border-stone-300 pb-2">
                                            <span>SHIPMENT VALUE:</span>
                                            <span className="text-xl">{order.total_price} LE</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-stone-300 pb-2">
                                            <span>SHIPPING COST:</span>
                                            <span>--</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-stone-300 pb-2 bg-stone-100 p-1">
                                            <span>TOTAL REQUIRED:</span>
                                            <span className="text-xl">{Number(order.total_price) - Number(order.amount_paid)} LE</span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="block mb-1">NOTES:</span>
                                            <div className="h-12 border border-stone-300 rounded p-1 text-xs font-normal">
                                                Order #{order.order_number} - {order.items.length} Items
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Barcode Placeholder */}
                                <div className="mt-6 text-center">
                                    <div className="inline-block bg-black h-12 w-64"></div>
                                    <p className="text-xs mt-1 font-mono">{order.order_number}</p>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .waybill-page, .waybill-page * {
                        visibility: visible;
                    }
                    .waybill-page {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        border: 2px solid black !important;
                    }
                }
            `}</style>
        </div>
    );
}
