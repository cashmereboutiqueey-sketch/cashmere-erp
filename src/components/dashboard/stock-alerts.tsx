'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { analyzeStockLevels, AnalyzeStockLevelsOutput } from '@/ai/flows/low-stock-alert-analysis';
import { getProducts } from '@/services/product-service';
import { getFabrics } from '@/services/fabric-service';
import { Product, Fabric } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

// Helper to convert array of objects to CSV
const toCsv = (data: any[], headers: string[]) => {
  const headerRow = headers.join(',');
  const rows = data.map(obj => 
    headers.map(header => JSON.stringify(obj[header] || '')).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

export function StockAlerts() {
    const [alerts, setAlerts] = useState<AnalyzeStockLevelsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const runAnalysis = async () => {
        setIsLoading(true);
        try {
            // NOTE: In a real-world scenario, you'd fetch historical sales/usage data,
            // not just current stock levels. For this demo, we'll use current stock as a proxy.
            const [products, fabrics] = await Promise.all([getProducts(), getFabrics()]);

            const productStockLevels = Object.fromEntries(products.map(p => [p.name, p.variants.reduce((sum, v) => sum + v.stock_quantity, 0)]));
            const fabricStockLevels = Object.fromEntries(fabrics.map(f => [f.code, f.length_in_meters]));
            
            // Creating dummy historical data as this is not tracked yet.
            const dummyProductSales = products.map(p => ({ name: p.name, units_sold_last_30_days: Math.floor(Math.random() * 50) }));
            const dummyFabricUsage = fabrics.map(f => ({ code: f.code, meters_used_last_30_days: Math.floor(Math.random() * 100) }));

            const productsCsv = toCsv(dummyProductSales, ['name', 'units_sold_last_30_days']);
            const fabricsCsv = toCsv(dummyFabricUsage, ['code', 'meters_used_last_30_days']);

            const result = await analyzeStockLevels({
                productsData: productsCsv,
                fabricsData: fabricsCsv,
                currentProductStockLevels: JSON.stringify(productStockLevels),
                currentFabricStockLevels: JSON.stringify(fabricStockLevels),
            });
            setAlerts(result);
        } catch (error) {
            console.error("Error analyzing stock levels:", error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not generate AI-powered stock alerts.'
            });
            setAlerts(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        runAnalysis();
    }, []);

    const hasProductAlerts = alerts && alerts.productLowStockAlerts.length > 0;
    const hasFabricAlerts = alerts && alerts.fabricLowStockAlerts.length > 0;

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <AlertCircle className="text-destructive" />
                        AI-Powered Stock Alerts
                    </CardTitle>
                    <CardDescription>
                        Predicted low stock situations based on sales trends.
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={runAnalysis} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Rerun Analysis</span>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : (
                    <>
                        <Alert variant={hasProductAlerts ? "destructive" : "default"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Product Alerts</AlertTitle>
                            <AlertDescription>
                                {hasProductAlerts ? (
                                    <ul className="list-disc pl-5">
                                        {alerts.productLowStockAlerts.map((alert, index) => (
                                            <li key={`prod-alert-${index}`}>{alert}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "No product stock issues predicted."
                                )}
                            </AlertDescription>
                        </Alert>
                        <Alert variant={hasFabricAlerts ? "destructive" : "default"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Fabric Alerts</AlertTitle>
                            <AlertDescription>
                                 {hasFabricAlerts ? (
                                    <ul className="list-disc pl-5">
                                        {alerts.fabricLowStockAlerts.map((alert, index) => (
                                            <li key={`fab-alert-${index}`}>{alert}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "No fabric stock issues predicted."
                                )}
                            </AlertDescription>
                        </Alert>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
