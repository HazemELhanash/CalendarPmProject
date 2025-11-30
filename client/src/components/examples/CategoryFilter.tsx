import CategoryFilter from '../CategoryFilter';
import { useState } from 'react';

export default function CategoryFilterExample() {
  const [categories, setCategories] = useState([
    { name: 'Meeting', color: '#3b82f6', active: true },
    { name: 'Booking', color: '#10b981', active: true },
    { name: 'Deadline', color: '#ef4444', active: false },
    { name: 'Focus Time', color: '#8b5cf6', active: true },
  ]);
  
  const handleToggle = (categoryName: string) => {
    setCategories(prev => prev.map(cat =>
      cat.name === categoryName ? { ...cat, active: !cat.active } : cat
    ));
  };
  
  return (
    <CategoryFilter
      categories={categories}
      onToggle={handleToggle}
    />
  );
}
