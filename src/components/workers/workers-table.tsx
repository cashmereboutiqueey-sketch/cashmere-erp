
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Worker, ProductionOrder, WorkLog, TranslationKey } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateWorkerRate, addWorkLog } from '@/services/worker-service';
import { DatePicker } from './date-picker';
import { Label } from '../ui/label';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '../ui/card';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

interface WorkersTableProps {
  workers: Worker[];
  workLogs: WorkLog[];
  productionOrders: ProductionOrder[];
  onDataChange: () => void;
}

function LogHoursDialog({ worker, onLogAdded }: { worker: Worker, onLogAdded: () => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [hours, setHours] = useState('');

    const handleSubmit = async () => {
        if (!date || !hours || Number(hours) <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid date and hours.' });
            return;
        }

        try {
            await addWorkLog({
                worker_id: worker.id,
                date: date.toISOString().split('T')[0], // "YYYY-MM-DD"
                hours: Number(hours),
            });
            toast({ title: t('success'), description: 'Work log added successfully.' });
            onLogAdded();
            setOpen(false);
        } catch(error) {
            toast({ variant: 'destructive', title: t('error'), description: 'Failed to add work log.' });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    {t('logHours')}
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('logWorkHoursFor')} {worker.name}</DialogTitle>
                    <DialogDescription>
                        {t('logWorkHoursForDesc')}
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">{t('date')}</Label>
                        <DatePicker date={date} setDate={setDate} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hours" className="text-right">{t('hoursWorked')}</Label>
                        <Input id="hours" type="number" value={hours} onChange={e => setHours(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{t('logHours')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function WorkersTable({ workers, workLogs, productionOrders, onDataChange }: WorkersTableProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  
  const workerStats = useMemo(() => {
    return workers.map(worker => {
      const logs = workLogs.filter(log => log.worker_id === worker.id);
      const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
      
      const pieces = productionOrders
        .filter(po => po.worker_id === worker.id && po.status === 'done')
        .reduce((sum, po) => sum + po.required_quantity, 0);

      const productivity = totalHours > 0 ? pieces / totalHours : 0;
      const salary = totalHours * worker.hourly_rate;

      return {
        ...worker,
        totalHours,
        piecesCompleted: pieces,
        productivity,
        salary,
      };
    });
  }, [workers, workLogs, productionOrders]);
  
  const handleRateChange = (workerId: string, value: string) => {
    setRateInputs(prev => ({...prev, [workerId]: value}));
  }

  const handleRateUpdate = async (workerId: string) => {
    const newRate = parseFloat(rateInputs[workerId]);
    if (isNaN(newRate) || newRate < 0) {
        toast({ variant: 'destructive', title: 'Invalid Rate' });
        return;
    }
    try {
        await updateWorkerRate(workerId, newRate);
        toast({ title: t('success'), description: "Worker's hourly rate updated." });
        onDataChange(); // Refresh data
    } catch(error) {
        toast({ variant: 'destructive', title: t('error'), description: 'Failed to update rate.' });
    }
  }


  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader><CardTitle>{t('totalWorkers')}</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{workers.length}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>{t('totalPiecesCompleted')}</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{workerStats.reduce((s,w) => s + w.piecesCompleted, 0)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>{t('totalSalariesPaid')}</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{formatCurrency(workerStats.reduce((s,w) => s + w.salary, 0))}</p></CardContent>
            </Card>
        </div>
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>{t('worker')}</TableHead>
                <TableHead>{t('hourlyRate')}</TableHead>
                <TableHead>{t('hoursWorked')}</TableHead>
                <TableHead>{t('piecesCompleted')}</TableHead>
                <TableHead>{t('productivityRate')}</TableHead>
                <TableHead>{t('calculatedSalary')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {workerStats.map(stat => (
                <TableRow key={stat.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{stat.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{stat.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number"
                            className="h-8 w-24"
                            placeholder={stat.hourly_rate.toFixed(2)}
                            value={rateInputs[stat.id] ?? ''}
                            onChange={e => handleRateChange(stat.id, e.target.value)}
                        />
                        <Button size="xs" onClick={() => handleRateUpdate(stat.id)} disabled={!rateInputs[stat.id]}>{t('update')}</Button>
                    </div>
                </TableCell>
                <TableCell>{stat.totalHours.toFixed(1)}</TableCell>
                <TableCell>{stat.piecesCompleted}</TableCell>
                <TableCell>{stat.productivity.toFixed(2)} {t('piecesPerHour')}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(stat.salary)}</TableCell>
                <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <LogHoursDialog worker={stat} onLogAdded={onDataChange} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    </div>
  );
}
