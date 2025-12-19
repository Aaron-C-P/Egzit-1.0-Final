import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  scheduledFor: Date;
  type: 'checklist' | 'essential' | 'moving-day' | 'custom';
}

// Default moving day reminders
const MOVING_DAY_REMINDERS = [
  { daysBefore: 7, title: '1 Week Until Moving Day!', body: 'Start packing non-essentials. Have you booked your mover?' },
  { daysBefore: 3, title: '3 Days Until Moving Day!', body: 'Pack your essentials bag: documents, medications, phone chargers, toiletries.' },
  { daysBefore: 1, title: 'Tomorrow is Moving Day!', body: 'Confirm with movers, pack a snack bag, charge all devices. Don\'t forget your pets!' },
  { daysBefore: 0, title: 'Moving Day is Here! 🚚', body: 'Good luck! Remember: essentials bag with you, check all rooms before leaving.' },
];

const ESSENTIAL_REMINDERS = [
  { title: '🐾 Don\'t Forget Your Pets!', body: 'Make arrangements for pet transport and comfort items.' },
  { title: '💊 Pack Medications', body: 'Keep prescription medications in your essentials bag, not with movers.' },
  { title: '📄 Important Documents', body: 'Gather IDs, passports, lease/deed, medical records in a secure folder.' },
  { title: '🔑 Keys & Remotes', body: 'Collect all keys, garage remotes, and security codes for both homes.' },
  { title: '📱 Charge Devices', body: 'Fully charge phones, tablets, and power banks the night before.' },
  { title: '🧸 Kids\' Comfort Items', body: 'Pack favorite toys, blankets, and snacks accessible during the move.' },
];

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions): Notification | null => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/egzit-icon.png',
        badge: '/egzit-icon.png',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const scheduleRemindersForMoveDate = useCallback(async (moveDate: Date, moveName: string) => {
    if (!isSupported || permission !== 'granted') return;

    const reminders: ScheduledReminder[] = [];
    const now = new Date();

    // Schedule moving day reminders
    MOVING_DAY_REMINDERS.forEach((reminder, index) => {
      const reminderDate = new Date(moveDate);
      reminderDate.setDate(reminderDate.getDate() - reminder.daysBefore);
      reminderDate.setHours(9, 0, 0, 0); // 9 AM

      if (reminderDate > now) {
        reminders.push({
          id: `move-${index}`,
          title: reminder.title,
          body: `${moveName}: ${reminder.body}`,
          scheduledFor: reminderDate,
          type: 'moving-day',
        });
      }
    });

    // Store reminders in localStorage for the service worker
    const existingReminders = JSON.parse(localStorage.getItem('egzit-reminders') || '[]');
    const newReminders = [...existingReminders, ...reminders];
    localStorage.setItem('egzit-reminders', JSON.stringify(newReminders));

    // Send immediate confirmation
    sendNotification('Reminders Set! 🔔', {
      body: `You'll receive ${reminders.length} reminders before your move on ${moveDate.toLocaleDateString()}`,
      tag: 'reminders-set',
    });

    return reminders;
  }, [isSupported, permission, sendNotification]);

  const sendEssentialReminder = useCallback((index?: number) => {
    const reminderIndex = index ?? Math.floor(Math.random() * ESSENTIAL_REMINDERS.length);
    const reminder = ESSENTIAL_REMINDERS[reminderIndex];
    
    return sendNotification(reminder.title, {
      body: reminder.body,
      tag: `essential-${reminderIndex}`,
    });
  }, [sendNotification]);

  const checkScheduledReminders = useCallback(() => {
    const reminders: ScheduledReminder[] = JSON.parse(localStorage.getItem('egzit-reminders') || '[]');
    const now = new Date();
    const pendingReminders: ScheduledReminder[] = [];

    reminders.forEach((reminder) => {
      const scheduledTime = new Date(reminder.scheduledFor);
      if (scheduledTime <= now) {
        sendNotification(reminder.title, {
          body: reminder.body,
          tag: reminder.id,
        });
      } else {
        pendingReminders.push(reminder);
      }
    });

    // Update localStorage with pending reminders
    localStorage.setItem('egzit-reminders', JSON.stringify(pendingReminders));
  }, [sendNotification]);

  // Check for scheduled reminders on mount and periodically
  useEffect(() => {
    if (permission === 'granted') {
      checkScheduledReminders();
      const interval = setInterval(checkScheduledReminders, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [permission, checkScheduledReminders]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendEssentialReminder,
    scheduleRemindersForMoveDate,
    ESSENTIAL_REMINDERS,
    MOVING_DAY_REMINDERS,
  };
}
