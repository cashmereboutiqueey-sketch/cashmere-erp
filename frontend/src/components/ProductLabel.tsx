import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
    product_name: string;
    product_sku: string;
    product_barcode?: string;
    product_price: number;
    currency?: string;
}

// 40mm × 25mm sticker label
const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
    ({ product_name, product_sku, product_barcode, product_price, currency = 'LE' }, ref) => {
        const barcodeValue = product_barcode || product_sku;

        return (
            <div
                ref={ref}
                style={{
                    width: '40mm',
                    height: '25mm',
                    padding: '1.5mm 1.5mm 0 1.5mm',
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
                    fontSize: '8px',
                    fontWeight: 'bold',
                    letterSpacing: '2.5px',
                    lineHeight: 1,
                }}>
                    CASHMERE
                </div>

                {/* Barcode */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Barcode
                        value={barcodeValue}
                        width={0.9}
                        height={20}
                        fontSize={6}
                        margin={0}
                        displayValue={true}
                        background="#ffffff"
                        lineColor="#000000"
                    />
                </div>

                {/* Product Name */}
                <div style={{
                    fontSize: '6.5px',
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
                    padding: '1.5px 4px',
                    boxSizing: 'border-box',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                } as React.CSSProperties}>
                    <span style={{ fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Price</span>
                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>
                        {Number(product_price).toFixed(0)}{' '}
                        <span style={{ fontSize: '7px' }}>{currency}</span>
                    </span>
                </div>
            </div>
        );
    }
);

ProductLabel.displayName = 'ProductLabel';

export default ProductLabel;
