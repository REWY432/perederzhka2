
export const sendTelegramMessage = async (message: string, token?: string, chatId?: string) => {
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
