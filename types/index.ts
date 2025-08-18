export interface Note {
  id: string;
  text: string;
  listName: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  reminderDate?: Date;
  reminderExpired?: boolean;
}

export interface ListData {
  name: string;
  count: number;
  color: string;
  archived?: boolean;
}

export const DEFAULT_LISTS: ListData[] = [
  { name: 'Personal', count: 0, color: '#14B8A6' },
  { name: 'Work', count: 0, color: '#DC2626' },
  { name: 'Project A', count: 0, color: '#10B981' },
  { name: 'Project B', count: 0, color: '#CA8A04' },
];