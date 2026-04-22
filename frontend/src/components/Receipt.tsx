import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

interface ReceiptProps {
    order: {
        order_number: string;
        customer_name?: string;
        customer_phone?: string;
        total_amount: number;
        payment_method?: string;
        created_at: string;
    };
    items: Array<{
        product_name: string;
        product_sku: string;
        product_barcode?: string;
        quantity: number;
        unit_price: number;
    }>;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order, items }, ref) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return (
        <div
            ref={ref}
            className="hidden print:block print-visible bg-white p-2 w-full mx-0 text-xs leading-tight text-black"
        >
            {/* Logo */}
            <div className="text-center mb-2">
                <img
                    src="/logo.png"
                    alt="CASHMERE"
                    className="w-20 h-auto mx-auto mb-1 grayscale"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <h1 className="text-xl font-serif font-bold text-black uppercase tracking-wider">CASHMERE</h1>
                <p className="text-[10px] text-black">Premium Fashion & Accessories</p>
            </div>

            {/* Order Info */}
            <div className="border-t border-b border-stone-300 py-3 mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">Order #:</span>
                    <span>{order.order_number}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">Date:</span>
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                {order.customer_name && (
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold">Customer:</span>
                        <span>{order.customer_name}</span>
                    </div>
                )}
                {order.customer_phone && (
                    <div className="flex justify-between text-xs">
                        <span className="font-bold">Phone:</span>
                        <span>{order.customer_phone}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="mb-4">
                <table className="w-full text-xs">
                    <thead className="border-b border-stone-300">
                        <tr>
                            <th className="text-left pb-2">Item</th>
                            <th className="text-center pb-2">Qty</th>
                            <th className="text-right pb-2">Price</th>
                            <th className="text-right pb-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-stone-200">
                                <td className="py-2">
                                    <div className="font-bold">{item.product_name}</div>
                                    <div className="text-stone-500">{item.product_sku}</div>
                                    {item.product_barcode?.trim() && (
                                        <div className="mt-1">
                                            <Barcode
                                                value={item.product_barcode.trim()}
                                                width={2}
                                                height={30}
                                                fontSize={8}
                                                margin={0}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-right">{item.unit_price.toFixed(2)}</td>
                                <td className="text-right font-bold">{(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="border-t border-stone-300 pt-3 mb-4">
                <div className="flex justify-between text-xs mb-2">
                    <span>Subtotal:</span>
                    <span>{subtotal.toFixed(2)} LE</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>{order.total_amount.toFixed(2)} LE</span>
                </div>
                {order.payment_method && (
                    <div className="flex justify-between text-xs mt-2 text-stone-600">
                        <span>Payment Method:</span>
                        <span className="uppercase">{order.payment_method}</span>
                    </div>
                )}
            </div>

            {/* Order Barcode */}
            {order.order_number && (
                <div className="text-center mb-4">
                    <Barcode
                        value={order.order_number}
                        width={2}
                        height={50}
                        fontSize={12}
                    />
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-stone-500 border-t border-stone-300 pt-3">
                <p className="mb-1">Thank you for shopping with CASHMERE!</p>
                <p>Follow us @cashmere_fashion</p>
                <p className="mt-2">Exchange within 7 days with receipt</p>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';

export default Receipt;
