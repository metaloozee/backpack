import { GlobeIcon, BookCopyIcon, GraduationCapIcon, LandmarkIcon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type Tool = {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    enabled: boolean;
};

export type ToolsState = {
    [key: string]: boolean;
};

export const defaultTools: Tool[] = [
    {
        id: 'webSearch',
        name: 'Web Search',
        description: 'Search the web for real-time information',
        icon: GlobeIcon,
        enabled: false,
    },
    {
        id: 'knowledgeSearch',
        name: 'Knowledge Search',
        description: 'Search through your knowledge base',
        icon: BookCopyIcon,
        enabled: false,
    },
    {
        id: 'academicSearch',
        name: 'Academic Search',
        description: 'Search academic papers and research',
        icon: GraduationCapIcon,
        enabled: false,
    },
    {
        id: 'financeSearch',
        name: 'Finance Search',
        description: 'Search financial data and information',
        icon: LandmarkIcon,
        enabled: false,
    },
];

export const getDefaultToolsState = (): ToolsState => {
    return defaultTools.reduce((acc, tool) => {
        acc[tool.id] = tool.enabled;
        return acc;
    }, {} as ToolsState);
};

export const getToolById = (toolId: string): Tool | undefined => {
    return defaultTools.find((tool) => tool.id === toolId);
};
