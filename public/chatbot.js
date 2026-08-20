(function () {
  if (document.getElementById('bsmr-ai-chatbot-iframe')) return;

  // Mendapatkan URL script induk (Support Localhost dev & Production domain planner.bsmr.org)
  var scriptTag = document.currentScript;
  var baseUrl = 'http://localhost:5173';

  if (scriptTag && scriptTag.src) {
    try {
      var url = new URL(scriptTag.src);
      baseUrl = url.origin;
    } catch (e) {
      console.warn('BSMR Chatbot Embed: Using default base URL');
    }
  }

  // Membuat iframe penampung widget AI Chatbot BSMR
  var iframe = document.createElement('iframe');
  iframe.id = 'bsmr-ai-chatbot-iframe';
  iframe.src = baseUrl + '/widget-only';
  iframe.title = 'BSMR AI Chatbot Widget';

  // Styling penataan posisi melayang di pojok kanan bawah
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0px';
  iframe.style.right = '0px';
  iframe.style.width = '450px';
  iframe.style.height = '680px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '9999999';
  iframe.style.background = 'transparent';
  iframe.style.overflow = 'hidden';
  iframe.style.pointerEvents = 'auto';
  iframe.setAttribute('allow', 'clipboard-write');

  document.body.appendChild(iframe);

  // Relay cross-origin messages between iframe widget and parent host pages
  window.addEventListener('message', function (event) {
    if (event.data && (event.data.type === 'BSMR_CHAT_LOGS_UPDATED' || event.data.type === 'BSMR_ADMIN_REPLIED')) {
      try {
        if (event.data.sessions && Array.isArray(event.data.sessions)) {
          localStorage.setItem('bsmr_visitor_chat_sessions', JSON.stringify(event.data.sessions));
          window.dispatchEvent(new Event('bsmr_chat_logs_updated'));
        }
        if (iframe && iframe.contentWindow && event.source !== iframe.contentWindow) {
          iframe.contentWindow.postMessage(event.data, '*');
        }
      } catch (e) {
        console.warn('BSMR Chatbot Embed: Failed to sync localStorage', e);
      }
    }
  });
})();
