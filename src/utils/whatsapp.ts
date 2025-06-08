import { Product } from '../contexts/StoreContext';
import { formatCurrency } from './constants';

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface OrderData {
  items: OrderItem[];
  customerName: string;
  customerPhone?: string;
  address?: string;
  paymentMethod: string;
  deliveryMethod: string;
  comments?: string;
  deliveryCost?: number;
  currencyCode: string;
  storeName: string;
}

export interface MessageTemplate {
  greeting: string;
  introduction: string;
  closing: string;
  includePhone: boolean;
  includeComments: boolean;
}

// ✅ SOLUTION: Template with safe emojis that work in WhatsApp URLs
export const DEFAULT_MESSAGE_TEMPLATE: MessageTemplate = {
  greeting: '¡Hola {storeName}!',
  introduction: 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
  closing: '¡Muchas gracias!',
  includePhone: true,
  includeComments: true,
};

// 🎨 ALTERNATIVE: Template with safe emojis (optional)
export const SAFE_EMOJI_TEMPLATE: MessageTemplate = {
  greeting: '¡Hola {storeName}! ✨',
  introduction: 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
  closing: '¡Muchas gracias! 😊',
  includePhone: true,
  includeComments: true,
};

export function generateWhatsAppMessage(
  orderData: OrderData, 
  storeUrl: string, 
  template: MessageTemplate = DEFAULT_MESSAGE_TEMPLATE
): string {
  const { 
    items, 
    customerName, 
    customerPhone, 
    address, 
    paymentMethod, 
    deliveryMethod, 
    comments, 
    deliveryCost = 0, 
    currencyCode,
    storeName 
  } = orderData;
  
  // Build message with compact format like the example
  let message = template.greeting.replace('{storeName}', storeName) + '\n\n';
  message += template.introduction.replace('{customerName}', customerName) + '\n\n';
  
  // Order details with compact format
  message += '🛍️ Mi Pedido:\n';
  
  let subtotal = 0;
  items.forEach(item => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;
    message += `  - ${item.product.name}`;
    if (item.quantity > 1) {
      message += ` (x${item.quantity})`;
    }
    message += ` - ${formatCurrency(itemTotal, currencyCode)}\n`;
  });
  
  // Total in same line format
  message += `\n💰 Total a Pagar: ${formatCurrency(subtotal + deliveryCost, currencyCode)}\n\n`;
  
  // Payment and delivery in compact format (same line when possible)
  message += `💳 Forma de Pago: ${paymentMethod}\n`;
  message += `🚚 Entrega: ${deliveryMethod}`;
  
  // Add delivery cost if applicable
  if (deliveryCost > 0) {
    message += ` (+${formatCurrency(deliveryCost, currencyCode)} envío)`;
  }
  
  // Additional comments (only if template allows and comments exist)
  if (template.includeComments && comments && comments.trim()) {
    message += `\n\n💬 Comentarios: ${comments}`;
  }
  
  // Phone number (only if template allows and phone exists)
  if (template.includePhone && customerPhone && customerPhone.trim()) {
    message += `\n📱 Mi Teléfono: ${customerPhone}`;
  }
  
  message += `\n\n${template.closing}`;
  
  return message;
}

// ✅ IMPROVED FUNCTION: More robust encoding
export function sendWhatsAppMessage(phoneNumber: string, message: string): void {
  // Clean phone number - only digits
  const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
  
  // ⚡ IMPROVEMENT: Ensure message encodes correctly
  try {
    // Use the standard WhatsApp URL format with proper encoding
    const encodedMessage = encodeURIComponent(message);
    
    // Use wa.me which is more reliable than api.whatsapp.com
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // 🔍 DEBUG: Log to verify URL (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('WhatsApp URL:', whatsappUrl);
      console.log('Original message:', message);
    }
    
    window.open(whatsappUrl, '_blank');
  } catch (error) {
    console.error('Error generating WhatsApp URL:', error);
    
    // 🚨 FALLBACK: User-friendly error message
    alert('There was a problem generating the WhatsApp link. Please try again.');
  }
}

// 🎯 ADDITIONAL FUNCTION: Validate message before sending
export function validateMessageContent(message: string): boolean {
  // Check for problematic characters
  const problematicChars = /[\uFFFD]/g; // Unicode replacement character
  
  if (problematicChars.test(message)) {
    console.warn('Message contains problematic characters');
    return false;
  }
  
  // Check length (WhatsApp has limits)
  if (message.length > 4096) {
    console.warn('Message too long for WhatsApp');
    return false;
  }
  
  return true;
}

// 🔧 HELPER FUNCTION: Clean problematic emojis
export function sanitizeMessageForWhatsApp(message: string): string {
  // Replace problematic emojis with text alternatives
  return message
    .replace(/👋/g, '✨')  // Replace with safe sparkle emoji
    .replace(/🙏/g, '😊')  // Replace with safe smile emoji
    .replace(/🛒/g, '🛍️')  // Replace with safe shopping bag emoji
    .replace(/[\uFFFD]/g, ''); // Remove replacement characters
}

// 📱 IMPROVED USAGE EXAMPLE
export function sendOrderToWhatsApp(orderData: OrderData, storeUrl: string, whatsappNumber: string): void {
  // Generate message
  let message = generateWhatsAppMessage(orderData, storeUrl);
  
  // Validate content
  if (!validateMessageContent(message)) {
    // If there are problems, sanitize the message
    message = sanitizeMessageForWhatsApp(message);
  }
  
  // Send message
  sendWhatsAppMessage(whatsappNumber, message);
}
