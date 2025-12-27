import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export const Card = ({ className, children, ...props }) => {
    return (
        <div className={clsx(styles.card, className)} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ className, children, ...props }) => {
    return (
        <div className={clsx(styles.header, className)} {...props}>
            {children}
        </div>
    );
};

export const CardTitle = ({ className, children, ...props }) => {
    return (
        <h3 className={clsx(styles.title, className)} {...props}>
            {children}
        </h3>
    );
};

export const CardContent = ({ className, children, ...props }) => {
    return (
        <div className={clsx(styles.content, className)} {...props}>
            {children}
        </div>
    );
};

export const CardFooter = ({ className, children, ...props }) => {
    return (
        <div className={clsx(styles.footer, className)} {...props}>
            {children}
        </div>
    );
};
