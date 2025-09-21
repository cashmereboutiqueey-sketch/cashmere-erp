import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockOrders } from '@/lib/data';

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  pending: "outline",
  processing: "secondary",
  completed: "default",
  cancelled: "destructive",
};

export function RecentOrders() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Recent Orders</CardTitle>
        <CardDescription>An overview of the latest 5 orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={order.customer?.avatarUrl} alt={order.customer?.name} />
                      <AvatarFallback>{order.customer?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{order.customer?.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[order.status]} className="capitalize">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${order.total_amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
