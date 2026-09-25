import { useState, useEffect } from 'react';

export function useSavedMedia() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Load saved IDs on initial mount
  useEffect(() => {
    const stored = localStorage.getItem('saved_event_media');
    if (stored) {
      setSavedIds(JSON.parse(stored));
    }
  }, []);

  // Toggle save status
  const toggleSave = (id: string) => {
    let updatedIds;
    if (savedIds.includes(id)) {
      updatedIds = savedIds.filter(savedId => savedId !== id); // Remove
    } else {
      updatedIds = [...savedIds, id]; // Add
    }
    
    setSavedIds(updatedIds);
    localStorage.setItem('saved_event_media', JSON.stringify(updatedIds));
  };

  return { savedIds, toggleSave };
}