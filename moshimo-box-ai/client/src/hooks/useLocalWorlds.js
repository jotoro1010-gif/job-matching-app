import { useState, useEffect } from 'react';

const KEY = 'moshimo_box_worlds';

export default function useLocalWorlds() {
  const [worlds, setWorlds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(worlds));
  }, [worlds]);

  const save = (world) => {
    setWorlds((prev) => (prev.some((w) => w.id === world.id) ? prev : [world, ...prev]));
  };

  const remove = (id) => {
    setWorlds((prev) => prev.filter((w) => w.id !== id));
  };

  return { worlds, save, remove };
}
