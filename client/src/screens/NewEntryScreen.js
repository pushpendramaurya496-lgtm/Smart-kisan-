import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useChakki } from '../context/ChakkiContext';
import { EntryApiService } from '../services/entryApiService';
import { SpeechService } from '../services/speechService';

// Popular sample suggestions for village mill context
const NAME_SUGGESTIONS = ['रामलाल शर्मा', 'कजोड़ मल मीणा', 'सुरेश जाट', 'कैलाश गुर्जर', 'महावीर सिंह', 'राकेश कुमावत'];
const VILLAGE_SUGGESTIONS = ['रामपुरा', 'चाकसू', 'दांतली', 'किशनपुरा', 'बस्सी', 'रेनवाल', 'कोटखावदा'];

// Clean number format to eliminate ugly floating-point tails (.20000000000005)
const formatCleanNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val) * 100) / 100;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

const getLastMillingInfo = (cust) => {
  if (!cust) return null;
  if (Array.isArray(cust.history) && cust.history.length > 0) {
    const h = cust.history[0];
    const crop =
      h.itemLabel ||
      (h.item === 'OIL' ? 'सरसों तेल' : h.item === 'MASALA' ? 'मसाला कुटाई' : h.item === 'WHEAT' ? 'गेहूं पिसाई' : (h.item || 'पिसाई'));
    const wt = (h.weight || h.weightKg) ? `${formatCleanNum(h.weight || h.weightKg)} KG` : '';
    const dateStr = h.date ? ` (${h.date})` : '';
    return `${crop}${wt ? ` • ${wt}` : ''}${dateStr}`;
  }
  if (Array.isArray(cust.ledgerHistory) && cust.ledgerHistory.length > 0) {
    const l = cust.ledgerHistory[0];
    if (l.description) return l.description;
  }
  if (cust.lastItemMilled) {
    const crop =
      cust.lastItemMilled === 'OIL' ? 'सरसों तेल' : cust.lastItemMilled === 'MASALA' ? 'मसाला कुटाई' : cust.lastItemMilled === 'WHEAT' ? 'गेहूं पिसाई' : cust.lastItemMilled;
    const wt = cust.lastMilledWeight ? ` • ${formatCleanNum(cust.lastMilledWeight)} KG` : '';
    const dt = cust.lastMilledDate ? ` (${cust.lastMilledDate})` : '';
    return `${crop}${wt}${dt}`;
  }
  return null;
};

export const NewEntryScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { defaultType = 'WHEAT' } = route.params || {};
  const { rates, refreshStats, addEntry, customers } = useChakki();

  // Mode: 'manual' | 'voice'
  const [entryMode, setEntryMode] = useState('manual');

  // Form Fields
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [weightKg, setWeightKg] = useState('40');
  const [selectedItem, setSelectedItem] = useState(defaultType);
  const [amountPaid, setAmountPaid] = useState('0'); // Default full credit

  // Disambiguation State for Existing Customer Match
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [useSeparateProfile, setUseSeparateProfile] = useState(false);

  useEffect(() => {
    const cleanName = name.trim().toLowerCase();
    const cleanVillage = village.trim().toLowerCase();
    const rawPhone = phone.trim().replace(/\D/g, '');

    if (cleanName.length >= 2 || rawPhone.length >= 6) {
      const match = (customers || []).find((c) => {
        const cPhone = (c.phone || '').replace(/\D/g, '');
        if (rawPhone.length >= 6 && cPhone && (cPhone.includes(rawPhone) || rawPhone.includes(cPhone))) {
          return true;
        }
        const nameMatch = cleanName.length >= 2 && (c.name || '').toLowerCase() === cleanName;
        const villageMatch = cleanVillage ? (c.village || '').toLowerCase() === cleanVillage : true;
        return nameMatch && villageMatch;
      });
      setMatchedCustomer(match || null);
      if (!match) {
        setUseSeparateProfile(false);
      }
    } else {
      setMatchedCustomer(null);
      setUseSeparateProfile(false);
    }
  }, [name, village, phone, customers]);

  const handleSelectExisting = () => {
    setUseSeparateProfile(false);
    if (matchedCustomer) {
      if (!village && matchedCustomer.village) {
        setVillage(matchedCustomer.village);
      }
      if (!phone && matchedCustomer.phone) {
        setPhone(matchedCustomer.phone);
      }
    }
  };

  // Global full-sentence Voice State
  const [voiceText, setVoiceText] = useState('');

  // Dedicated Field Voice Modal State: 'name' | 'village' | 'phone' | null
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [fieldSpokenVal, setFieldSpokenVal] = useState('');

  // Submission State
  const [loading, setLoading] = useState(false);

  // Dynamic Rate calculation
  const getRate = () => {
    if (selectedItem === 'OIL') return rates?.oilExtractionPerKg || 7;
    if (selectedItem === 'MASALA') return rates?.masalaGrindingPerKg || 15;
    if (selectedItem === 'DARRA') return rates?.darraPisaiPerKg || 4;
    return rates?.wheatPisaiPerKg || 3;
  };

  const currentRate = getRate();
  const weightNum = parseFloat(weightKg) || 0;
  const totalAmount = Math.round(weightNum * currentRate * 100) / 100;
  const paidNum = parseFloat(amountPaid) || 0;
  const pendingAmount = Math.max(0, totalAmount - paidNum);

  const adjustWeight = (delta) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const current = parseFloat(weightKg) || 0;
    setWeightKg(String(Math.max(1, current + delta)));
  };

  // 1. Intelligent Hindi / Hinglish Voice Parser with Explicit Keyword Recognition
  const parseVoiceSentence = (text) => {
    if (!text || !text.trim()) return null;

    let raw = text.trim();

    const result = {
      name: '',
      village: '',
      weightKg: '40',
      itemType: 'WHEAT',
      amountPaid: '0',
      phone: '',
    };

    const normalize = (str) =>
      str
        .replace(/[,;:\-_|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    let workingText = normalize(raw);

    // 1. EXTRACT PHONE NUMBER
    const phoneMatch = workingText.match(/(?:mobile|phone|number|मोबाइल|नंबर)?\s*([6-9]\d{9})(?:\s|$)/i);
    if (phoneMatch) {
      result.phone = phoneMatch[1];
      workingText = workingText.replace(phoneMatch[0], ' ');
    }

    // 2. EXTRACT AMOUNT PAID
    const paidRegex = /(?:(?:जमा|दिए|दिये|नगद|paid|diye|jama|cash)\s*)?(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:रुपये|रुपए|रु|रुपया|rupees|rupee|rupaye|rupiya|rupeye|rupia|rs|₹)(?:\s*(?:दिए|दिये|जमा|नगद|paid|diye|jama))?/i;
    const paidMatch = workingText.match(paidRegex);
    if (paidMatch) {
      result.amountPaid = paidMatch[1];
      workingText = workingText.replace(paidMatch[0], ' ');
    } else {
      const paidAltRegex = /(\d+(?:\.\d+)?)\s*(?:दिए|दिये|जमा|paid|diye|jama)(?:\s|$)/i;
      const paidAltMatch = workingText.match(paidAltRegex);
      if (paidAltMatch) {
        result.amountPaid = paidAltMatch[1];
        workingText = workingText.replace(paidAltMatch[0], ' ');
      }
    }

    // 3. EXTRACT WEIGHT (Compound: e.g. "13 kilo 800 gram" or "13 kilo")
    const compoundWeightRegex = /(?:वजन|भार|wajan|vajan|weight)?\s*(\d+(?:\.\d+)?)\s*(?:किलो|किग्रा|kg|kilo|kilos)\s*(?:व|और|and|,)?\s*(\d+(?:\.\d+)?)\s*(?:ग्राम|ग्राम्स|gram|grams|gm|gms|g)(?:\s|$)/i;
    const compoundMatch = workingText.match(compoundWeightRegex);

    if (compoundMatch) {
      const kg = parseFloat(compoundMatch[1]) || 0;
      const gm = parseFloat(compoundMatch[2]) || 0;
      const totalWeight = Math.round((kg + gm / 1000) * 1000) / 1000;
      result.weightKg = String(totalWeight);
      workingText = workingText.replace(compoundMatch[0], ' ');
    } else {
      const kiloRegex = /(?:(?:वजन|भार|wajan|vajan|weight)\s*)?(\d+(?:\.\d+)?)\s*(?:किलो|किग्रा|kg|kilo|kilos|क्विंटल|quintal)(?:\s|$)/i;
      const kiloMatch = workingText.match(kiloRegex);
      if (kiloMatch) {
        let val = parseFloat(kiloMatch[1]) || 40;
        if (/क्विंटल|quintal/i.test(kiloMatch[0])) {
          val = val * 100;
        }
        result.weightKg = String(val);
        workingText = workingText.replace(kiloMatch[0], ' ');
      } else {
        const gramOnlyRegex = /(?:वजन|भार|wajan|vajan|weight)?\s*(\d+(?:\.\d+)?)\s*(?:ग्राम|ग्राम्स|gram|grams|gm|gms)(?:\s|$)/i;
        const gramMatch = workingText.match(gramOnlyRegex);
        if (gramMatch) {
          const gm = parseFloat(gramMatch[1]) || 0;
          result.weightKg = String(Math.round((gm / 1000) * 1000) / 1000);
          workingText = workingText.replace(gramMatch[0], ' ');
        } else {
          const wajanBareRegex = /(?:वजन|भार|wajan|vajan|weight)\s*(\d+(?:\.\d+)?)(?:\s|$)/i;
          const wajanBareMatch = workingText.match(wajanBareRegex);
          if (wajanBareMatch) {
            result.weightKg = wajanBareMatch[1];
            workingText = workingText.replace(wajanBareMatch[0], ' ');
          }
        }
      }
    }

    workingText = workingText.replace(/\b(?:wajan|vajan|weight)\b|वजन|भार/gi, ' ');

    // 4. EXTRACT ITEM TYPE
    if (/सरसों|सरसो|राई|तेल|तिलहन|mustard|oil|tel/i.test(workingText)) {
      result.itemType = 'OIL';
      workingText = workingText.replace(/सरसों|सरसो|राई|तेल|तिलहन|mustard|oil|tel/gi, ' ');
    } else if (/मसाला|मिर्च|हल्दी|धनिया|masala|spices|chilli/i.test(workingText)) {
      result.itemType = 'MASALA';
      workingText = workingText.replace(/मसाला|मिर्च|हल्दी|धनिया|masala|spices|chilli/gi, ' ');
    } else if (/दर्रा|दलिया|मक्का|darra|dalya|daliya/i.test(workingText)) {
      result.itemType = 'DARRA';
      workingText = workingText.replace(/दर्रा|दलिया|मक्का|darra|dalya|daliya/gi, ' ');
    } else if (/गेहूं|गेहू|कनक|wheat|gehun|gehu|atta|aata/i.test(workingText)) {
      result.itemType = 'WHEAT';
      workingText = workingText.replace(/गेहूं|गेहू|कनक|wheat|gehun|gehu|atta|aata/gi, ' ');
    }

    workingText = workingText
      .replace(/\b(?:pisai|kutai|nikasi|udhar|baki|baaki|cash|full|pura|aadha)\b/gi, ' ')
      .replace(/पिसाई|कुटाई|निकासी|उधार|नगद|बाकी|पूरा|आधा|का|की|के/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 5. EXTRACT VILLAGE & CUSTOMER NAME
    const villageKeywordRegex = /(?:\b(?:gaon|gaav|gavoun|gavon|gav|village|dhani|shahar|kasba)\b|गांव|गाँव|गाव|ढाणी|शहर|कस्बा)\s*[:=]?\s*/i;
    const villageKeywordMatch = workingText.match(villageKeywordRegex);
    const nameKeywordRegex = /(?:\b(?:naam|name|customer|cust)\b|नाम|ग्राहक)\s*[:=]?\s*/i;

    if (villageKeywordMatch) {
      const splitIndex = villageKeywordMatch.index;
      const beforeVillage = workingText.substring(0, splitIndex).trim();
      const afterVillage = workingText.substring(splitIndex + villageKeywordMatch[0].length).trim();
      result.village = afterVillage;
      result.name = beforeVillage;
    } else if (nameKeywordRegex.test(workingText)) {
      let cleanText = workingText.replace(nameKeywordRegex, '').trim();
      const words = cleanText.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        result.name = words.slice(0, words.length - 1).join(' ');
        result.village = words[words.length - 1];
      } else if (words.length === 1) {
        result.name = words[0];
      }
    } else {
      const words = workingText.split(/\s+/).filter(Boolean);
      if (words.length >= 3) {
        result.name = words.slice(0, words.length - 1).join(' ');
        result.village = words[words.length - 1];
      } else if (words.length === 2) {
        result.name = words[0];
        result.village = words[1];
      } else if (words.length === 1) {
        result.name = words[0];
      }
    }

    result.name = result.name
      .replace(/(?:\b(?:naam|name|shri|mr)\b|नाम|श्री)\s*[:=]?\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    result.village = result.village
      .replace(/(?:\b(?:gaon|gaav|gavoun|village)\b|गांव|गाँव|गाव)\s*[:=]?\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return result;
  };

  const handleApplyFullSentenceVoice = () => {
    if (!voiceText || !voiceText.trim()) {
      Alert.alert(
        'बोलें या लिखें',
        'कृपया नीचे बॉक्स में कीबोर्ड के 🎙️ माइक से अपनी पूरी बात बोलें (उदा. "सुरेश कुमार गांव इमलिया कला 13 किलो 800 ग्राम 50 रुपये दिए")'
      );
      return;
    }

    const parsed = parseVoiceSentence(voiceText);
    if (parsed) {
      if (parsed.name) setName(parsed.name);
      if (parsed.village) setVillage(parsed.village);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.weightKg) setWeightKg(parsed.weightKg);
      if (parsed.itemType) setSelectedItem(parsed.itemType);
      if (parsed.amountPaid) setAmountPaid(parsed.amountPaid);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      Alert.alert(
        'विवरण भर दिया गया',
        `ग्राहक: ${parsed.name || 'नहीं मिला'}\nगांव: ${parsed.village || 'नहीं मिला'}\nवजन: ${parsed.weightKg || '40'} किलो\nजमा: ₹${parsed.amountPaid || '0'}`
      );
      SpeechService.speak(`${parsed.name || ''} ${parsed.village || ''} ${parsed.weightKg || ''} किलो पिसाई विवरण भर दिया गया`);
    }
  };

  // 2. Dedicated Single Field Voice Dialog (Customer Name, Village, Phone)
  const handleOpenFieldVoice = (fieldKey) => {
    setActiveVoiceField(fieldKey);
    const currentVal = fieldKey === 'name' ? name : fieldKey === 'village' ? village : phone;
    setFieldSpokenVal(currentVal || '');
    try {
      Haptics.selectionAsync();
    } catch (e) {}
  };

  const handleApplyFieldVoice = (customVal) => {
    const finalVal = (customVal !== undefined ? customVal : fieldSpokenVal || '').trim();
    if (!finalVal) {
      Alert.alert('बोलें या लिखें', 'कृपया पहले कीबोर्ड के 🎙️ माइक से बोलें या कोई नाम लिखें');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (activeVoiceField === 'name') {
      setName(finalVal);
      SpeechService.speak(`ग्राहक: ${finalVal}`);
    } else if (activeVoiceField === 'village') {
      setVillage(finalVal);
      SpeechService.speak(`गांव: ${finalVal}`);
    } else if (activeVoiceField === 'phone') {
      setPhone(finalVal);
    }

    setActiveVoiceField(null);
  };

  // 3. Save Entry Instantly (Optimistic 0ms update + Background sync)
  const handleSaveEntry = () => {
    if (!name.trim()) {
      Alert.alert('त्रुटि', 'कृपया ग्राहक का नाम दर्ज करें');
      return;
    }
    if (!village.trim()) {
      Alert.alert('त्रुटि', 'कृपया गांव का नाम दर्ज करें');
      return;
    }
    if (!weightKg || parseFloat(weightKg) <= 0) {
      Alert.alert('त्रुटि', 'कृपया सही वजन (किलो) दर्ज करें');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    // Prepare item label and today's date
    const itemLabel = selectedItem === 'OIL'
      ? 'सरसों (तेल)'
      : selectedItem === 'MASALA'
      ? 'हल्दी / मसाला पिसाई'
      : selectedItem === 'DARRA'
      ? 'दर्रा / दलिया (पिसाई)'
      : 'गेहूं (पिसाई)';

    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    // Instant local token number
    const instantToken = String(Math.floor(Math.random() * 80) + 1);

    const billPayload = {
      customerName: name.trim(),
      village: village.trim(),
      item: itemLabel,
      weightKg: parseFloat(weightKg),
      ratePerKg: currentRate,
      totalAmount: totalAmount,
      pendingAmount: pendingAmount,
      tokenNumber: instantToken,
      date: dateStr,
      status: pendingAmount > 0 ? 'भुगतान बाकी' : 'भुगतान चुकता',
    };

    // 1. Immediately notify ChakkiContext (0ms delay - Instant UI update across all screens!)
    const matchedId = (matchedCustomer && !useSeparateProfile)
      ? (matchedCustomer.id || matchedCustomer._id || matchedCustomer.customerId)
      : null;

    if (addEntry) {
      addEntry({
        customerId: matchedId,
        customerName: name.trim(),
        village: village.trim(),
        phone: phone.trim(),
        item: itemLabel,
        weight: parseFloat(weightKg),
        rate: currentRate,
        amountPaid: paidNum,
        totalAmount: totalAmount,
        pendingAmount: pendingAmount,
        isPaid: pendingAmount === 0,
        createNew: useSeparateProfile,
        skipVoice: true,
      });
    }

    // 2. Single clear voice announcement
    if (paidNum > 0 && pendingAmount === 0) {
      SpeechService.announceCashReceived(name.trim(), paidNum);
    } else if (paidNum > 0 && pendingAmount > 0) {
      SpeechService.speak(`${name.trim()} से ₹${paidNum} प्राप्त हुए, और ₹${pendingAmount} बाकी दर्ज किए गए।`);
    } else {
      SpeechService.announceDebtRecorded(name.trim(), pendingAmount);
    }

    // 3. Clear inputs and instantly navigate to BillPrintScreen (0ms delay!)
    const savedName = name.trim();
    const savedVillage = village.trim();
    const savedPhone = phone.trim();
    const savedWeight = parseFloat(weightKg);

    setName('');
    setVillage('');
    setPhone('');
    setWeightKg('40');
    setAmountPaid('0');
    setVoiceText('');

    navigation.navigate('BillPrint', billPayload);

    // 4. Asynchronously sync to backend database in background (Non-blocking)
    const backendPayload = {
      name: savedName,
      village: savedVillage,
      phone: savedPhone,
      weightKg: savedWeight,
      itemType: selectedItem,
      ratePerKg: currentRate,
      amountPaid: paidNum,
      source: entryMode === 'voice' ? 'VOICE' : 'MANUAL',
    };

    const isMongoId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    if (matchedId && isMongoId(matchedId)) {
      backendPayload.customerId = matchedId;
    } else if (useSeparateProfile) {
      backendPayload.createNewCustomer = true;
    }

    EntryApiService.createEntry(backendPayload)
      .then(() => {
        if (refreshStats) {
          refreshStats();
        }
      })
      .catch((err) => {
        console.warn('[NewEntry] Background sync fallback:', err.message);
      });
  };

  const resetForm = () => {
    setName('');
    setVillage('');
    setPhone('');
    setWeightKg('40');
    setAmountPaid('0');
    setVoiceText('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top || 0, 40) + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← वापस</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>🌾 नई पिसाई एंट्री</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom || 0, 20) + 24 },
        ]}
      >
        {/* Dual Input Tabs: Voice vs Manual */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, entryMode === 'manual' && styles.modeTabActive]}
            onPress={() => setEntryMode('manual')}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, entryMode === 'manual' && styles.modeTabTextActive]}>
              ✍️ हाथ से लिखें
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, entryMode === 'voice' && styles.modeTabActive]}
            onPress={() => setEntryMode('voice')}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, entryMode === 'voice' && styles.modeTabTextActive]}>
              🎙️ पूरी एंट्री बोलकर भरें
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Voice Input Section when Voice mode is active */}
        {entryMode === 'voice' && (
          <View style={styles.voiceSectionCard}>
            <View style={styles.voiceCardHeaderRow}>
              <Text style={styles.voiceCardHeaderTitle}>🎙️ पूरी लाइन बोलकर भरें</Text>
              <View style={styles.voiceAITag}>
                <Text style={styles.voiceAITagText}>AI ऑटो-पार्सर</Text>
              </View>
            </View>

            <View style={styles.voiceInstructionBox}>
              <Text style={styles.voiceInstructionEmoji}>💡</Text>
              <Text style={styles.voiceInstructionText}>
                नाम, गांव, वजन बोलें (जैसे: <Text style={{ fontWeight: '800', color: '#0F5132' }}>सुरेश कुमार गांव इमलिया कला 13 किलो 800 ग्राम</Text>):
              </Text>
            </View>

            <TextInput
              style={styles.voiceSentenceInput}
              multiline
              numberOfLines={3}
              placeholder='उदा. "Suresh Kumar gaon imliya Kala 13 kilo 800 gram"...'
              placeholderTextColor="#94A3B8"
              value={voiceText}
              onChangeText={setVoiceText}
            />

            <View style={styles.voiceActionBtnsRow}>
              <TouchableOpacity
                style={styles.parseVoiceBtn}
                onPress={handleApplyFullSentenceVoice}
                activeOpacity={0.85}
              >
                <Text style={styles.parseVoiceBtnText}>⚡ AI से फॉर्म भरें (Parse)</Text>
              </TouchableOpacity>

              {voiceText ? (
                <TouchableOpacity
                  style={styles.clearVoiceBtn}
                  onPress={() => setVoiceText('')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearVoiceBtnText}>साफ करें</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Main Entry Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>📋 ग्राहक व पिसाई विवरण</Text>
            <Text style={styles.voiceHintBadge}>🎙️ माइक दबाकर बोलें</Text>
          </View>

          {/* 1. Customer Name with Dedicated Field Mic */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>ग्राहक का नाम (Customer Name) *</Text>
              <Text style={styles.fieldTouchHint}>टच करें या माइक से बोलें</Text>
            </View>

            <View style={styles.inputWithMicRow}>
              <TextInput
                style={styles.inputWithMicText}
                placeholder="उदा. रामलाल शर्मा"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
              <TouchableOpacity
                style={styles.fieldMicButton}
                onPress={() => handleOpenFieldVoice('name')}
                activeOpacity={0.8}
              >
                <Text style={styles.fieldMicIcon}>🎙️</Text>
                <Text style={styles.fieldMicLabel}>बोलें</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Village with Dedicated Field Mic */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>गांव / ढाणी / शहर (Village) *</Text>
              <Text style={styles.fieldTouchHint}>टच करें या माइक से बोलें</Text>
            </View>

            <View style={styles.inputWithMicRow}>
              <TextInput
                style={styles.inputWithMicText}
                placeholder="उदा. रामपुरा"
                placeholderTextColor="#94A3B8"
                value={village}
                onChangeText={setVillage}
              />
              <TouchableOpacity
                style={styles.fieldMicButton}
                onPress={() => handleOpenFieldVoice('village')}
                activeOpacity={0.8}
              >
                <Text style={styles.fieldMicIcon}>🎙️</Text>
                <Text style={styles.fieldMicLabel}>बोलें</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Mobile Number with Field Mic */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>मोबाइल नंबर (वैकल्पिक)</Text>
            <View style={styles.inputWithMicRow}>
              <TextInput
                style={styles.inputWithMicText}
                placeholder="उदा. 9829012345"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
              <TouchableOpacity
                style={styles.fieldMicButton}
                onPress={() => handleOpenFieldVoice('phone')}
                activeOpacity={0.8}
              >
                <Text style={styles.fieldMicIcon}>🎙️</Text>
                <Text style={styles.fieldMicLabel}>बोलें</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Existing Customer Match & Disambiguation Card */}
          {matchedCustomer ? (
            <View style={styles.matchedCustomerCard}>
              <View style={styles.matchedHeaderRow}>
                <View style={styles.matchedAvatarCircle}>
                  <Text style={styles.matchedIcon}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchedTitle}>
                    पुराना खाता मिला: {matchedCustomer.name} ({matchedCustomer.village || 'ग्राम'})
                  </Text>

                  {/* 1. Mobile number if available */}
                  {matchedCustomer.phone ? (
                    <Text style={styles.matchedPhoneText}>
                      📞 मोबाइल: {matchedCustomer.phone}
                    </Text>
                  ) : null}

                  {/* 2. Cleanly rounded pending balance & total weight (no ugly float tails) */}
                  <Text style={styles.matchedSubtext}>
                    {(matchedCustomer.pendingBalance || 0) > 0
                      ? `🔴 पिछला बकाया: ₹${formatCleanNum(matchedCustomer.pendingBalance)}`
                      : '🟢 कोई पिछला बकाया नहीं'}
                    {matchedCustomer.totalPisaiKg ? ` • कुल पिसाई: ${formatCleanNum(matchedCustomer.totalPisaiKg)} KG` : ''}
                  </Text>

                  {/* 3. Last milled item & date */}
                  {getLastMillingInfo(matchedCustomer) ? (
                    <View style={styles.lastMilledPill}>
                      <Text style={styles.lastMilledText}>
                        🌾 पिछली बार: {getLastMillingInfo(matchedCustomer)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.disambiguationButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.disambiguationBtn,
                    !useSeparateProfile ? styles.disambiguationBtnActive : styles.disambiguationBtnInactive,
                  ]}
                  onPress={handleSelectExisting}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.disambiguationBtnText,
                      !useSeparateProfile ? styles.disambiguationBtnTextActive : styles.disambiguationBtnTextInactive,
                    ]}
                  >
                    ✓ इसी खाते में जोड़ें
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.disambiguationBtn,
                    useSeparateProfile ? styles.disambiguationBtnActive : styles.disambiguationBtnInactive,
                  ]}
                  onPress={() => setUseSeparateProfile(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.disambiguationBtnText,
                      useSeparateProfile ? styles.disambiguationBtnTextActive : styles.disambiguationBtnTextInactive,
                    ]}
                  >
                    ➕ यह अलग ग्राहक हैं (नया खाता)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* 4. Service / Crop Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>पिसाई का प्रकार</Text>
            <View style={styles.cropChipsRow}>
              {[
                { id: 'WHEAT', label: '🌾 गेहूं पिसाई', rate: rates?.wheatPisaiPerKg || 3 },
                { id: 'OIL', label: '🌻 सरसों तेल', rate: rates?.oilExtractionPerKg || 7 },
                { id: 'MASALA', label: '🌶️ हल्दी / मसाला', rate: rates?.masalaGrindingPerKg || 15 },
                { id: 'DARRA', label: '🌽 दर्रा पिसाई', rate: rates?.darraPisaiPerKg || 4 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.cropChip,
                    selectedItem === item.id && styles.cropChipActive,
                  ]}
                  onPress={() => setSelectedItem(item.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.cropChipText,
                      selectedItem === item.id && styles.cropChipTextActive,
                    ]}
                  >
                    {item.label} (₹{item.rate})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 5. Weight in KG with Stepper */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>वजन (किलो में) *</Text>
            <View style={styles.weightRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustWeight(-5)}
              >
                <Text style={styles.stepBtnText}>-5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustWeight(-1)}
              >
                <Text style={styles.stepBtnText}>-1</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={weightKg}
                onChangeText={setWeightKg}
              />
              <Text style={styles.kgBadge}>KG</Text>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustWeight(1)}
              >
                <Text style={styles.stepBtnText}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustWeight(5)}
              >
                <Text style={styles.stepBtnText}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Financial Billing & Payment Card */}
        <View style={styles.billingCard}>
          <Text style={styles.cardHeader}>💰 बिल व भुगतान (Payment)</Text>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>कुल पिसाई बिल:</Text>
            <Text style={styles.calcTotalVal}>
              ₹{totalAmount} ({weightKg} kg × ₹{currentRate})
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Amount Paid Box */}
          <Text style={styles.fieldLabel}>अभी कितने पैसे मिले? (Amount Paid)</Text>

          {/* Quick Shortcuts */}
          <View style={styles.quickPillsRow}>
            <TouchableOpacity
              style={[
                styles.quickPill,
                paidNum === 0 && styles.quickPillActiveRed,
              ]}
              onPress={() => setAmountPaid('0')}
            >
              <Text style={[styles.quickPillText, paidNum === 0 && styles.quickPillTextRed]}>
                🔴 ₹0 (पूरा उधार)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPill,
                paidNum === totalAmount && styles.quickPillActiveGreen,
              ]}
              onPress={() => setAmountPaid(String(totalAmount))}
            >
              <Text style={[styles.quickPillText, paidNum === totalAmount && styles.quickPillTextGreen]}>
                🟢 पूरे ₹{totalAmount} मिले
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => setAmountPaid(String(Math.round(totalAmount / 2)))}
            >
              <Text style={styles.quickPillText}>
                🟡 आधा (₹{Math.round(totalAmount / 2)})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paidInputRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.paidInput}
              keyboardType="numeric"
              placeholder="जमा राशि..."
              placeholderTextColor="#94A3B8"
              value={amountPaid}
              onChangeText={setAmountPaid}
            />
          </View>

          {/* Live Remaining Balance */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>खाते में बाकी रहेगा:</Text>
            <Text
              style={[
                styles.balanceValue,
                pendingAmount > 0 ? styles.balanceRed : styles.balanceGreen,
              ]}
            >
              {pendingAmount > 0 ? `₹${pendingAmount} (उधार)` : '₹0 (पूरा चुकता)'}
            </Text>
          </View>
        </View>

        {/* Action Button: Save & Generate Token */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveEntry}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              💾 एंट्री सहेजें और टोकन निकालें →
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Dedicated Single Field Voice Modal (for Customer Name, Village, Phone) */}
      {activeVoiceField && (
        <Modal
          visible={!!activeVoiceField}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveVoiceField(null)}
        >
          <TouchableOpacity
            style={styles.fieldVoiceOverlay}
            activeOpacity={1}
            onPress={() => setActiveVoiceField(null)}
          >
            <View style={styles.fieldVoiceSheet}>
              <View style={styles.sheetHandle} />

              {/* Title based on active field */}
              <Text style={styles.fieldVoiceModalTitle}>
                {activeVoiceField === 'name'
                  ? '🎙️ ग्राहक का नाम बोलें'
                  : activeVoiceField === 'village'
                  ? '🎙️ गांव / ढाणी का नाम बोलें'
                  : '🎙️ मोबाइल नंबर बोलें'}
              </Text>

              {/* Helpful Voice Typing Tip */}
              <View style={styles.voiceKeyboardTip}>
                <Text style={styles.voiceKeyboardTipIcon}>💡</Text>
                <Text style={styles.voiceKeyboardTipText}>
                  नीचे खुले कीबोर्ड के <Text style={{ fontWeight: '800', color: '#0F5132' }}>🎙️ माइक (Voice Typing)</Text> पर दबाकर बोलें। जो आप बोलेंगे, वही यहाँ लिखा जाएगा:
                </Text>
              </View>

              {/* Real Editable Input Box with autoFocus */}
              <View style={styles.voiceLiveInputWrapper}>
                <TextInput
                  style={styles.voiceLiveInput}
                  autoFocus={true}
                  placeholder={
                    activeVoiceField === 'name'
                      ? 'माइक से नाम बोलें या लिखें...'
                      : activeVoiceField === 'village'
                      ? 'माइक से गांव का नाम बोलें...'
                      : 'मोबाइल नंबर बोलें या लिखें...'
                  }
                  placeholderTextColor="#94A3B8"
                  value={fieldSpokenVal}
                  onChangeText={setFieldSpokenVal}
                />
                {fieldSpokenVal ? (
                  <TouchableOpacity
                    onPress={() => setFieldSpokenVal('')}
                    style={styles.liveClearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.liveClearText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Confirm / OK Button */}
              <TouchableOpacity
                style={[
                  styles.fieldVoiceConfirmBtn,
                  !fieldSpokenVal.trim() && styles.fieldVoiceConfirmBtnDisabled,
                ]}
                onPress={() => handleApplyFieldVoice(fieldSpokenVal)}
                activeOpacity={0.88}
                disabled={!fieldSpokenVal.trim()}
              >
                <Text style={styles.fieldVoiceConfirmBtnText}>
                  ✅ यह {activeVoiceField === 'name' ? 'नाम' : activeVoiceField === 'village' ? 'गांव' : 'नंबर'} भरें (OK)
                </Text>
              </TouchableOpacity>

              {/* Quick 1-Tap Suggestions */}
              <Text style={styles.suggestionsHeader}>
                {activeVoiceField === 'name'
                  ? '🌾 या 1-टच में लोकप्रिय नाम चुनें:'
                  : activeVoiceField === 'village'
                  ? '📍 या 1-टच में गांव चुनें:'
                  : 'लोकप्रिय नंबर:'}
              </Text>

              <View style={styles.suggestionsRow}>
                {(activeVoiceField === 'name'
                  ? NAME_SUGGESTIONS
                  : activeVoiceField === 'village'
                  ? VILLAGE_SUGGESTIONS
                  : ['9829012345', '9414012345']
                ).map((sugg, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggChip}
                    onPress={() => handleApplyFieldVoice(sugg)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.suggChipText}>{sugg}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.fieldVoiceCancelBtn}
                onPress={() => setActiveVoiceField(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.fieldVoiceCancelText}>रद्द करें (Cancel)</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EDF5EE',
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F5132',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2E14',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF5EE',
    borderRadius: 20,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  modeTabActive: {
    backgroundColor: '#0F5132',
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  voiceSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  voiceCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceCardHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#065F46',
  },
  voiceAITag: {
    backgroundColor: '#EDF5EE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  voiceAITagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  voiceInstructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  voiceInstructionEmoji: {
    fontSize: 14,
  },
  voiceInstructionText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  voiceSentenceInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '600',
    minHeight: 68,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  voiceActionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  parseVoiceBtn: {
    flex: 1,
    backgroundColor: '#0F5132',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parseVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  clearVoiceBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  clearVoiceBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  billingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  voiceHintBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#EDF5EE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldTouchHint: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  inputWithMicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    height: 52,
  },
  inputWithMicText: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldMicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF5EE',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  fieldMicIcon: {
    fontSize: 15,
  },
  fieldMicLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#065F46',
  },
  cropChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  cropChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cropChipActive: {
    backgroundColor: '#EDF5EE',
    borderColor: '#059669',
  },
  cropChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  cropChipTextActive: {
    color: '#065F46',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stepBtn: {
    backgroundColor: '#EDF5EE',
    borderRadius: 10,
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F5132',
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#059669',
    height: 44,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  kgBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calcLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  calcTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0A2E14',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  quickPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickPillActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  quickPillActiveGreen: {
    backgroundColor: '#EDF5EE',
    borderColor: '#86EFAC',
  },
  quickPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  quickPillTextRed: {
    color: '#DC2626',
  },
  quickPillTextGreen: {
    color: '#15803D',
  },
  paidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  rupeeSign: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F5132',
    marginRight: 6,
  },
  paidInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  balanceRed: {
    color: '#DC2626',
  },
  balanceGreen: {
    color: '#15803D',
  },
  saveButton: {
    backgroundColor: '#0F5132',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0F5132',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Dedicated Field Voice Modal Styles
  fieldVoiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fieldVoiceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  fieldVoiceModalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0A2E14',
    textAlign: 'center',
    marginBottom: 10,
  },
  voiceKeyboardTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDF5EE',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  voiceKeyboardTipIcon: {
    fontSize: 16,
  },
  voiceKeyboardTipText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  voiceLiveInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#059669',
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 14,
  },
  voiceLiveInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveClearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveClearText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  fieldVoiceConfirmBtn: {
    backgroundColor: '#0F5132',
    borderRadius: 24,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  fieldVoiceConfirmBtnDisabled: {
    opacity: 0.5,
  },
  fieldVoiceConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  suggestionsHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  suggChip: {
    backgroundColor: '#EDF5EE',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  suggChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  fieldVoiceCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fieldVoiceCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },

  // Token Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 5,
  },
  tokenSuccessIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  tokenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A2E14',
    marginBottom: 14,
  },
  tokenBox: {
    backgroundColor: '#0F5132',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  tokenBoxLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
  },
  tokenBoxNum: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 2,
  },
  chalkInstruction: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 4,
  },
  sumLine: {
    fontSize: 13,
    color: '#475569',
  },
  bold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBtnRow: {
    width: '100%',
    gap: 10,
  },
  modalBillBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 22,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalBillBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  modalNextBtn: {
    backgroundColor: '#0F5132',
    borderRadius: 22,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalHomeBtn: {
    backgroundColor: '#EDF5EE',
    borderRadius: 22,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHomeBtnText: {
    color: '#0F5132',
    fontSize: 14,
    fontWeight: '800',
  },
  matchedCustomerCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  matchedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  matchedAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedIcon: {
    fontSize: 20,
  },
  matchedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
  },
  matchedPhoneText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  matchedSubtext: {
    fontSize: 12.5,
    color: '#166534',
    marginTop: 3,
  },
  lastMilledPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  lastMilledText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532D',
  },
  disambiguationButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  disambiguationBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disambiguationBtnActive: {
    backgroundColor: '#0F5132',
  },
  disambiguationBtnInactive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  disambiguationBtnText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  disambiguationBtnTextActive: {
    color: '#FFFFFF',
  },
  disambiguationBtnTextInactive: {
    color: '#166534',
  },
});
