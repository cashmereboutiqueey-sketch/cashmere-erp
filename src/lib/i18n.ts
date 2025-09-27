
export const translations = {
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    pos: 'Point of Sale',
    orders: 'Orders',
    shipping: 'Shipping',
    products: 'Products',
    customers: 'Customers',
    suppliers: 'Suppliers',
    fabrics: 'Fabrics',
    production: 'Production',
    finance: 'Finance',
    reports: 'Reports',
    settings: 'Settings',
    needHelp: 'Need Help?',
    contactSupport: 'Contact Support',
    // Header Dropdown
    profile: 'Profile',
    logout: 'Logout',
  },
  ar: {
    // Sidebar
    dashboard: 'لوحة التحكم',
    pos: 'نقطة البيع',
    orders: 'الطلبات',
    shipping: 'الشحن',
    products: 'المنتجات',
    customers: 'العملاء',
    suppliers: 'الموردين',
    fabrics: 'الأقمشة',
    production: 'التصنيع',
    finance: 'المالية',
    reports: 'التقارير',
    settings: 'الإعدادات',
    needHelp: 'تحتاج مساعدة؟',
    contactSupport: 'تواصل مع الدعم',
    // Header Dropdown
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
  },
};

export type Language = keyof typeof translations;

export type TranslationKey = keyof typeof translations['en'];
