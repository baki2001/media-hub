import React from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import styles from './Input.module.css';

export const Input = React.forwardRef(({ className, error, ...props }, ref) => {
    return (
        <div className={styles.wrapper}>
            <input
                ref={ref}
                className={clsx(
                    styles.input,
                    error && styles.error,
                    className
                )}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
});

Input.displayName = 'Input';

export const SearchInput = React.forwardRef(({ className, wrapperClassName, ...props }, ref) => {
    return (
        <div className={clsx(styles.searchWrapper, wrapperClassName)}>
            <Search className={styles.searchIcon} size={18} />
            <input
                ref={ref}
                className={clsx(styles.input, styles.hasIcon, className)}
                {...props}
            />
        </div>
    );
});

SearchInput.displayName = 'SearchInput';
