export const formatDate = (date: string | number | Date): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}; 