import AfricasTalking from 'africastalking';

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY || '',
  username: process.env.AFRICASTALKING_USERNAME || 'cocodental',
});

const sms = africastalking.SMS;

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export async function sendSmsViaAfricasTalking(
  to: string,
  message: string
): Promise<SmsResponse> {
  try {
    // Ensure phone number is in international format
    const formattedNumber = to.startsWith('+') ? to : `+${to}`;
    
    const options = {
      to: formattedNumber,
      message: message,
      from: process.env.AFRICASTALKING_FROM_NUMBER || '0717219448',
    };

    console.log('Sending SMS via Africa\'s Talking:', {
      to: options.to,
      from: options.from,
      messageLength: message.length
    });

    const response = await sms.send(options);
    
    console.log('Africa\'s Talking SMS Response:', response);

    if (response.SMSMessageData && response.SMSMessageData.Recipients) {
      const recipient = response.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success') {
        return {
          success: true,
          messageId: recipient.messageId,
          details: response
        };
      } else {
        return {
          success: false,
          error: recipient.status,
          details: response
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected response format',
      details: response
    };

  } catch (error: any) {
    console.error('Africa\'s Talking SMS Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
      details: error
    };
  }
}

export async function testAfricasTalkingSms(): Promise<SmsResponse> {
  const testNumber = '+254717219448';
  const testMessage = 'Hello from Coco Dental! This is a test message from Africa\'s Talking SMS API.';
  
  console.log('Testing Africa\'s Talking SMS...');
  console.log('To:', testNumber);
  console.log('Message:', testMessage);
  
  return await sendSmsViaAfricasTalking(testNumber, testMessage);
} 