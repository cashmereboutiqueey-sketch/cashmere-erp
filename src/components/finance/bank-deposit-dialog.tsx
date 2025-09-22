
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
import { logJournalEntry } from '@/services/finance-service';

const depositSchema = z.object({
  amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
  reference: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

export function BankDepositDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      reference: '',
    },
  });

  const onSubmit = (data: DepositFormData) => {
    // In a real app, this would trigger a database update.
    // For now, we'll just log the journal entry.
    logJournalEntry(`Bank Deposit - ${data.reference || 'Daily Deposit'}`, [
        { account: 'Bank Account', debit: data.amount },
        { account: 'Cash on Hand', credit: data.amount },
    ]);
    
    toast({
      title: 'Success',
      description: 'Bank deposit has been recorded.',
    });
    setOpen(false);
    form.reset();
    // You might want to trigger a re-fetch of account balances here.
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8" variant="outline">
          <Landmark className="mr-2 h-4 w-4" />
          Bank Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Bank Deposit</DialogTitle>
          <DialogDescription>
            Transfer funds from "Cash on Hand" to your "Bank Account".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Amount</FormLabel>
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
                  <FormLabel className="text-right">Reference</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" placeholder="e.g., EOD 25-Jul"/>
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Recording...' : 'Record Deposit'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
