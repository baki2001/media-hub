import React from 'react';
import clsx from 'clsx';
import styles from './Skeleton.module.css';

const Skeleton = ({ className, width, height, circle, ...props }) => {
    return (
        <div
            className={clsx(
                styles.skeleton,
                circle && styles.circle,
                className
            )}
            style={{
                width: width,
                height: height
            }}
            {...props}
        />
    );
};

export default Skeleton;
