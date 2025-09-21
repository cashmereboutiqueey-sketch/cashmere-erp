import { AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { stockAlerts } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function StockAlerts() {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <AlertCircle className="text-destructive" />
                    AI-Powered Stock Alerts
                </CardTitle>
                <CardDescription>
                    Predicted low stock situations based on sales trends.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Product Alerts</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5">
                            {stockAlerts.productLowStockAlerts.map((alert, index) => (
                                <li key={`prod-alert-${index}`}>{alert}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Fabric Alerts</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5">
                            {stockAlerts.fabricLowStockAlerts.map((alert, index) => (
                                <li key={`fab-alert-${index}`}>{alert}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
