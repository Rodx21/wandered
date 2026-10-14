const PT_MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatVisitDate(isoDate: string, language: string): string {
  const d = new Date(isoDate);
  const m = d.getMonth();
  const y = d.getFullYear();
  if (language === 'pt') return `${PT_MONTHS[m]} de ${y}`;
  return `${EN_MONTHS[m]} ${y}`;
}
