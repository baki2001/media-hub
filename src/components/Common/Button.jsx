import React from 'react'
import styles from './Button.module.css'
import clsx from 'clsx'

/**
 * Unified Button component for consistent styling across the app
 * 
 * @param {object} props
 * @param {'primary' | 'ghost' | 'danger'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading = false,
    disabled = false,
    className,
    ...props
}) => {
    return (
        <button
            className={clsx(
                styles.button,
                styles[variant],
                styles[size],
                loading && styles.loading,
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className={styles.spinner} />
            ) : (
                <>
                    {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
                    {children && <span>{children}</span>}
                </>
            )}
        </button>
    )
}

export default Button
