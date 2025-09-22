
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookCopy, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Account } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';

const mockAccounts: Account[] = [
    { id: '1', name: 'Cash (1010)', code: '1010', type: 'asset', balance: 50000 },
    { id: '2', name: 'Accounts Receivable (1200)', code: '1200', type: 'asset', balance: 15000 },
    { id: '3', name: 'Inventory (1400)', code: '1400', type: 'asset', balance: 75000 },
    { id: '4', name: 'Accounts Payable (2010)', code: '2010', type: 'liability', balance: 20000 },
    { id: '5', name: 'Sales Revenue (4010)', code: '4010', type: 'revenue', balance: 120000 },
    { id: '6', name: 'Cost of Goods Sold (5010)', code: '5010', type: 'expense', balance: 60000 },
    { id: '7', name: 'Rent Expense (5020)', code: '5020', type: 'expense', balance: 5000 },
    { id: '8', name: 'Owner\'s Equity (3010)', code: '3010', type: 'equity', balance: 55000 },
];

const journalEntrySchema = z.object({
  account_id: z.string().min(1, "Account is required."),
  debit: z.preprocess((val) => Number(val), z.number().min(0)),
  credit: z.preprocess((val) => Number(val), z.number().min(0)),
});

const journalVoucherSchema = z.object({
  description: z.string().min(1, "Description is required"),
  entries: z.array(journalEntrySchema).min(2, "At least two entries are required."),
}).refine(data => {
    const totalDebits = data.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = data.entries.reduce((sum, entry) => sum + entry.credit, 0);
    return totalDebits === totalCredits;
}, {
    message: "Total debits must equal total credits.",
    path: ["entries"],
});

type JournalVoucherFormData = z.infer<typeof journalVoucherSchema>;

export function JournalVoucherDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const methods = useForm<JournalVoucherFormData>({
    resolver: zodResolver(journalVoucherSchema),
    defaultValues: {
      description: '',
      entries: [
        { account_id: '', debit: 0, credit: 0 },
        { account_id: '', debit: 0, credit: 0 },
      ],
    },
  });

  const { control, handleSubmit, watch } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries"
  });

  const entries = watch("entries");
  const totalDebits = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
  const totalCredits = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);
  const balance = totalDebits - totalCredits;

  const onSubmit = (data: JournalVoucherFormData) => {
    // This is where you would call a service to save the voucher
    console.log(data);
    toast({
      title: 'Success',
      description: 'Journal voucher has been created.',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8" variant="outline">
          <BookCopy className="mr-2 h-4 w-4" />
          New Journal Voucher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Journal Voucher</DialogTitle>
          <DialogDescription>
            Record a manual journal entry in the general ledger. Debits must equal credits.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="e.g., Record monthly payroll" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                        <FormField
                            control={control}
                            name={`entries.${index}.account_id`}
                            render={({ field }) => (
                                <FormItem className="col-span-6">
                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Account</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {mockAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name={`entries.${index}.debit`}
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                     <FormLabel className={index !== 0 ? "sr-only" : ""}>Debit</FormLabel>
                                    <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                                     <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name={`entries.${index}.credit`}
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Credit</FormLabel>
                                    <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="col-span-2 flex items-end h-full">
                           <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => remove(index)}
                                disabled={fields.length <= 2}
                                className="mt-auto"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        </div>
                    </div>
                ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ account_id: '', debit: 0, credit: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Row
            </Button>
            
            <Separator />
            
            <div className="flex justify-end gap-8 font-mono text-sm">
                <div className="text-right">
                    <p className="text-muted-foreground">Total Debits</p>
                    <p>${totalDebits.toFixed(2)}</p>
                </div>
                 <div className="text-right">
                    <p className="text-muted-foreground">Total Credits</p>
                    <p>${totalCredits.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground">Balance</p>
                    <p className={balance !== 0 ? 'text-destructive' : ''}>${balance.toFixed(2)}</p>
                </div>
            </div>

            <DialogFooter>
              <Button type="submit">Create Voucher</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
