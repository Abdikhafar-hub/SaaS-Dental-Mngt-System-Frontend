/* eslint-disable */
require('dotenv').config();
const AfricasTalking = require('africastalking');

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY || '',
  username: process.env.AFRICASTALKING_USERNAME || 'cocodental',
});

const sms = africastalking.SMS;

async function testAfricasTalkingSms() {
  try {
    console.log('🚀 Testing Africa\'s Talking SMS Integration...');
    console.log('Username:', process.env.AFRICASTALKING_USERNAME);
    console.log('API Key:', process.env.AFRICASTALKING_API_KEY ? '***' + process.env.AFRICASTALKING_API_KEY.slice(-4) : 'NOT SET');
    console.log('From Number:', process.env.AFRICASTALKING_FROM_NUMBER);
    console.log('');

    const testNumber = '+254717219448';
    const testMessage = 'Hello from Coco Dental! This is a test message from Africa\'s Talking SMS API.';
    
    console.log('📱 Sending test SMS...');
    console.log('To:', testNumber);
    console.log('Message:', testMessage);
    console.log('');

    const options = {
      to: testNumber,
      message: testMessage,
      from: process.env.AFRICASTALKING_FROM_NUMBER || '0717219448',
    };

    console.log('📤 Sending SMS with options:', {
      to: options.to,
      from: options.from,
      messageLength: options.message.length
    });
    console.log('');

    const response = await sms.send(options);
    
    console.log('📥 Africa\'s Talking Response:');
    console.log(JSON.stringify(response, null, 2));
    console.log('');

    if (response.SMSMessageData && response.SMSMessageData.Recipients) {
      const recipient = response.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success') {
        console.log('✅ SMS sent successfully!');
        console.log('Message ID:', recipient.messageId);
        console.log('Cost:', recipient.cost);
        console.log('Status:', recipient.status);
      } else {
        console.log('❌ SMS failed to send');
        console.log('Status:', recipient.status);
        console.log('Error:', recipient.status);
      }
    } else {
      console.log('❌ Unexpected response format');
      console.log('Response:', response);
    }

  } catch (error) {
    console.error('❌ Error testing Africa\'s Talking SMS:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testAfricasTalkingSms()
  .then(() => {
    console.log('\n🏁 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 