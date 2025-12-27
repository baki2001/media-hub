import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './Dropdown.module.css';

export const Dropdown = ({ trigger, children, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={styles.container} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className={styles.trigger}>
                {trigger}
            </div>

            {isOpen && (
                <div className={clsx(styles.menu, styles[align])}>
                    {React.Children.map(children, child => {
                        // Pass toggle function to items so they can close the menu
                        return React.cloneElement(child, {
                            onClick: (e) => {
                                if (child.props.onClick) child.props.onClick(e);
                                setIsOpen(false);
                            }
                        });
                    })}
                </div>
            )}
        </div>
    );
};

export const DropdownItem = ({ children, icon, onClick, className, variant = 'default' }) => {
    return (
        <button
            className={clsx(styles.item, styles[variant], className)}
            onClick={onClick}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </button>
    );
};
