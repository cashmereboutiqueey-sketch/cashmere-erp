import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
    product_name: string;
    product_sku: string;
    product_barcode?: string;
    product_price: number;
    currency?: string;
}

// 25mm × 40mm sticker label — portrait orientation
const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
    ({ product_name, product_sku, product_barcode, product_price, currency = 'LE' }, ref) => {
        const barcodeValue = product_barcode || product_sku;

        // Scale bar width so the barcode fits within ~22mm (83px at 96dpi).
        // Code128 uses roughly 11 modules per char + ~57 modules overhead.
        const estimatedModules = barcodeValue.length * 11 + 57;
        const barWidth = Math.min(0.9, Math.max(0.4, 83 / estimatedModules));

        return (
            <div
                ref={ref}
                style={{
                    width: '25mm',
                    height: '40mm',
                    padding: '1mm 1mm 0.5mm 1mm',
                    boxSizing: 'border-box',
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '0.5mm',
                    overflow: 'hidden',
                }}
            >
                {/* Brand Header */}
                <div style={{
                    fontSize: '7px',
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    lineHeight: 1,
                    marginBottom: '0',
                }}>
                    CASHMERE
                </div>

                {/* Barcode — constrained to available width */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden', lineHeight: 0 }}>
                    <Barcode
                        value={barcodeValue}
                        width={barWidth}
                        height={18}
                        fontSize={5}
                        margin={0}
                        displayValue={true}
                        background="#ffffff"
                        lineColor="#000000"
                    />
                </div>

                {/* Product Name */}
                <div style={{
                    fontSize: '6px',
                    textAlign: 'center',
                    direction: 'rtl',
                    lineHeight: 1,
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    padding: '0 1px',
                }}>
                    {product_name}
                </div>

                {/* Price Bar */}
                <div style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '1px 3px',
                    boxSizing: 'border-box',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                } as React.CSSProperties}>
                    <span style={{ fontSize: '6.5px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Price</span>
                    <span style={{ fontSize: '8px', fontWeight: 'bold' }}>
                        {Number(product_price).toFixed(0)}{' '}
                        <span style={{ fontSize: '6.5px' }}>{currency}</span>
                    </span>
                </div>
            </div>
        );
    }
);

ProductLabel.displayName = 'ProductLabel';

export default ProductLabel;
