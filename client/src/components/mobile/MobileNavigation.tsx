import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Home, MessageSquare, Bell, Search, PlusCircle, User, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { navigateWithoutReload } from '@/App';
import { useNostr } from '@/hooks/useNostr';
import { useScrollPosition } from '@/hooks/useScrollPosition';

/**
 * Modern bottom navigation bar optimized for mobile devices and PWA
 * Includes auto-hide on scroll functionality and center floating navigation buttons
 */
const MobileNavigation: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { identity } = useNostr();
  const { direction, isScrolling, isAtTop, y } = useScrollPosition();
  const [isVisible, setIsVisible] = useState(true);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  
  // Обработка видимости навигации на основе скролла
  useEffect(() => {
    // Показываем навигацию когда скролл вверху страницы
    if (isAtTop) {
      setIsVisible(true);
      setShowScrollButtons(false);
      return;
    }

    // Показываем кнопки скролла при скроллинге
    if (isScrolling) {
      setShowScrollButtons(true);
      
      // Запланировать скрытие кнопок после остановки скроллинга
      const timeout = setTimeout(() => {
        setShowScrollButtons(false);
      }, 3000); // Увеличили время видимости до 3 секунд
      
      return () => clearTimeout(timeout);
    }
    
    // Скрываем навигацию при скролле вниз, показываем при скролле вверх
    if (direction === 'down' && y > 50) { // Уменьшили порог до 50px для более быстрой реакции
      setIsVisible(false);
    } else if (direction === 'up') {
      setIsVisible(true);
    }
  }, [direction, isScrolling, isAtTop, y]);
  
  // Делаем кнопки скролла всегда видимыми если страница длинная
  useEffect(() => {
    const checkPageHeight = () => {
      const pageHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      
      // Если страница имеет длинный контент, показываем кнопки всегда
      if (pageHeight > viewportHeight * 2) {
        setShowScrollButtons(true);
      }
    };
    
    // Проверяем при монтировании компонента
    checkPageHeight();
    
    // И при изменении размера окна
    window.addEventListener('resize', checkPageHeight);
    
    return () => {
      window.removeEventListener('resize', checkPageHeight);
    };
  }, []);
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  const handleCreate = () => {
    // Find and trigger the create thread button
    const createThreadBtn = document.querySelector('[aria-label="Create New Thread"]') as HTMLButtonElement;
    if (createThreadBtn) {
      createThreadBtn.click();
    } else {
      // Fallback - we should navigate to a board where thread creation is possible
      navigateWithoutReload('/board/b');
    }
  };
  
  const scrollToTop = () => {
    // Используем более плавную анимацию с промежуточными остановками для длинных страниц
    const currentPosition = window.scrollY;
    
    // Если страница очень длинная, делаем промежуточную остановку
    if (currentPosition > 10000) {
      // Анимированный скролл с промежуточной остановкой
      const halfwayPoint = currentPosition / 2;
      
      window.scrollTo({
        top: halfwayPoint,
        behavior: 'smooth',
      });
      
      // После первой анимации - продолжаем до верха
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 700);
    } else {
      // Стандартный скролл для коротких страниц
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
    
    // Показываем навигационную панель после скролла
    setIsVisible(true);
  };
  
  const scrollToBottom = () => {
    const currentPosition = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    
    // Если страница очень длинная, делаем промежуточную остановку
    if (maxScroll - currentPosition > 10000) {
      // Анимированный скролл с промежуточной остановкой
      const halfwayPoint = currentPosition + (maxScroll - currentPosition) / 2;
      
      window.scrollTo({
        top: halfwayPoint,
        behavior: 'smooth',
      });
      
      // После первой анимации - продолжаем до конца
      setTimeout(() => {
        window.scrollTo({
          top: maxScroll,
          behavior: 'smooth',
        });
      }, 700);
    } else {
      // Стандартный скролл для коротких страниц
      window.scrollTo({
        top: maxScroll, 
        behavior: 'smooth',
      });
    }
    
    // Скрываем навигационную панель после скролла вниз
    setTimeout(() => {
      setIsVisible(false);
    }, 1000);
  };
  
  return (
    <>
      {/* Main bottom navigation bar with auto hide */}
      <nav className={`fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-950/80 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-around px-2 z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <NavButton 
          icon={<Home size={20} strokeWidth={1.75} />} 
          label="Home" 
          active={isActive('/')}
          onClick={() => navigateWithoutReload('/')}
        />
        
        <NavButton 
          icon={<MessageSquare size={20} strokeWidth={1.75} />} 
          label="Threads" 
          active={isActive('/board')}
          onClick={() => navigateWithoutReload('/board/all')}
        />
        
        <NavButton 
          icon={<PlusCircle size={24} strokeWidth={1.5} />} 
          label="Create" 
          active={false}
          onClick={handleCreate}
          primary
        />
        
        <NavButton 
          icon={<Bell size={20} strokeWidth={1.75} />} 
          label="Subs" 
          active={isActive('/subscriptions')}
          onClick={() => navigateWithoutReload('/subscriptions')}
        />
        
        <NavButton 
          icon={<User size={20} strokeWidth={1.75} />} 
          label="Me" 
          active={isActive('/user')}
          onClick={() => identity?.pubkey 
            ? navigateWithoutReload(`/user/${identity.pubkey}`) 
            : navigateWithoutReload('/profile')
          }
        />
      </nav>
      
      {/* Плавающие кнопки прокрутки (появляются при скроллинге) */}
      <div className={`fixed inset-x-0 bottom-1/2 flex justify-center items-center gap-6 z-40 transition-all duration-300 pointer-events-none ${showScrollButtons ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <button 
          onClick={scrollToTop}
          className="w-14 h-14 rounded-full bg-primary dark:bg-primary/90 text-white shadow-xl flex items-center justify-center pointer-events-auto active:scale-95 transition-transform animation-bounce"
          aria-label="Прокрутить вверх"
        >
          <ChevronUp size={28} strokeWidth={2} />
        </button>
        
        <button 
          onClick={scrollToBottom}
          className="w-14 h-14 rounded-full bg-primary dark:bg-primary/90 text-white shadow-xl flex items-center justify-center pointer-events-auto active:scale-95 transition-transform animation-bounce"
          aria-label="Прокрутить вниз"
        >
          <ChevronDown size={28} strokeWidth={2} />
        </button>
      </div>
      
      {/* Кнопка быстрой навигации, всегда видимая, перекрывающая нижнюю панель навигации */}
      <div className={`fixed right-4 bottom-20 z-[51] transition-all duration-300 ${!isVisible ? 'translate-y-12' : ''}`}>
        <button 
          onClick={() => isAtTop ? scrollToBottom() : scrollToTop()}
          className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center transform transition-transform active:scale-95"
          aria-label={isAtTop ? "Прокрутить вниз" : "Прокрутить вверх"}
        >
          {isAtTop ? (
            <ChevronDown size={24} className="text-white" />
          ) : (
            <ChevronUp size={24} className="text-white" />
          )}
        </button>
      </div>
    </>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  primary?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  active, 
  onClick,
  primary = false
}) => {
  return (
    <button
      className={`flex flex-col items-center justify-center w-16 py-1 relative transition-all ${
        primary 
          ? 'text-primary dark:text-primary' 
          : active 
            ? 'text-gray-900 dark:text-white' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      onClick={onClick}
    >
      {primary && (
        <div className="absolute inset-x-3 top-0 bottom-4 bg-primary/10 dark:bg-primary/20 rounded-full -z-10"></div>
      )}
      <div className={`${primary ? 'text-primary dark:text-primary transform -translate-y-1.5' : ''} transition-transform`}>
        {icon}
      </div>
      <span className={`text-[10px] mt-1 font-medium transition-opacity ${primary ? 'opacity-90' : active ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
      {active && !primary && (
        <div className="absolute bottom-0.5 h-1 w-1 bg-primary rounded-full" />
      )}
    </button>
  );
};

export default MobileNavigation;