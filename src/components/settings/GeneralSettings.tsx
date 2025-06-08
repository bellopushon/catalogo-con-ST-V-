import React, { useState } from 'react';
import { Upload, X, Phone, Globe, DollarSign, Type, MessageSquare } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { CURRENCIES, FONT_OPTIONS, generateSlug } from '../../utils/constants';
import { MessageTemplate, DEFAULT_MESSAGE_TEMPLATE } from '../../utils/whatsapp';

export default function GeneralSettings() {
  const { state, updateStore } = useStore();
  const { success, error } = useToast();
  const store = state.currentStore;
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: store?.name || '',
    slug: store?.slug || '',
    description: store?.description || '',
    logo: store?.logo || '',
    whatsapp: store?.whatsapp || '',
    currency: store?.currency || 'USD',
    fonts: {
      heading: store?.headingFont || 'Inter',
      body: store?.bodyFont || 'Inter',
    },
    socialMedia: {
      facebook: store?.facebookUrl || '',
      instagram: store?.instagramUrl || '',
      tiktok: store?.tiktokUrl || '',
      twitter: store?.twitterUrl || '',
      showInCatalog: store?.showSocialInCatalog ?? true,
    },
    messageTemplate: {
      greeting: store?.messageGreeting || DEFAULT_MESSAGE_TEMPLATE.greeting,
      introduction: store?.messageIntroduction || DEFAULT_MESSAGE_TEMPLATE.introduction,
      closing: store?.messageClosing || DEFAULT_MESSAGE_TEMPLATE.closing,
      includePhone: store?.includePhoneInMessage ?? DEFAULT_MESSAGE_TEMPLATE.includePhone,
      includeComments: store?.includeCommentsInMessage ?? DEFAULT_MESSAGE_TEMPLATE.includeComments,
    },
  });

  const [slugModified, setSlugModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
      
      // Auto-generate slug when name changes (only if slug hasn't been manually modified)
      if (name === 'name' && !slugModified) {
        setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
      }
      
      if (name === 'slug') {
        setSlugModified(true);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error('Error de archivo', 'La imagen debe ser menor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      error('Error de validación', 'El nombre de la tienda es requerido');
      return false;
    }

    if (!formData.slug.trim()) {
      error('Error de validación', 'La URL amigable es requerida');
      return false;
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(formData.slug)) {
      error('Error de validación', 'La URL amigable solo puede contener letras minúsculas, números y guiones');
      return false;
    }

    if (formData.whatsapp && !/^\+?[1-9]\d{1,14}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      error('Error de validación', 'El número de WhatsApp no tiene un formato válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      // Preparar datos para actualizar
      const updateData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        logo: formData.logo,
        whatsapp: formData.whatsapp.trim(),
        currency: formData.currency,
        headingFont: formData.fonts.heading,
        bodyFont: formData.fonts.body,
        facebookUrl: formData.socialMedia.facebook.trim(),
        instagramUrl: formData.socialMedia.instagram.trim(),
        tiktokUrl: formData.socialMedia.tiktok.trim(),
        twitterUrl: formData.socialMedia.twitter.trim(),
        showSocialInCatalog: formData.socialMedia.showInCatalog,
        messageGreeting: formData.messageTemplate.greeting,
        messageIntroduction: formData.messageTemplate.introduction,
        messageClosing: formData.messageTemplate.closing,
        includePhoneInMessage: formData.messageTemplate.includePhone,
        includeCommentsInMessage: formData.messageTemplate.includeComments,
      };

      // Actualizar tienda en Supabase
      await updateStore(updateData);

      success('¡Configuración guardada!', 'Los cambios se han aplicado correctamente');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      error('Error al guardar', err.message || 'No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency);

  // Show message if no store is available
  if (!store) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Ajustes Generales</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Configura la información básica de tu tienda</p>
        </div>
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay tienda configurada</h3>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base">Primero debes configurar tu tienda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Ajustes Generales</h1>
        <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Configura la información básica de tu tienda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
        {/* Store Information - Mobile Optimized */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Información General</h2>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="Mi Tienda Increíble"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                URL Amigable (Slug) *
              </label>
              <div className="flex flex-col sm:flex-row">
                <span className="bg-gray-100 admin-dark:bg-gray-700 px-3 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-t-lg sm:rounded-l-lg sm:rounded-t-lg border-b-0 sm:border-b sm:border-r-0 text-xs lg:text-sm text-gray-600 admin-dark:text-gray-300 flex items-center">
                  tutaviendo.com/store/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-b-lg sm:rounded-r-lg sm:rounded-b-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                  placeholder="mi-tienda"
                />
              </div>
              <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">
                Solo letras minúsculas, números y guiones. Ejemplo: mi-tienda-online
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Número de WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                  placeholder="+1234567890"
                />
              </div>
              <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">
                Incluye el código de país. Ejemplo: +1234567890
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Descripción Corta (opcional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={160}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="Breve descripción de tu tienda"
              />
              <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">
                {formData.description.length}/160 caracteres
              </p>
            </div>

            {/* Logo Upload - Mobile Optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Logo de la Tienda
              </label>
              
              {formData.logo ? (
                <div className="relative inline-block">
                  <img
                    src={formData.logo}
                    alt="Logo"
                    className="w-24 h-24 lg:w-32 lg:h-32 object-contain border border-gray-300 admin-dark:border-gray-600 rounded-lg bg-gray-50 admin-dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 lg:w-32 lg:h-32 border-2 border-dashed border-gray-300 admin-dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 admin-dark:text-gray-400">Subir logo</p>
                  </div>
                </div>
              )}
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Currency and Format - Mobile Optimized */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Moneda y Formato</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
              Moneda
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} - {currency.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 admin-dark:text-gray-400 mt-2">
              Los precios se mostrarán como: {selectedCurrency?.symbol}100.00
            </p>
          </div>
        </div>

        {/* Typography - Mobile Optimized */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <Type className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Tipografías</h2>
          </div>

          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Fuente para Títulos
              </label>
              <select
                name="fonts.heading"
                value={formData.fonts.heading}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white"
              >
                {FONT_OPTIONS.heading.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Fuente para Cuerpo de Texto
              </label>
              <select
                name="fonts.body"
                value={formData.fonts.body}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white"
              >
                {FONT_OPTIONS.body.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* WhatsApp Message Template */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Plantilla de Mensaje WhatsApp</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Saludo
              </label>
              <input
                type="text"
                name="messageTemplate.greeting"
                value={formData.messageTemplate.greeting}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="¡Hola {storeName}!"
              />
              <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">
                Usa {'{storeName}'} para incluir el nombre de tu tienda
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Introducción
              </label>
              <textarea
                name="messageTemplate.introduction"
                value={formData.messageTemplate.introduction}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="Soy {customerName}. Me gustaría hacer el siguiente pedido:"
              />
              <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">
                Usa {'{customerName}'} para incluir el nombre del cliente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Despedida
              </label>
              <input
                type="text"
                name="messageTemplate.closing"
                value={formData.messageTemplate.closing}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="¡Muchas gracias!"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 admin-dark:text-gray-300">Información Adicional</h3>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="messageTemplate.includePhone"
                  checked={formData.messageTemplate.includePhone}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 admin-dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 admin-dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 admin-dark:text-gray-300">Incluir teléfono del cliente (si lo proporciona)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="messageTemplate.includeComments"
                  checked={formData.messageTemplate.includeComments}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 admin-dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 admin-dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 admin-dark:text-gray-300">Incluir comentarios adicionales</span>
              </label>
            </div>

            {/* Preview - Updated to match new format */}
            <div className="mt-6 p-4 bg-gray-50 admin-dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 admin-dark:text-white mb-2">Vista Previa del Mensaje</h4>
              <div className="text-sm text-gray-600 admin-dark:text-gray-300 whitespace-pre-line bg-white admin-dark:bg-gray-800 p-3 rounded border border-gray-200 admin-dark:border-gray-600">
                {formData.messageTemplate.greeting.replace('{storeName}', formData.name || '[Nombre de la Tienda]')}
                {'\n\n'}
                {formData.messageTemplate.introduction.replace('{customerName}', '[Nombre del Cliente]')}
                {'\n\n'}
                🛍️ Mi Pedido:
                {'\n'}  - Producto Ejemplo - $10.00
                {'\n\n'}
                💰 Total a Pagar: $10.00
                {'\n\n'}
                💳 Forma de Pago: Efectivo
                {'\n'}
                🚚 Entrega: Recogida en Tienda
                {formData.messageTemplate.includeComments && '\n\n💬 Comentarios: [Comentarios del cliente]'}
                {formData.messageTemplate.includePhone && '\n📱 Mi Teléfono: [Teléfono del cliente]'}
                {'\n\n'}
                {formData.messageTemplate.closing}
              </div>
            </div>
          </div>
        </div>

        {/* Social Media - Mobile Optimized */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Redes Sociales</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="socialMedia.showInCatalog"
                checked={formData.socialMedia.showInCatalog}
                onChange={handleInputChange}
                className="rounded border-gray-300 admin-dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 admin-dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 admin-dark:text-gray-300">Mostrar en catálogo</span>
            </label>
          </div>

          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Facebook
              </label>
              <input
                type="url"
                name="socialMedia.facebook"
                value={formData.socialMedia.facebook}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="https://facebook.com/tutienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Instagram
              </label>
              <input
                type="url"
                name="socialMedia.instagram"
                value={formData.socialMedia.instagram}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="https://instagram.com/tutienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                TikTok
              </label>
              <input
                type="url"
                name="socialMedia.tiktok"
                value={formData.socialMedia.tiktok}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="https://tiktok.com/@tutienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                Twitter/X
              </label>
              <input
                type="url"
                name="socialMedia.twitter"
                value={formData.socialMedia.twitter}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                placeholder="https://twitter.com/tutienda"
              />
            </div>
          </div>
        </div>

        {/* Save Button - Mobile Optimized */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
