import api from './api';

export interface Worker {
    id: number;
    name: string;
    role: string;
    hourly_rate: string; // Decimal comes as string
    active: boolean;
}

export interface WorkerAttendance {
    id: number;
    worker: number;
    worker_name: string;
    date: string;
    hours_worked: string;
    notes: string;
    created_at: string;
}

export interface ProductionLog {
    id: number;
    worker: number;
    worker_name: string;
    job: number | null;
    job_name: string | null;
    quantity: number;
    date: string;
    created_at: string;
}

export interface HRStats {
    total_workers: number;
    total_hours_today: number;
    total_production_today: number;
}

export interface PayrollRecord {
    id: number;
    name: string;
    role: string;
    hourly_rate: string;
    total_hours: number; // Decimal string or number
    total_pay: number; // Decimal string or number
}

export const hrService = {
    // Workers
    getWorkers: async () => {
        const response = await api.get<Worker[] | { results: Worker[] }>('/factory/workers/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
    },
    createWorker: async (data: Partial<Worker>) => {
        const response = await api.post<Worker>('/factory/workers/', data);
        return response.data;
    },
    updateWorker: async (id: number, data: Partial<Worker>) => {
        const response = await api.patch<Worker>(`/factory/workers/${id}/`, data);
        return response.data;
    },
    deleteWorker: async (id: number) => {
        await api.delete(`/factory/workers/${id}/`);
    },
    getStats: async () => {
        const response = await api.get<HRStats>('/factory/workers/stats/');
        return response.data;
    },
    getPayroll: async (startDate: string, endDate: string) => {
        const response = await api.get<{ period: any, payroll: PayrollRecord[] }>(`/factory/workers/payroll/?start_date=${startDate}&end_date=${endDate}`);
        return response.data;
    },
    processPayroll: async (startDate: string, endDate: string) => {
        const response = await api.post<{ status: string, message: string }>(`/factory/workers/pay_payroll/?start_date=${startDate}&end_date=${endDate}`, {});
        return response.data;
    },

    // Attendance
    getAttendance: async () => {
        const response = await api.get<WorkerAttendance[]>('/factory/attendance/');
        return response.data;
    },
    logAttendance: async (data: { worker: number; date: string; hours_worked: number; notes?: string }) => {
        const response = await api.post<WorkerAttendance>('/factory/attendance/', data);
        return response.data;
    },

    // Production Logs
    getProductionLogs: async () => {
        const response = await api.get<ProductionLog[]>('/factory/production-logs/');
        return response.data;
    },
    logProduction: async (data: { worker: number; date: string; quantity: number; job?: number }) => {
        const response = await api.post<ProductionLog>('/factory/production-logs/', data);
        return response.data;
    }
};
