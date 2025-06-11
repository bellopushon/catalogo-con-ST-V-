export function applyTheme(theme: any) {
  if (!theme) return;

  const root = document.documentElement;

  // Aplicar colores primarios
  if (theme.primary_color) {
    root.style.setProperty('--primary-color', theme.primary_color);
  }

  // Aplicar colores secundarios
  if (theme.secondary_color) {
    root.style.setProperty('--secondary-color', theme.secondary_color);
  }

  // Aplicar colores de fondo
  if (theme.background_color) {
    root.style.setProperty('--background-color', theme.background_color);
  }

  // Aplicar colores de texto
  if (theme.text_color) {
    root.style.setProperty('--text-color', theme.text_color);
  }

  // Aplicar fuentes
  if (theme.font_family) {
    root.style.setProperty('--font-family', theme.font_family);
  }

  // Aplicar otros estilos personalizados
  if (theme.custom_styles) {
    Object.entries(theme.custom_styles).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value as string);
    });
  }
} 