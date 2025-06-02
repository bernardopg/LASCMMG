import { useState, useRef } from 'react'; // Added useRef
import { Bell, BellRing } from 'lucide-react'; // Using Lucide icons
import { useNotification } from '../../context/NotificationContext';
import NotificationItem from './notifications/NotificationItem'; // Import NotificationItem

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref for the dropdown panel
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotification();

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 text-lime-400 hover:text-amber-400 focus:outline-none transition-colors duration-200"
        onClick={toggleNotifications}
        aria-label="Notificações"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-5 w-5" />
            <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[0.6rem] font-bold leading-none text-white bg-red-500 rounded-full ring-2 ring-green-800/50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-green-900/80 backdrop-blur-lg border border-green-700/60 rounded-xl shadow-2xl overflow-hidden z-dropdown max-h-[70vh] flex flex-col"
          role="menu"
        >
          <div className="py-2.5 px-4 bg-green-800/50 flex justify-between items-center border-b border-green-700/50 sticky top-0 z-10">
            <h3 className="text-sm font-semibold text-neutral-100" id="notifications-heading">
              Notificações
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  clearNotifications();
                  setIsOpen(false); // Optionally close after clearing
                }}
                className="text-xs text-neutral-300 hover:text-red-400 transition-colors duration-150 font-medium"
              >
                Limpar Todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-grow custom-scrollbar">
            {' '}
            {/* Added custom-scrollbar */}
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <NotificationItem
                  key={`${notification.id || notification.timestamp}-${index}`} // Use notification.id if available
                  notification={notification}
                />
              ))
            ) : (
              <div className="p-6 text-sm text-center text-neutral-400">
                Nenhuma notificação recente.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
