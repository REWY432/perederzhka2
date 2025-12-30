import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dog, Clock } from 'lucide-react';
import { Booking, DogSize, DogProfile } from '../../types';
import { cn } from '../../utils/helpers';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectDog?: (profile: DogProfile) => void;
  bookings: Booking[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onSelectDog,
  bookings,
  placeholder,
  label,
  icon,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Build unique dog profiles from booking history
  const dogProfiles = useMemo(() => {
    const profiles = new Map<string, DogProfile>();
    
    bookings.forEach(b => {
      const key = b.dogName.toLowerCase().trim();
      const existing = profiles.get(key);
      
      if (existing) {
        existing.totalVisits += 1;
        existing.totalSpent += b.pricePerDay;
        if (!existing.lastVisit || b.checkOut > existing.lastVisit) {
          existing.lastVisit = b.checkOut;
        }
        // Merge tags
        b.tags?.forEach(tag => {
          if (!existing.tags.includes(tag)) {
            existing.tags.push(tag);
          }
        });
      } else {
        profiles.set(key, {
          name: b.dogName,
          breed: b.breed,
          size: b.size,
          tags: b.tags || [],
          totalVisits: 1,
          totalSpent: b.pricePerDay,
          lastVisit: b.checkOut
        });
      }
    });

    return Array.from(profiles.values())
      .sort((a, b) => b.totalVisits - a.totalVisits);
  }, [bookings]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!value.trim()) {
      // Show recent dogs when empty
      return dogProfiles.slice(0, 5);
    }
    
    const query = value.toLowerCase();
    return dogProfiles
      .filter(d => d.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value, dogProfiles]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && suggestions[focusedIndex]) {
          handleSelect(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSelect = (profile: DogProfile) => {
    onChange(profile.name);
    onSelectDog?.(profile);
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setIsOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 pr-4 text-slate-900 dark:text-white font-medium',
            'placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all',
            icon ? 'pl-12' : 'pl-4'
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="autocomplete-list"
        />
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.ul
            id="autocomplete-list"
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-72 overflow-y-auto"
            role="listbox"
          >
            {!value.trim() && (
              <li className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Clock size={12} />
                Недавние клиенты
              </li>
            )}
            
            {suggestions.map((profile, index) => (
              <li
                key={profile.name}
                role="option"
                aria-selected={focusedIndex === index}
                onClick={() => handleSelect(profile)}
                className={cn(
                  'px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors',
                  focusedIndex === index
                    ? 'bg-orange-50 dark:bg-orange-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {profile.name[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {profile.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {profile.breed} • {profile.totalVisits} визитов
                  </p>
                </div>

                {/* VIP Badge */}
                {profile.totalVisits >= 3 && (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">
                    VIP
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Autocomplete;
