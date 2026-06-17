import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
    product_name: string;
    product_sku: string;
    product_barcode?: string;
    product_price: number;
    currency?: string;
}

// 4" × 2" sticker label — landscape (101.6mm × 50.8mm)
const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
    ({ product_name, product_sku, product_barcode, product_price, currency = 'LE' }, ref) => {
        const barcodeValue = product_barcode || product_sku;

        // Fit barcode within ~95mm (362px at 96dpi) of the 101.6mm width.
        // Code128: ~11 modules per char + ~57 modules overhead.
        const estimatedModules = barcodeValue.length * 11 + 57;
        const barWidth = Math.min(1.5, Math.max(0.5, 362 / estimatedModules));

        return (
            <div
                ref={ref}
                style={{
                    width: '4in',
                    height: '2in',
                    padding: '3mm 3mm 2mm 3mm',
                    boxSizing: 'border-box',
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                }}
            >
                {/* Brand Header */}
                <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '4px',
                    lineHeight: 1,
                }}>
                    CASHMERE
                </div>

                {/* Barcode */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden', lineHeight: 0 }}>
                    <Barcode
                        value={barcodeValue}
                        width={barWidth}
                        height={45}
                        fontSize={9}
                        margin={0}
                        displayValue={true}
                        background="#ffffff"
                        lineColor="#000000"
                    />
                </div>

                {/* Product Name */}
                <div style={{
                    fontSize: '9px',
                    textAlign: 'center',
                    direction: 'rtl',
                    lineHeight: 1,
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    padding: '0 2px',
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
                    padding: '2px 6px',
                    boxSizing: 'border-box',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                } as React.CSSProperties}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Price</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {Number(product_price).toFixed(0)}{' '}
                        <span style={{ fontSize: '9px' }}>{currency}</span>
                    </span>
                </div>
            </div>
        );
    }
);

ProductLabel.displayName = 'ProductLabel';

export default ProductLabel;
