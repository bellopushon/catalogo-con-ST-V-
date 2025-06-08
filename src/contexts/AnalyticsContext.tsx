import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface AnalyticsEvent {
  id: string;
  type: 'visit' | 'order' | 'product_view';
  storeId: string;
  timestamp: string;
  data?: {
    productId?: string;
    orderValue?: number;
    customerName?: string;
    items?: any[];
    sessionId?: string;
  };
}

export interface AnalyticsState {
  events: AnalyticsEvent[];
  isLoaded: boolean;
}

type AnalyticsAction =
  | { type: 'SET_EVENTS'; payload: AnalyticsEvent[] }
  | { type: 'ADD_EVENT'; payload: AnalyticsEvent }
  | { type: 'CLEANUP_OLD_EVENTS' }
  | { type: 'SET_LOADED'; payload: boolean };

const initialState: AnalyticsState = {
  events: [],
  isLoaded: false,
};

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'CLEANUP_OLD_EVENTS':
      // Keep only events from the last 90 days to prevent storage overflow
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const filteredEvents = state.events.filter(event => 
        new Date(event.timestamp) > ninetyDaysAgo
      );
      return { ...state, events: filteredEvents };
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload };
    default:
      return state;
  }
}

const AnalyticsContext = createContext<{
  state: AnalyticsState;
  dispatch: React.Dispatch<AnalyticsAction>;
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void;
  trackVisit: (storeId: string) => void;
  getVisits: (storeId: string, dateRange?: { start: Date; end: Date }) => number;
  getOrders: (storeId: string, dateRange?: { start: Date; end: Date }) => number;
  getOrderValue: (storeId: string, dateRange?: { start: Date; end: Date }) => number;
} | null>(null);

const SESSION_STORAGE_KEY = 'tutaviendo_session';
const VISIT_TRACKING_KEY = 'tutaviendo_visits_tracked';

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

// Track visits per store per day to avoid duplicates
function getVisitTrackingKey(storeId: string): string {
  const today = new Date().toDateString();
  return `${storeId}_${today}`;
}

function hasVisitBeenTracked(storeId: string): boolean {
  const trackingKey = getVisitTrackingKey(storeId);
  const trackedVisits = JSON.parse(sessionStorage.getItem(VISIT_TRACKING_KEY) || '{}');
  return trackedVisits[trackingKey] === true;
}

function markVisitAsTracked(storeId: string): void {
  const trackingKey = getVisitTrackingKey(storeId);
  const trackedVisits = JSON.parse(sessionStorage.getItem(VISIT_TRACKING_KEY) || '{}');
  trackedVisits[trackingKey] = true;
  
  // Clean up old tracking data (keep only last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  Object.keys(trackedVisits).forEach(key => {
    const [, dateStr] = key.split('_');
    if (dateStr && new Date(dateStr) < sevenDaysAgo) {
      delete trackedVisits[key];
    }
  });
  
  sessionStorage.setItem(VISIT_TRACKING_KEY, JSON.stringify(trackedVisits));
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);

  // Initialize analytics (no localStorage dependency)
  useEffect(() => {
    dispatch({ type: 'SET_LOADED', payload: true });
  }, []);

  // Cleanup old events periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch({ type: 'CLEANUP_OLD_EVENTS' });
    }, 24 * 60 * 60 * 1000); // Clean up once per day

    return () => clearInterval(cleanupInterval);
  }, []);

  const trackEvent = (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
  };

  const trackVisit = (storeId: string) => {
    // Check if we already tracked a visit for this store today
    if (!hasVisitBeenTracked(storeId)) {
      const sessionId = getSessionId();
      
      trackEvent({
        type: 'visit',
        storeId,
        data: { sessionId }
      });
      
      // Mark this visit as tracked for today
      markVisitAsTracked(storeId);
    }
  };

  const getVisits = (storeId: string, dateRange?: { start: Date; end: Date }) => {
    let events = state.events.filter(e => e.type === 'visit' && e.storeId === storeId);
    
    if (dateRange) {
      events = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }
    
    // Count unique visits per day (one visit per day maximum)
    const uniqueDays = new Set();
    events.forEach(event => {
      const date = new Date(event.timestamp).toDateString();
      uniqueDays.add(date);
    });
    
    return uniqueDays.size;
  };

  const getOrders = (storeId: string, dateRange?: { start: Date; end: Date }) => {
    let events = state.events.filter(e => e.type === 'order' && e.storeId === storeId);
    
    if (dateRange) {
      events = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }
    
    return events.length;
  };

  const getOrderValue = (storeId: string, dateRange?: { start: Date; end: Date }) => {
    let events = state.events.filter(e => e.type === 'order' && e.storeId === storeId);
    
    if (dateRange) {
      events = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }
    
    return events.reduce((total, event) => total + (event.data?.orderValue || 0), 0);
  };

  return (
    <AnalyticsContext.Provider value={{
      state,
      dispatch,
      trackEvent,
      trackVisit,
      getVisits,
      getOrders,
      getOrderValue,
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
