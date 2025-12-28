import React from 'react'
import clsx from 'clsx'
import styles from './Toggle.module.css'

export const Toggle = ({ checked, onChange, disabled, className }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            onClick={() => !disabled && onChange && onChange(!checked)}
            className={clsx(styles.toggle, { [styles.checked]: checked, [styles.disabled]: disabled }, className)}
        >
            <span className={styles.thumb} />
        </button>
    )
}

export default Toggle
