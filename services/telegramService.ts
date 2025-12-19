const TG_TOKEN_KEY = 'dogstay_tg_token';
const TG_CHAT_ID_KEY = 'dogstay_tg_chat_id';

export const getTelegramSettings = () => ({
  token: localStorage.getItem(TG_TOKEN_KEY) || '',
  chatId: localStorage.getItem(TG_CHAT_ID_KEY) || ''
});

export const saveTelegramSettings = (token: string, chatId: string) => {
  localStorage.setItem(TG_TOKEN_KEY, token);
  localStorage.setItem(TG_CHAT_ID_KEY, chatId);
};

export const sendTelegramMessage = async (message: string) => {
  const { token, chatId } = getTelegramSettings();
  
  if (!token || !chatId) {
    console.warn("Telegram credentials missing");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Failed to send Telegram message", error);
    return false;
  }
};