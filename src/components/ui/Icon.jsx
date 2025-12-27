import React from 'react';
import clsx from 'clsx';
// No specific styles needed usually, but we can enforce some defaults if desired.

const Icon = ({ icon: IconComponent, size = 20, className, ...props }) => {
    if (!IconComponent) return null;

    return (
        <IconComponent
            size={size}
            className={clsx(className)}
            {...props}
        />
    );
};

export default Icon;
