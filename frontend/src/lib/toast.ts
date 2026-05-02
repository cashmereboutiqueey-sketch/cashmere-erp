type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastListener = (message: string, type: ToastType) => void;

let _listener: ToastListener | null = null;

const toast = {
    _register: (fn: ToastListener) => { _listener = fn; },
    success: (message: string) => _listener?.(message, 'success'),
    error: (message: string) => _listener?.(message, 'error'),
    info: (message: string) => _listener?.(message, 'info'),
    warn: (message: string) => _listener?.(message, 'warning'),
};

export default toast;
