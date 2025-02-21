/**
 * Removes <contemplate> tags and their content from a message string
 */
export function removeContemplateContent(message: string): string {
    return message.replace(/<contemplate>[\s\S]*?<\/contemplate>/g, '');
}
