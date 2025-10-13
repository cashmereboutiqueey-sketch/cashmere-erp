
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { WorkersTable } from '@/components/workers/workers-table';
import { useTranslation } from '@/hooks/use-translation';
import { Worker, WorkLog, ProductionOrder } from '@/lib/types';
import { getWorkers, getWorkLogs } from '@/services/worker-service';
import { getProductionOrders } from '@/services/production-service';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkersPage() {
    const { t } = useTranslation();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [fetchedWorkers, fetchedWorkLogs, fetchedProdOrders] = await Promise.all([
            getWorkers(),
            getWorkLogs(),
            getProductionOrders(),
        ]);
        setWorkers(fetchedWorkers);
        setWorkLogs(fetchedWorkLogs);
        setProductionOrders(fetchedProdOrders);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <>
            <PageHeader>
                <PageHeaderHeading>{t('workers')}</PageHeaderHeading>
            </PageHeader>
            <div className="p-4 lg:p-6">
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-[250px]" />
                            <Skeleton className="h-8 w-[120px]" />
                        </div>
                        <div className="rounded-md border">
                            <div className="space-y-2 p-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <WorkersTable 
                        workers={workers}
                        workLogs={workLogs}
                        productionOrders={productionOrders}
                        onDataChange={fetchData}
                    />
                )}
            </div>
        </>
    )
}
