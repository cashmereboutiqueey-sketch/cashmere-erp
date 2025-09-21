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
    .describe('Historical sales data for all products in CSV format.'),
  fabricsData: z
    .string()
    .describe('Historical usage data for all fabrics in CSV format.'),
  currentProductStockLevels: z
    .string()
    .describe('Current stock levels for each product in JSON format.'),
  currentFabricStockLevels: z
    .string()
    .describe('Current stock levels for each fabric in JSON format.'),
});

export type AnalyzeStockLevelsInput = z.infer<typeof AnalyzeStockLevelsInputSchema>;

const AnalyzeStockLevelsOutputSchema = z.object({
  productLowStockAlerts: z
    .array(z.string())
    .describe('Array of product names that are predicted to be low in stock.'),
  fabricLowStockAlerts: z
    .array(z.string())
    .describe('Array of fabric codes that are predicted to be low in stock.'),
});

export type AnalyzeStockLevelsOutput = z.infer<typeof AnalyzeStockLevelsOutputSchema>;

export async function analyzeStockLevels(input: AnalyzeStockLevelsInput): Promise<AnalyzeStockLevelsOutput> {
  return analyzeStockLevelsFlow(input);
}

const analyzeStockLevelsPrompt = ai.definePrompt({
  name: 'analyzeStockLevelsPrompt',
  input: {schema: AnalyzeStockLevelsInputSchema},
  output: {schema: AnalyzeStockLevelsOutputSchema},
  prompt: `You are an AI assistant for a fashion ERP system, specialized in predicting low stock situations for products and fabrics.

You are provided with the historical sales data for both products and fabrics in CSV format, along with the current stock levels in JSON format. Analyze the data and predict which products and fabrics are likely to run low in stock.  Pay close attention to trends and seasonality. For each predicted item, mention by how much the stock will be low and when.

Products Sales Data CSV: {{{productsData}}}
Fabrics Usage Data CSV: {{{fabricsData}}}
Current Product Stock Levels JSON: {{{currentProductStockLevels}}}
Current Fabric Stock Levels JSON: {{{currentFabricStockLevels}}}

Based on your analysis, provide a list of products and fabrics that are predicted to be low in stock. The products are referenced by name and the fabrics by code.

Output the product and fabric low stock alerts as JSON arrays.`,
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
