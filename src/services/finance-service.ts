
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { Expense } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { DateRange } from 'react-day-picker';

const expensesCollection = collection(db, 'expenses');

// Simplified journal entry logger
const logJournalEntry = (description: string, entries: {account: string, debit?: number, credit?: number}[]) => {
    console.log(`-- JOURNAL ENTRY: ${description} --`);
    entries.forEach(entry => {
        console.log(`  ${entry.account}: Debit: ${entry.debit || 0}, Credit: ${entry.credit || 0}`);
    });
    console.log('------------------------------------');
}

const fromFirestore = (doc: any): Expense => {
  const data = doc.data();
  const timestamp = data.created_at || data.createdAt;
  return {
    id: doc.id,
    category: data.category,
    amount: data.amount,
    supplier_id: data.supplier_id,
    note: data.note,
    created_at: timestamp.toDate().toISOString(),
  };
};

export async function getExpenses(dateRange?: DateRange): Promise<Expense[]> {
  try {
    let q = query(expensesCollection);
    if (dateRange?.from && dateRange?.to) {
        q = query(
            expensesCollection, 
            where('created_at', '>=', Timestamp.fromDate(dateRange.from)),
            where('created_at', '<=', Timestamp.fromDate(dateRange.to))
        );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting expenses: ', error);
    return [];
  }
}

export async function addExpense(expenseData: Omit<Expense, 'id' | 'created_at'>) {
  try {
    const docRef = await addDoc(expensesCollection, {
      ...expenseData,
      created_at: serverTimestamp(),
    });
    
    // Auto-posting to GL
    if (expenseData.category === 'cogs') {
        logJournalEntry(`Purchase - ${expenseData.note || 'Supplier Bill'}`, [
            { account: 'Cost of Goods Sold', debit: expenseData.amount },
            { account: 'Accounts Payable', credit: expenseData.amount },
        ]);
    } else {
         logJournalEntry(`Expense - ${expenseData.note || expenseData.category}`, [
            { account: `${expenseData.category} Expense`, debit: expenseData.amount },
            { account: 'Cash', credit: expenseData.amount },
        ]);
    }


    revalidatePath('/finance');
    revalidatePath('/reports');
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense: ', error);
    throw new Error('Could not add expense');
  }
}

export async function recordBankDeposit(amount: number, reference?: string) {
    try {
        logJournalEntry(`Bank Deposit - ${reference || 'Daily Deposit'}`, [
            { account: 'Bank Account', debit: amount },
            { account: 'Cash on Hand', credit: amount },
        ]);
        // In a real app, this would create a real transaction record.
        // For now, we just log it.
        revalidatePath('/finance');
    } catch (error) {
        console.error('Error recording bank deposit: ', error);
        throw new Error('Could not record bank deposit');
    }
}


export async function updateExpense(id: string, expenseData: Partial<Expense>) {
  try {
    const expenseDoc = doc(db, 'expenses', id);
    await updateDoc(expenseDoc, {
        ...expenseData,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/finance');
    revalidatePath('/reports');
  } catch (error) {
    console.error('Error updating expense: ', error);
    throw new Error('Could not update expense');
  }
}

export async function deleteExpense(id: string) {
  try {
    const expenseDoc = doc(db, 'expenses', id);
    await deleteDoc(expenseDoc);
    revalidatePath('/finance');
    revalidatePath('/reports');
  } catch (error) {
    console.error('Error deleting expense: ', error);
    throw new Error('Could not delete expense');
  }
}
