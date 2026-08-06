function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

interface IcsEvent {
  uid: string;
  title: string;
  description: string;
  date: Date;
}

export function buildIcs(events: IcsEvent[]): string {
  const now = formatIcsDate(new Date());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CertChecker//Expiry Reminder//EN'];

  for (const event of events) {
    const start = formatIcsDate(event.date);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${start.slice(0, 8)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
