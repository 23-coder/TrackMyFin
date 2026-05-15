import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} - TrackMyFin`;
    
    // Cleanup function to restore previous title if needed
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle;