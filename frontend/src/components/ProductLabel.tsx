import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
    product_name: string;
    product_sku: string;
    product_barcode?: string;
    product_price: number;
    currency?: string;
}

/**
 * Thermal Printer Label Component
 * Optimized for Xprinter XP-365B (58mm thermal paper)
 * Design matches retail product labels with CASHMERE branding
 */
const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
    ({ product_name, product_sku, product_barcode, product_price, currency = 'LE' }, ref) => {
        const barcodeValue = product_barcode || product_sku;

        return (
            <div
                ref={ref}
                style={{
                    width: '58mm',
                    padding: '4mm 4mm 0 4mm',
                    pageBreakAfter: 'always',
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: 'white',
                    display: 'inline-block'
                }}
            >
                {/* Brand Header */}
                <div className="text-center mb-2">
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            letterSpacing: '4px',
                            margin: '0',
                            padding: '4px 0',
                            color: '#000'
                        }}
                    >
                        CASHMERE
                    </h1>
                </div>

                {/* Barcode Section */}
                <div className="flex justify-center mb-1">
                    <Barcode
                        value={barcodeValue}
                        width={2.5}
                        height={60}
                        fontSize={16}
                        margin={0}
                        displayValue={true}
                        background="#ffffff"
                        lineColor="#000000"
                    />
                </div>

                {/* Product Name in Arabic/English */}
                <div
                    className="text-center mb-2"
                    style={{
                        fontSize: '14px',
                        fontWeight: 'normal',
                        direction: 'rtl',
                        padding: '2px 0'
                    }}
                >
                    {product_name}
                </div>

                {/* Price Section - Bold Black Box */}
                <div
                    style={{
                        backgroundColor: '#000',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        marginTop: '4px',
                        borderRadius: '2px',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                    }}
                >
                    <div
                        style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            letterSpacing: '2px'
                        }}
                    >
                        Price
                    </div>
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>{Number(product_price).toFixed(0)}</span>
                        <span style={{ fontSize: '20px' }}>{currency}</span>
                    </div>
                </div>
            </div>
        );
    }
);

ProductLabel.displayName = 'ProductLabel';

export default ProductLabel;
