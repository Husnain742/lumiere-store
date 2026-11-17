import axios from 'axios';

export async function sendWhatsAppNotification(phone: string, message: string) {
  try {
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!instanceId || !token) {
      console.log("WhatsApp API credentials missing in .env file.");
      return;
    }

    // Using UltraMsg or standard WhatsApp API gateway structure
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    
    await axios.post(url, {
      token: token,
      to: phone, // Customer phone number (e.g., +923001234567)
      body: message
    });
    
    console.log("WhatsApp notification sent successfully!");
  } catch (error) {
    console.error("Failed to send WhatsApp notification:", error);
  }
}