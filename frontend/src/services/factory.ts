import api from './api';

export interface ProductionJob {
    id: number;
    name: string;
    product: number;
    product_name: string; // From serializer
    quantity: number;
    // Add other fields as needed
}

export const jobsService = {
    getJobs: async () => {
        const response = await api.get<ProductionJob[] | { results: ProductionJob[] }>('/factory/jobs/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
    },
    // Add other methods as needed
};
