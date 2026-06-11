import pb from '@/lib/pocketbaseClient';

const SESSION_KEY = 'naturelap_analytics_session';

const getSessionId = () => {
  let sessionId = window.sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const trackEvent = async (eventName, details = {}) => {
  try {
    await pb.collection('analytics_events').create({
      user_id: pb.authStore.model?.id || '',
      session_id: getSessionId(),
      event_name: eventName,
      entity_type: details.entityType || '',
      entity_id: details.entityId || '',
      path: details.path || window.location.pathname,
      metadata: details.metadata || {},
    }, { $autoCancel: false });
  } catch (error) {
    console.debug('Analytics event skipped:', error);
  }
};
