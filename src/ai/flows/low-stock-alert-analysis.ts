'use server';

/**
 * @fileOverview Analyzes historical sales data and current stock levels to predict potential low-stock situations and generate notifications.
 *
 * - analyzeStockLevels - A function that analyzes stock levels and generates low stock alerts.
 * - AnalyzeStockLevelsInput - The input type for the analyzeStockLevels function.
 * - AnalyzeStockLevelsOutput - The return type for the analyzeStockLevels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStockLevelsInputSchema = z.object({
  productsData: z
    .string()
    .describe('A list of all products in CSV format. This may or may not include historical sales data.'),
  fabricsData: z
    .string()
    .describe('A list of all fabrics in CSV format. This may or may not include historical usage data.'),
  currentProductStockLevels: z
    .string()
    .describe('Current stock levels for each product in JSON format. The key is the product name and the value is the total stock quantity.'),
  currentFabricStockLevels: z
    .string()
    .describe('Current stock levels for each fabric in JSON format. The key is the fabric code and the value is the total stock in meters.'),
});

export type AnalyzeStockLevelsInput = z.infer<typeof AnalyzeStockLevelsInputSchema>;

const AnalyzeStockLevelsOutputSchema = z.object({
  productLowStockAlerts: z
    .array(z.string())
    .describe('Array of product names that are predicted to be low in stock. Each alert should be a concise sentence stating the prediction, e.g., "Product X is likely to run out in 2 weeks due to high demand."'),
  fabricLowStockAlerts: z
    .array(z.string())
    .describe('Array of fabric codes that are predicted to be low in stock. Each alert should be a concise sentence, e.g., "Fabric F001 is running low, consider reordering."'),
});

export type AnalyzeStockLevelsOutput = z.infer<typeof AnalyzeStockLevelsOutputSchema>;

export async function analyzeStockLevels(input: AnalyzeStockLevelsInput): Promise<AnalyzeStockLevelsOutput> {
  return analyzeStockLevelsFlow(input);
}

const analyzeStockLevelsPrompt = ai.definePrompt({
  name: 'analyzeStockLevelsPrompt',
  input: {schema: AnalyzeStockLevelsInputSchema},
  output: {schema: AnalyzeStockLevelsOutputSchema},
  prompt: `You are an AI assistant for a fashion ERP system, specialized in inventory management. Your task is to predict low stock situations for products and fabrics.

You are provided with data about all products and fabrics, and their current stock levels. The historical sales/usage data might be sparse or unavailable. Use the current stock levels as the primary indicator. Assume a standard 30-day sales cycle. If a product's stock is below 50 units, or a fabric's stock is below 100 meters, it's a potential risk.

Analyze the data and identify which products and fabrics are likely to run low on stock soon. Pay close attention to items with low current stock. For each item you identify, create a brief, actionable alert.

Products Data CSV: {{{productsData}}}
Fabrics Data CSV: {{{fabricsData}}}
Current Product Stock Levels JSON: {{{currentProductStockLevels}}}
Current Fabric Stock Levels JSON: {{{currentFabricStockLevels}}}

Based on your analysis, provide a list of products and fabrics that are predicted to be low in stock. The products are referenced by name and the fabrics by code.

Output the product and fabric low stock alerts as JSON arrays of strings.`,
});

const analyzeStockLevelsFlow = ai.defineFlow(
  {
    name: 'analyzeStockLevelsFlow',
    inputSchema: AnalyzeStockLevelsInputSchema,
    outputSchema: AnalyzeStockLevelsOutputSchema,
  },
  async input => {
    const {output} = await analyzeStockLevelsPrompt(input);
    return output!;
  }
);
