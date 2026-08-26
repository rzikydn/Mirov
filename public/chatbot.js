(function () {
  if (document.getElementById('bsmr-ai-chatbot-iframe')) return;

  // Mendapatkan URL script induk (Support Localhost dev & Production domain planner.bsmr.org)
  var scriptTag = document.currentScript;
  var baseUrl = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'https://planner.bsmr.org';

  if (scriptTag && scriptTag.src) {
    try {
      var url = new URL(scriptTag.src);
      baseUrl = url.origin;
    } catch (e) {
      console.warn('BSMR Chatbot Embed: Using default base URL');
    }
  }

  var isMobile = window.innerWidth < 768 || (window.screen && window.screen.width < 768);
  var isChatOpen = false;

  // Membuat iframe penampung widget AI Chatbot BSMR
  var iframe = document.createElement('iframe');
  iframe.id = 'bsmr-ai-chatbot-iframe';
  iframe.src = baseUrl + '/widget-only?isMobile=' + (isMobile ? '1' : '0');
  iframe.title = 'BSMR AI Chatbot Widget';

  // Styling penataan posisi melayang di pojok kanan bawah
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0px';
  iframe.style.right = '0px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '9999999';
  iframe.style.background = 'transparent';
  iframe.style.overflow = 'hidden';
  iframe.style.pointerEvents = 'auto';
  iframe.setAttribute('allow', 'clipboard-write');

  function updateIframeLayout() {
    isMobile = window.innerWidth < 768 || (window.screen && window.screen.width < 768);
    if (isMobile) {
      if (isChatOpen) {
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.maxWidth = '100vw';
        iframe.style.maxHeight = '100vh';
        iframe.style.left = '0px';
        iframe.style.right = '0px';
        iframe.style.bottom = '0px';
        iframe.style.top = '0px';
      } else {
        iframe.style.width = '150px';
        iframe.style.height = '115px';
        iframe.style.maxWidth = '100vw';
        iframe.style.maxHeight = '100vh';
        iframe.style.left = 'auto';
        iframe.style.right = '0px';
        iframe.style.bottom = '0px';
        iframe.style.top = 'auto';
      }
    } else {
      iframe.style.width = '450px';
      iframe.style.height = '680px';
      iframe.style.maxWidth = '100vw';
      iframe.style.maxHeight = '100vh';
      iframe.style.left = 'auto';
      iframe.style.right = '0px';
      iframe.style.bottom = '0px';
      iframe.style.top = 'auto';
    }

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'BSMR_VIEWPORT_RESIZE',
        isMobile: isMobile,
        parentWidth: window.innerWidth,
        parentHeight: window.innerHeight
      }, '*');
    }
  }

  updateIframeLayout();
  document.body.appendChild(iframe);

  window.addEventListener('resize', updateIframeLayout);
  iframe.addEventListener('load', updateIframeLayout);

  // Relay cross-origin messages between iframe widget and parent host pages
  window.addEventListener('message', function (event) {
    if (event.data) {
      if (event.data.type === 'BSMR_CHAT_OPENED') {
        isChatOpen = true;
        updateIframeLayout();
      } else if (event.data.type === 'BSMR_CHAT_CLOSED') {
        isChatOpen = false;
        updateIframeLayout();
      }

      if (event.data.type === 'BSMR_CHAT_LOGS_UPDATED' || event.data.type === 'BSMR_ADMIN_REPLIED' || event.data.type === 'BSMR_SETTINGS_UPDATED') {
        try {
          if (event.data.type === 'BSMR_SETTINGS_UPDATED' && event.data.settings) {
            localStorage.setItem('mirov_chatbot_settings', JSON.stringify(event.data.settings));
            window.dispatchEvent(new Event('bsmr_settings_updated'));
          }
          if (event.data.sessions && Array.isArray(event.data.sessions)) {
            localStorage.setItem('bsmr_visitor_chat_sessions', JSON.stringify(event.data.sessions));
            window.dispatchEvent(new Event('bsmr_chat_logs_updated'));
          }
          if (iframe && iframe.contentWindow && event.source !== iframe.contentWindow) {
            iframe.contentWindow.postMessage(event.data, '*');
          }
        } catch (e) {
          console.warn('BSMR Chatbot Embed: Failed to sync settings/logs', e);
        }
      }
    }
  });
})();
