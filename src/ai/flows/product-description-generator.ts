'use server';

/**
 * @fileOverview Product description generator flow.
 *
 * - generateProductDescription - A function that generates a product description from basic product details.
 * - ProductDescriptionInput - The input type for the generateProductDescription function.
 * - ProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductDescriptionInputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  fabricCode: z.string().describe('The fabric code of the product.'),
  category: z.string().describe('The category of the product.'),
});
export type ProductDescriptionInput = z.infer<typeof ProductDescriptionInputSchema>;

const ProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});
export type ProductDescriptionOutput = z.infer<typeof ProductDescriptionOutputSchema>;

export async function generateProductDescription(input: ProductDescriptionInput): Promise<ProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: ProductDescriptionInputSchema},
  output: {schema: ProductDescriptionOutputSchema},
  prompt: `You are a marketing expert specializing in writing product descriptions for a fashion brand.

  Generate an engaging and SEO-friendly product description using the following details:

  Product Name: {{{name}}}
  Fabric Code: {{{fabricCode}}}
  Category: {{{category}}}
  
  The description should be concise, highlighting the key features and benefits of the product. It should also be appealing to online shoppers and optimized for search engines.
  `,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: ProductDescriptionInputSchema,
    outputSchema: ProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
