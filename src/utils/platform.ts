
import { useEffect, useState } from 'react';

export const isPlatform = (platform: 'ios' | 'android' | 'electron' | 'web'): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  switch (platform) {
    case 'ios':
      return /iphone|ipad|ipod/.test(userAgent);
    case 'android':
      return /android/.test(userAgent);
    case 'electron':
      return /electron/.test(userAgent);
    case 'web':
      return !(/iphone|ipad|ipod/.test(userAgent)) && 
             !(/android/.test(userAgent)) && 
             !(/electron/.test(userAgent));
    default:
      return false;
  }
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isPlatform('ios') || isPlatform('android'));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return isMobile;
};
