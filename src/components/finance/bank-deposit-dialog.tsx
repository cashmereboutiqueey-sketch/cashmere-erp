
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { recordBankDeposit } from '@/services/finance-service';
import { useTranslation } from '@/hooks/use-translation';

const depositSchema = z.object({
  amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
  reference: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

export function BankDepositDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      reference: '',
    },
  });

  const onSubmit = async (data: DepositFormData) => {
    try {
      await recordBankDeposit(data.amount, data.reference);
      toast({
        title: t('success'),
        description: t('bankDepositRecorded'),
      });
      setOpen(false);
      form.reset();
      // In a real app, you'd trigger re-fetching of account balances.
      // For now, a page reload will show the change in console.
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToRecordBankDeposit'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8" variant="outline">
          <Landmark className="mr-2 h-4 w-4" />
          {t('bankDeposit')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('recordBankDeposit')}</DialogTitle>
          <DialogDescription>
            {t('recordBankDepositDesc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('amount')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" className="col-span-3" placeholder="e.g., 1500.00"/>
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('reference')}</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder={t('referencePlaceholder')}/>
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('recording') : t('recordDeposit')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
