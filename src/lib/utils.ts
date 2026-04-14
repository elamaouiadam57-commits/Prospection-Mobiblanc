import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateSafe(dateStr: string | undefined, formatStr: string): string {
  if (!dateStr) return '-';
  try {
    let d: Date;
    if (!dateStr.includes('T') && dateStr.includes('-')) {
      const [y, m, day] = dateStr.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(dateStr);
    }
    
    if (isNaN(d.getTime())) return '-';
    return format(d, formatStr);
  } catch {
    return '-';
  }
}

export function getStatusOptions(leads: { status: string }[]): string[] {
  // Exact list from the user's Airtable screenshot
  const defaults = [
    'Nouveau', 
    'Contacté', 
    'Interested', 
    'Not qualified', 
    'Not available'
  ];
  
  const fromLeads = Array.from(new Set(leads.map(l => l.status))).filter(Boolean);
  
  // We only show the defaults + any other status that is actually present in the data
  // This keeps the list clean and perfectly synced with Airtable usage
  const all = [...defaults];
  fromLeads.forEach(s => {
    if (!all.includes(s)) {
      all.push(s);
    }
  });
  
  return all;
}
