export const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$' },
  { code: 'MXN', name: 'Peso mexicano', symbol: 'MX$' },
  { code: 'COP', name: 'Peso colombiano', symbol: 'CO$' },
  { code: 'ARS', name: 'Peso argentino', symbol: 'AR$' },
  { code: 'CLP', name: 'Peso chileno', symbol: 'CL$' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
  { code: 'GTQ', name: 'Quetzal guatemalteco', symbol: 'Q' },
];

export const FONT_OPTIONS = {
  heading: [
    { name: 'Inter', value: 'Inter' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Montserrat', value: 'Montserrat' },
  ],
  body: [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro' },
  ],
};

export const PRODUCTS_PER_PAGE_OPTIONS = [8, 12, 16, 20, 24];

export function formatCurrency(amount: number, currencyCode: string): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || '$';
  
  return `${symbol}${amount.toFixed(2)}`;
}

export function generateSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateWhatsApp(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
