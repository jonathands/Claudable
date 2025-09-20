import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, FileText, Trash2, CheckCircle, FolderOpen, Terminal, ChevronRight } from 'lucide-react';

interface ToolResultItemProps {
  action: 'Edited' | 'Created' | 'Read' | 'Deleted' | 'Generated' | 'Searched' | 'Executed';
  filePath: string;
  content?: string;
  timestamp?: string;
}

const ToolResultItem: React.FC<ToolResultItemProps> = ({ action, filePath, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getIcon = () => {
    switch (action) {
      case 'Edited':
      case 'Created':
        return <Edit className="shrink-0 h-4 w-4 text-muted-foreground" />;
      case 'Read':
        return <FileText className="shrink-0 h-4 w-4 text-muted-foreground" />;
      case 'Deleted':
        return <Trash2 className="shrink-0 h-4 w-4 text-muted-foreground" />;
      case 'Generated':
        return <CheckCircle className="shrink-0 h-4 w-4 text-muted-foreground" />;
      case 'Searched':
        return <FolderOpen className="shrink-0 h-4 w-4 text-muted-foreground" />;
      case 'Executed':
      default:
        return <Terminal className="shrink-0 h-4 w-4 text-muted-foreground" />;
    }
  };

  const getFileName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };

  const getDirectoryPath = (path: string) => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  };

  return (
    <div className="mb-2">
      <div 
        className="flex h-6 items-center gap-1.5 whitespace-nowrap text-base font-medium md:text-sm cursor-pointer group"
        onClick={() => content && setIsExpanded(!isExpanded)}
      >
        <div className="mb-px mr-1 flex shrink-0 items-center">
          {getIcon()}
        </div>
        <span className="flex-shrink-0 font-normal text-gray-600 dark:text-gray-400">
          {action}
        </span>
        <span 
          className="relative w-fit max-w-xs truncate rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0 text-start text-xs font-normal text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
          title={filePath}
        >
          <span className="truncate">
            {filePath}
          </span>
        </span>
        {content && (
          <ChevronRight
            className={`ml-1 w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        )}
      </div>
      
      <AnimatePresence>
        {isExpanded && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2 ml-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words">
                {content}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolResultItem;