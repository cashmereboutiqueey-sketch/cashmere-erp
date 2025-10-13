
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getProductionOrders } from '@/services/production-service';
import { ProductionOrder } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getUsers } from '@/services/user-service';

type WorkerStats = {
    workerId: string;
    workerName: string;
    piecesCompleted: number;
    avatarUrl?: string;
}

export function WorkerReport() {
  const { t } = useTranslation();
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [productionOrders, users] = await Promise.all([
        getProductionOrders(),
        getUsers(),
      ]);

      const productionWorkers = users.filter(u => u.role === 'production' || u.role === 'admin');

      const stats = productionWorkers.map(worker => {
          const completedOrders = productionOrders.filter(
              order => order.status === 'done' && order.worker_id === worker.id
          );
          const piecesCompleted = completedOrders.reduce(
              (sum, order) => sum + order.required_quantity,
              0
          );
          return {
              workerId: worker.id,
              workerName: worker.name,
              avatarUrl: worker.avatarUrl,
              piecesCompleted,
          };
      });

      setWorkerStats(stats.sort((a,b) => b.piecesCompleted - a.piecesCompleted));
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('worker')}</TableHead>
            <TableHead className="text-right">{t('piecesCompleted')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workerStats.length > 0 ? (
            workerStats.map((stat) => (
              <TableRow key={stat.workerId}>
                <TableCell>
                     <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={stat.avatarUrl} alt={stat.workerName} />
                        <AvatarFallback>{stat.workerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{stat.workerName}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-lg">{stat.piecesCompleted}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center">
                {t('noWorkerData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
