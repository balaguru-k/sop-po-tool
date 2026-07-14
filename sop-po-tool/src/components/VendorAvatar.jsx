import React from 'react';
import { Tooltip } from 'antd';

const VendorAvatar = ({ name }) => {
    if (!name) return null;

    // Extract up to 2 initials
    const getInitials = (nameStr) => {
        const parts = nameStr.trim().split(/\s+/);
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    };

    const initials = getInitials(name);

    // Generate a random-ish consistent background color based on name
    const stringToColour = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let colour = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            // Make it slightly darker/muted for readability
            const mutedValue = Math.floor(value * 0.7);
            colour += ('00' + mutedValue.toString(16)).substr(-2);
        }
        return colour;
    };

    const bgColor = stringToColour(name);

    const avatarStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        textTransform: 'uppercase',
        cursor: 'default',
        flexShrink: 0
    };

    return (
        <Tooltip title={<span style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{name}</span>}>
            <div style={avatarStyle}>
                {initials}
            </div>
        </Tooltip>
    );
};

export default VendorAvatar;
