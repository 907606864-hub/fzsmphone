/**
 * SVG icon paths for all app icons (24x24 viewBox, stroke-based)
 * Each value is the inner SVG content to render inside:
 * <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
 */
export const appIcons: Record<string, string> = {
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  weibo: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M8 12l3 3 5-6"/>',
  qzone: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.66V19a5 5 0 0 1 10 0v1.66"/>',
  takeaway: '<circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M8 19h7M5 17V7h6l4 5h3v5"/><line x1="7" y1="12" x2="11" y2="12"/>',
  shopping: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  live: '<path d="M5.6 4.4a9 9 0 0 0 0 15.2M18.4 4.4a9 9 0 0 1 0 15.2M8.1 7.1a5 5 0 0 0 0 9.8M15.9 7.1a5 5 0 0 1 0 9.8"/><circle cx="12" cy="12" r="1"/>',
  diary: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/>',
  games: '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="13" r=".5" fill="currentColor"/><circle cx="18" cy="11" r=".5" fill="currentColor"/><path d="M17.3 5H6.7a4 4 0 0 0-3.9 3.1L2 12.5a2.5 2.5 0 0 0 4 2.3l1-1.3h10l1 1.3a2.5 2.5 0 0 0 4-2.3l-.8-4.4A4 4 0 0 0 17.3 5z"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><circle cx="18" cy="13" r="1" fill="currentColor"/>',
  theater: '<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>',
  stock: '<path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-6"/>',
  currency: '<path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/>',
  couple: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  characters: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  personas: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  worldbook: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  preset: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  admin: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>',
  sms: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>',
  profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  zhihu: '<path d="M5 3h6v6H5z"/><path d="M8 9v8"/><path d="M5 13h6"/><path d="M14 4l3 8h-6l3-8z"/><path d="M13 12l-1 9h5l-1-9"/>',
  xiaohongshu: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/>',
  douyin: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
  email: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  browser: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  map: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  discord: '<path d="M20.3 4.7a18.8 18.8 0 0 0-4.6-1.4 13 13 0 0 0-.6 1.2 17.4 17.4 0 0 0-5.2 0A11 11 0 0 0 9.3 3.3a18.8 18.8 0 0 0-4.6 1.4A19.5 19.5 0 0 0 1.3 18a19 19 0 0 0 5.8 2.9 14 14 0 0 0 1.2-2 12 12 0 0 1-1.9-.9l.5-.4a13.5 13.5 0 0 0 11.6 0l.5.4a12 12 0 0 1-1.9.9 14 14 0 0 0 1.2 2 18.9 18.9 0 0 0 5.7-2.9A19.5 19.5 0 0 0 20.3 4.7zM8.5 15.3a2.2 2.2 0 0 1-2-2.3 2.2 2.2 0 0 1 2-2.3 2.2 2.2 0 0 1 2 2.3 2.2 2.2 0 0 1-2 2.3zm6 0a2.2 2.2 0 0 1-2-2.3 2.2 2.2 0 0 1 2-2.3 2.2 2.2 0 0 1 2 2.3 2.2 2.2 0 0 1-2 2.3z"/>',
}

