import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export const SpeechService = {
  // Speak Hindi confirmation message loudly and clearly
  speak(text) {
    try {
      Speech.speak(text, {
        language: 'hi-IN',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (err) {
      console.warn('Speech error:', err);
    }
  },

  // When Green button (Cash Paid) is pressed
  announceCashReceived(customerName, amount) {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      this.speak(`${customerName} से ${amount} रुपये नकद प्राप्त हुए।`);
    } catch (e) {}
  },

  // When Red button (Udhar / Credit) is pressed
  announceDebtRecorded(customerName, amount) {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      this.speak(`${customerName} के खाते में ${amount} रुपये उधार दर्ज हो गए हैं।`);
    } catch (e) {}
  },

  // Stop speaking
  stop() {
    try {
      Speech.stop();
    } catch (e) {}
  },
};
