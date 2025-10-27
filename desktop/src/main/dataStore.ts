import Store from 'electron-store';
import { ipcMain } from 'electron';

interface Lead {
  id: string;
  name: string;
  type?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: number | string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  isDictated: boolean;
}

interface StoreSchema {
  leads: Lead[];
  notes: Note[];
}

const store = new Store<StoreSchema>({
  defaults: {
    leads: [],
    notes: [],
  }
});

export function setupDataHandlers() {
  // Leads
  ipcMain.handle('get-leads', () => {
    return store.get('leads');
  });

  ipcMain.handle('save-lead', (event, lead: Lead) => {
    const leads = store.get('leads', []);
    const existingIndex = leads.findIndex(l => l.id === lead.id);
    
    if (existingIndex >= 0) {
      leads[existingIndex] = lead;
    } else {
      leads.push(lead);
    }
    
    store.set('leads', leads);
    return { success: true, leads };
  });

  ipcMain.handle('delete-lead', (event, id: string) => {
    const leads = store.get('leads', []);
    const newLeads = leads.filter(l => l.id !== id);
    store.set('leads', newLeads);
    return { success: true, leads: newLeads };
  });

  // Notes
  ipcMain.handle('get-notes', () => {
    return store.get('notes');
  });

  ipcMain.handle('save-note', (event, note: Note) => {
    const notes = store.get('notes', []);
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    
    store.set('notes', notes);
    return { success: true, notes };
  });

  ipcMain.handle('delete-note', (event, id: string) => {
    const notes = store.get('notes', []);
    const newNotes = notes.filter(n => n.id !== id);
    store.set('notes', newNotes);
    return { success: true, notes: newNotes };
  });
}
