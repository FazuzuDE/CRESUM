import type catalog from './locales/hi/catalog';
type ExerciseId =
  Extract<
    keyof typeof catalog,
    `catalog.exercise.${string}`
  > extends `catalog.exercise.${infer Id}`
    ? Id
    : never;

// Search-only aliases. They never change exercise identities or stored names.
export default {
  'barbell-bench-press': ['बेंचप्रेस', 'बारबेल चेस्ट प्रेस', 'barbel bench'],
  'incline-dumbbell-press': [
    'इनक्लाइन डम्बल प्रेस',
    'ऊपरी छाती डंबल प्रेस',
    'incline dumbel press',
  ],
  'dumbbell-bench-press': ['डम्बल बेंच प्रेस', 'फ्लैट डंबल प्रेस', 'dumbel bench'],
  'machine-chest-press': ['चेस्ट प्रेस मशीन', 'छाती प्रेस मशीन', 'chest ki machine'],
  'cable-chest-fly': ['केबल फ्लाई', 'केबल क्रॉसओवर', 'cable crossover'],
  'pec-deck-fly': ['बटरफ्लाई मशीन', 'चेस्ट फ्लाई मशीन', 'butterfly machine'],
  'push-up': ['पुशअप', 'पुश अप', 'pushup'],
  'barbell-bent-over-row': [
    'बेंट ओवर बारबेल रो',
    'झुककर बारबेल रो',
    'barbel rowing',
  ],
  'seated-cable-row': ['सीटेड रो', 'बैठकर केबल रो', 'baithkar cable row'],
  'seated-cable-row-close-neutral-v-handle': [
    'वी ग्रिप सीटेड रो',
    'क्लोज ग्रिप वी हैंडल रो',
    'v grip seated row',
  ],
  'one-arm-dumbbell-row': [
    'सिंगल आर्म डंबल रो',
    'वन आर्म डम्बल रो',
    'single arm dumbel row',
  ],
  'chest-supported-dumbbell-row': [
    'इन्क्लाइन बेंच डंबल रो',
    'छाती टिकाकर रो',
    'chest support dumbel row',
  ],
  'lat-pulldown': ['लैट पुल डाउन', 'लैट मशीन', 'lat ki machine'],
  'lat-pulldown-wide-pronated-bar': [
    'वाइड ग्रिप लैट पुल डाउन',
    'चौड़ी ग्रिप पुलडाउन',
    'wide grip lat pull down',
  ],
  'lat-pulldown-close-neutral-v-handle': [
    'वी हैंडल पुलडाउन',
    'क्लोज ग्रिप वी पुल डाउन',
    'v handle pull down',
  ],
  'lat-pulldown-reverse-grip': [
    'अंडरहैंड लैट पुलडाउन',
    'रिवर्स ग्रिप लैट पुल डाउन',
    'underhand lat pull down',
  ],
  'lat-pulldown-close-neutral-ergonomic-handle': [
    'एर्गोनोमिक हैंडल पुलडाउन',
    'छोटे एर्गोनॉमिक हैंडल से पुलडाउन',
    'ergonomic handle pull down',
  ],
  'pull-up': ['पुलअप', 'पुल अप', 'pullup'],
  'assisted-pull-up': ['असिस्टेड पुलअप', 'सहारे से पुलअप', 'assisted pullup'],
  'machine-high-row': ['हाई रो मशीन', 'मशीन पर हाई रो', 'high row machine'],
  'cable-straight-arm-pulldown': [
    'स्ट्रेट आर्म पुल डाउन',
    'सीधी बाँह से केबल पुलडाउन',
    'straight arm pull down',
  ],
  'barbell-deadlift': ['डेड लिफ्ट', 'बारबेल डेड लिफ्ट', 'barbel deadlift'],
  'dumbbell-shoulder-press': [
    'डम्बल शोल्डर प्रेस',
    'डंबल मिलिट्री प्रेस',
    'dumbel shoulder press',
  ],
  'barbell-overhead-press': [
    'मिलिट्री प्रेस',
    'स्टैंडिंग बारबेल प्रेस',
    'military press',
  ],
  'machine-shoulder-press': [
    'शोल्डर प्रेस मशीन',
    'कंधे की प्रेस मशीन',
    'shoulder ki machine',
  ],
  'dumbbell-lateral-raise': [
    'साइड लेटरल रेज',
    'डंबल साइड रेज़',
    'side lateral raise',
  ],
  'cable-lateral-raise': [
    'केबल साइड रेज़',
    'सिंगल आर्म केबल लेटरल',
    'cable side raise',
  ],
  'reverse-pec-deck': ['रियर डेल्ट मशीन', 'रिवर्स बटरफ्लाई', 'rear delt machine'],
  'resistance-band-pull-apart': [
    'बैंड पुल अपार्ट',
    'इलास्टिक बैंड पुलअपार्ट',
    'band pull apart',
  ],
  'dumbbell-biceps-curl': ['डम्बल कर्ल', 'डंबल बाइसेप कर्ल', 'dumbel curl'],
  'barbell-curl': ['बारबेल बाइसेप कर्ल', 'सीधी बार कर्ल', 'barbel curl'],
  'ez-bar-curl': ['ई जेड बार कर्ल', 'ईज़ी बार बाइसेप कर्ल', 'ez curl'],
  'hammer-curl': ['हैमर कर्ल्स', 'न्यूट्रल ग्रिप डंबल कर्ल', 'hammer curls'],
  'cable-biceps-curl': ['केबल कर्ल', 'लो पुली कर्ल', 'cable curl'],
  'cable-triceps-pushdown': [
    'ट्राइसेप पुश डाउन',
    'केबल ट्राइसेप्स प्रेसडाउन',
    'tricep push down',
  ],
  'overhead-cable-triceps-extension': [
    'केबल ओवरहेड एक्सटेंशन',
    'सिर के ऊपर केबल ट्राइसेप्स',
    'overhead cable extension',
  ],
  'dumbbell-overhead-triceps-extension': [
    'ओवरहेड डम्बल एक्सटेंशन',
    'दो हाथ डंबल ट्राइसेप एक्सटेंशन',
    'dumbel overhead extension',
  ],
  'close-grip-bench-press': [
    'क्लोज ग्रिप बेंचप्रेस',
    'नैरो ग्रिप बेंच प्रेस',
    'close grip benchpress',
  ],
  'assisted-dip-machine': ['असिस्टेड डिप्स', 'डिप मशीन', 'assisted dips'],
  'barbell-back-squat': ['बारबेल स्क्वैट', 'बैक स्क्वैट', 'barbel back squat'],
  'barbell-front-squat': ['फ्रंट स्क्वैट', 'फ्रंट बारबेल स्क्वाट', 'front squat'],
  'leg-press': ['लेगप्रेस', 'पैर प्रेस मशीन', 'legpress'],
  'smith-machine-squat': ['स्मिथ स्क्वैट', 'स्मिथ मशीन पर स्क्वाट', 'smith squat'],
  'goblet-squat': ['डंबल गॉब्लेट स्क्वैट', 'डम्बल गॉबलेट स्क्वाट', 'dumbel goblet squat'],
  'kettlebell-goblet-squat': [
    'केटल बेल गॉबलेट स्क्वाट',
    'केटलबेल गॉब्लेट स्क्वैट',
    'kettle bell goblet squat',
  ],
  'dumbbell-reverse-lunge': [
    'डम्बल रिवर्स लंजेस',
    'डंबल बैक लंज',
    'dumbel reverse lunge',
  ],
  'bulgarian-split-squat': [
    'बल्गेरियन स्क्वैट',
    'रियर फुट एलिवेटेड स्प्लिट स्क्वाट',
    'bulgarian squat',
  ],
  'leg-extension': [
    'लेग एक्सटेंशन मशीन',
    'घुटने सीधे करने की मशीन',
    'leg extension machine',
  ],
  'lying-leg-curl': ['लाइंग हैमस्ट्रिंग कर्ल', 'लेटकर लेग कर्ल', 'lying hamstring curl'],
  'seated-leg-curl': [
    'सीटेड हैमस्ट्रिंग कर्ल',
    'बैठकर लेग कर्ल',
    'seated hamstring curl',
  ],
  'barbell-romanian-deadlift': [
    'बारबेल आरडीएल',
    'रोमानियन डेड लिफ्ट',
    'barbel rdl',
  ],
  'dumbbell-romanian-deadlift': [
    'डंबल आरडीएल',
    'डम्बल रोमानियन डेडलिफ्ट',
    'dumbel rdl',
  ],
  'barbell-hip-thrust': ['हिपथ्रस्ट', 'बारबेल हिपथ्रस्ट', 'barbel hip thrust'],
  'cable-glute-kickback': ['ग्लूट किक बैक', 'एंकल केबल किकबैक', 'cable kick back'],
  'standing-calf-raise': [
    'खड़े होकर काफ रेज',
    'स्टैंडिंग कैल्फ रेज़',
    'standing calf raise',
  ],
  'seated-calf-raise': ['बैठकर काफ रेज', 'सीटेड कैल्फ रेज़', 'seated calf raise'],
  'machine-hip-adduction': [
    'इनर थाई मशीन',
    'हिप एडडक्टर मशीन',
    'inner thigh machine',
  ],
  'kettlebell-swing': ['केटल बेल स्विंग', 'दो हाथ केटलबेल स्विंग', 'kettle bell swing'],
  plank: ['फोरआर्म प्लैंक', 'एल्बो प्लैंक', 'elbow plank'],
  'captains-chair-knee-raise': [
    'कैप्टन चेयर नी रेज',
    'वर्टिकल नी रेज़',
    'captain chair knee raise',
  ],
  'hanging-straight-leg-raise': [
    'हैंगिंग लेग रेज',
    'लटककर सीधे पैर उठाना',
    'hanging leg raise',
  ],
  'hanging-knee-raise': ['हैंगिंग नी रेज', 'लटककर घुटने उठाना', 'hanging knee raise'],
  'cable-crunch': ['केबल क्रंचेस', 'पुली क्रंच', 'cable crunches'],
  'back-extension': ['हाइपरएक्सटेंशन', 'बैक एक्सटेंशन बेंच', 'hyperextension'],
  'dumbbell-shrug': ['डम्बल श्रग्स', 'डंबल शोल्डर श्रग', 'dumbel shrugs'],
  'farmers-carry': ['फार्मर वॉक', 'फार्मर्स वॉक', 'farmer walk'],
  'standing-cable-anti-rotation-press': [
    'पैलॉफ प्रेस',
    'केबल पैलॉफ प्रेस',
    'pallof press',
  ],
  'bodyweight-step-up': [
    'बिना वजन स्टेप अप',
    'बॉडीवेट स्टेप अप',
    'bina weight step up',
  ],
  'dumbbell-floor-glute-bridge': [
    'डंबल ग्लूट ब्रिज',
    'फर्श पर डंबल ब्रिज',
    'dumbel glute bridge',
  ],
  'lying-barbell-triceps-extension': [
    'स्कल क्रशर',
    'लेटकर बारबेल ट्राइसेप एक्सटेंशन',
    'skull crusher',
  ],
} satisfies Record<ExerciseId, readonly string[]>;
