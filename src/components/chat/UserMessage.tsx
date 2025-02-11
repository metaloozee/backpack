import * as React from 'react';
import { CollapsibleMessage } from '@/components/chat/CollapsibleMessage';

export const UserMessage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <CollapsibleMessage role="user">
            <div className="flex-1 break-words w-full">{message}</div>
        </CollapsibleMessage>
    );
};
