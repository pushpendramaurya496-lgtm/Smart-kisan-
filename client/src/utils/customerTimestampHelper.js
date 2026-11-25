/**
 * customerTimestampHelper.js
 * Utility to reliably extract arrival timestamps and format arrival times
 * for customers across all screens (TotalCustomerDashboard, PickupDelivery, PendingBalance).
 */

export const getCustomerTimestamp = (c) => {
  if (!c) return 0;

  // 1. If explicit orderIndex is a valid numeric timestamp > 1000000000 (valid epoch)
  if (typeof c.orderIndex === 'number' && c.orderIndex > 1000000000) {
    return c.orderIndex;
  }

  // 2. Check ISO strings: createdAt, lastVisitDate, updatedAt, dateIso, firstCreatedAt
  const isoCandidates = [c.createdAt, c.lastVisitDate, c.firstCreatedAt, c.updatedAt, c.dateIso];
  for (const iso of isoCandidates) {
    if (iso && typeof iso === 'string') {
      const t = new Date(iso).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }

  // 3. Check customer ID if it contains timestamp (e.g. 'cust_1732514000000' or 'entry_1732514000000')
  const strId = String(c.id || c._id || c.customerId || '');
  const idMatch = strId.match(/(\d{12,14})/);
  if (idMatch) {
    const ts = Number(idMatch[1]);
    if (!isNaN(ts) && ts > 1000000000000) return ts;
  }

  // 4. Check MongoDB 24-hex ObjectId (first 8 hex chars = unix seconds)
  if (/^[0-9a-fA-F]{24}$/.test(strId)) {
    const sec = parseInt(strId.substring(0, 8), 16);
    if (!isNaN(sec) && sec > 1000000000) return sec * 1000;
  }

  // 5. Check history entries
  if (Array.isArray(c.history) && c.history.length > 0) {
    for (const h of c.history) {
      if (h?.createdAt) {
        const t = new Date(h.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (h?.id) {
        const hMatch = String(h.id).match(/(\d{12,14})/);
        if (hMatch) {
          const ts = Number(hMatch[1]);
          if (!isNaN(ts) && ts > 1000000000000) return ts;
        }
      }
    }
  }

  // 6. Parse date string (DD-MM-YYYY or DD/MM/YYYY)
  const dateStr = c.date || (c.history && c.history[0]?.date);
  if (typeof dateStr === 'string' && (dateStr.includes('-') || dateStr.includes('/'))) {
    const delimiter = dateStr.includes('-') ? '-' : '/';
    const parts = dateStr.trim().split(delimiter);
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      let y, m, d;
      if (p0 > 1000) {
        y = p0;
        m = p1 - 1;
        d = p2;
      } else {
        d = p0;
        m = p1 - 1;
        y = p2;
      }

      let hr = 8;
      let min = 0;
      const timeStr = c.time || c.timeStr || (c.history && c.history[0]?.time);
      if (typeof timeStr === 'string') {
        const tm = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
        if (tm) {
          hr = parseInt(tm[1], 10);
          min = parseInt(tm[2], 10);
          const isPm = tm[3] && tm[3].toLowerCase() === 'pm';
          const isAm = tm[3] && tm[3].toLowerCase() === 'am';
          if (isPm && hr < 12) hr += 12;
          if (isAm && hr === 12) hr = 0;
        }
      }

      const t = new Date(y, m, d, hr, min).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }

  return 0;
};

/**
 * Format a human-readable arrival time string (e.g. "10:36 am" or "09:15 am" or "आज")
 */
export const formatArrivalTime = (c) => {
  if (!c) return '';
  if (c.timeStr && typeof c.timeStr === 'string' && c.timeStr.trim() !== 'आज') {
    return c.timeStr.trim();
  }
  if (c.time && typeof c.time === 'string') {
    return c.time.trim();
  }
  const ts = getCustomerTimestamp(c);
  if (ts > 0) {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    } catch (e) {
      return '';
    }
  }
  return c.dateLabel || c.date || '';
};

