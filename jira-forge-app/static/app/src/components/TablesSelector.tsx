import React, { useState, useEffect, useRef } from 'react';
import styles from './TablesSelector.module.css';

interface TablesSelectorProps {
  readonly tables: string[];
  readonly value: string | string[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  /** Pre-checked tables (e.g. existing access) - user can add/remove */
  readonly defaultChecked?: string[];
}

function normalizeToTableArray(value: string | string[] | undefined | null): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter((t): t is string => typeof t === 'string');
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

export function TablesSelector({
  tables,
  value,
  onChange,
  disabled,
  defaultChecked = [],
}: TablesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTables = normalizeToTableArray(value);
  const defaultCheckedSet = new Set(defaultChecked);
  const effectiveSelected = selectedTables.length > 0 ? selectedTables : Array.from(defaultCheckedSet);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTable = (tableName: string) => {
    const base = selectedTables.length > 0 ? selectedTables : effectiveSelected;
    const set = new Set(base);
    if (set.has(tableName)) {
      set.delete(tableName);
    } else {
      set.add(tableName);
    }
    onChange(Array.from(set).join(', '));
  };

  const displayValue = (selectedTables.length > 0 ? selectedTables : effectiveSelected).join(', ');

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        type="button"
        className={`${styles.trigger} ${disabled ? styles.disabled : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || tables.length === 0}
      >
        <span className={displayValue ? styles.hasValue : styles.placeholder}>
          {displayValue || 'Select tables (click to open)'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {tables.length === 0 ? (
            <p className={styles.message}>No tables available for this asset</p>
          ) : (
            <div className={styles.checkboxList}>
              {tables.map((tableName) => (
                <label key={tableName} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={(selectedTables.length > 0 ? selectedTables : effectiveSelected).includes(tableName)}
                    onChange={() => toggleTable(tableName)}
                    aria-label={`Select table ${tableName}`}
                  />
                  <span className={styles.checkbox} aria-hidden="true" />
                  <span className={styles.checkboxItemLabel}>{tableName}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
