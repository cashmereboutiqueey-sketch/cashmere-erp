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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { addExpense } from '@/services/finance-service';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { useTranslation } from '@/hooks/use-translation';

const expenseCategories = ['cogs', 'marketing', 'rent', 'salaries', 'utilities', 'other'];

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
  note: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      amount: 0,
      note: '',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await addExpense(data);
      toast({
        title: t('success'),
        description: t('expenseAdded'),
      });
      setOpen(false);
      form.reset();
      // Re-fetching is handled by parent components or page reloads
      // for simplicity in this example. In a larger app, you might use
      // a state management library to trigger updates.
       window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToAddExpense'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addExpense')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('recordNewExpense')}</DialogTitle>
          <DialogDescription>
            {t('recordNewExpenseDesc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('category')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category} className="capitalize">
                          {t(category as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('amount')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" className="col-span-3" placeholder="e.g., 500.00"/>
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-start gap-4">
                  <FormLabel className="text-right pt-2">{t('note')}</FormLabel>
                  <FormControl>
                     <Textarea {...field} className="col-span-3" placeholder={t('notePlaceholder')}/>
                  </FormControl>
                  <FormMessage className="col-span-4 pl-[calc(25%+1rem)]" />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('recording') : t('addExpense')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
