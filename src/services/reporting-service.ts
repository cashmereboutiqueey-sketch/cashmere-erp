

'use server';

import { getOrders } from './order-service';
import { getExpenses } from './finance-service';
import { getProducts } from './product-service';
import { getFabrics } from './fabric-service';
import { getProductionOrders } from './production-service';
import type { DateRange } from 'react-day-picker';
import { capitalize } from 'string-ts';

// In a real application, these balances would come from a real-time GL service.
// For this demo, we'll derive them from the transaction services.
// This is not perfectly accurate but demonstrates the concept.

export type IncomeStatementData = {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: Record<string, number>;
    totalOperatingExpenses: number;
    netIncome: number;
}

export async function getIncomeStatementData(dateRange: DateRange): Promise<IncomeStatementData> {
    const [orders, expenses] = await Promise.all([
        getOrders(),
        getExpenses(dateRange),
    ]);

    const filteredOrders = orders.filter(order => {
        if (!dateRange?.from || !dateRange?.to) return true;
        const orderDate = new Date(order.created_at);
        return order.status === 'completed' && orderDate >= dateRange.from && orderDate <= dateRange.to;
    });

    const revenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);

    const cogsExpenses = expenses.filter(e => e.category === 'cogs');
    const cogs = cogsExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const grossProfit = revenue - cogs;

    const operatingExpensesList = expenses.filter(e => e.category !== 'cogs');
    const operatingExpenses = operatingExpensesList.reduce((acc, expense) => {
        const category = capitalize(expense.category);
        if(!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += expense.amount;
        return acc;
    }, {} as Record<string, number>);

    const totalOperatingExpenses = operatingExpensesList.reduce((sum, e) => sum + e.amount, 0);

    const netIncome = grossProfit - totalOperatingExpenses;

    return {
        revenue,
        cogs,
        grossProfit,
        operatingExpenses,
        totalOperatingExpenses,
        netIncome
    };
}


export type BalanceSheetData = {
    assets: {
        cash: number;
        accountsReceivable: number;
        inventory: number;
    },
    liabilities: {
        accountsPayable: number;
    },
    equity: {
        retainedEarnings: number;
    },
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
};

export async function getBalanceSheetData(): Promise<BalanceSheetData> {
    const [orders, expenses, products, fabrics] = await Promise.all([
        getOrders(),
        getExpenses(),
        getProducts(),
        getFabrics()
    ]);

    // --- Assets ---
    const grossRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0);
    const totalPaid = orders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
    const totalExpensesPaid = expenses.filter(e => e.category !== 'cogs').reduce((sum, e) => sum + e.amount, 0);
    const cash = totalPaid - totalExpensesPaid;

    const accountsReceivable = grossRevenue - totalPaid;

    const productInventoryValue = products.reduce((sum, p) => {
        return sum + p.variants.reduce((variantSum, v) => variantSum + (v.cost * v.stock_quantity), 0);
    }, 0);
    const fabricInventoryValue = fabrics.reduce((sum, f) => sum + (f.price_per_meter * f.length_in_meters), 0);
    const inventory = productInventoryValue + fabricInventoryValue;
    
    const totalAssets = cash + accountsReceivable + inventory;

    // --- Liabilities ---
    const accountsPayable = expenses.filter(e => e.category === 'cogs').reduce((sum, e) => sum + e.amount, 0);
    const totalLiabilities = accountsPayable;

    // --- Equity ---
    // This is a simplified calculation. In a real system, Retained Earnings is a running total.
    const incomeData = await getIncomeStatementData({ from: new Date(0), to: new Date() });
    const retainedEarnings = incomeData.netIncome;
    const totalEquity = retainedEarnings;
    
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
        assets: {
            cash,
            accountsReceivable,
            inventory
        },
        liabilities: {
            accountsPayable
        },
        equity: {
            retainedEarnings
        },
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity,
    };
}

export { getProductionOrders };
