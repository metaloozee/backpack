import * as React from 'react';

export const UserMessage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className="flex w-full py-4">
            <div className="flex-1 break-words w-full">{message}</div>
        </div>
    );
};
