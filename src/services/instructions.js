// Turns a route step + its top-ranked landmark into a natural Urdu instruction.
// Primary path: Groq-hosted Llama via the backend (fast, natural Roman Urdu).
// Fallback: rule-based template — keeps the demo working even if Groq is down
// or rate-limited, which matters a lot when you're on stage.
//
// Every instruction carries `urdu` (Roman, for on-screen reading) AND `native`
// (Urdu script, for TTS) — Edge TTS's Urdu voices produce near-silent/garbled
// audio when fed Roman Urdu text, so `native` is what actually gets spoken.

const API_BASE = import.meta.env.VITE_API_BASE || '';

const MODIFIER_URDU = {
  left: 'left',
  right: 'right',
  'slight left': 'thora left',
  'slight right': 'thora right',
  'sharp left': 'tez left',
  'sharp right': 'tez right',
  straight: 'seedha',
  uturn: 'U-turn',
};

const MODIFIER_NATIVE = {
  left: 'بائیں',
  right: 'دائیں',
  'slight left': 'ہلکا بائیں',
  'slight right': 'ہلکا دائیں',
  'sharp left': 'تیز بائیں',
  'sharp right': 'تیز دائیں',
  straight: 'سیدھا',
  uturn: 'یو ٹرن',
};

const CATEGORY_LABEL = {
  mosque: 'masjid',
  petrol_pump: 'petrol pump',
  hospital: 'hospital',
  market: 'market',
  bank: 'bank',
  school: 'school',
  park: 'park',
  landmark: 'jagah',
};

const CATEGORY_NATIVE = {
  mosque: 'مسجد',
  petrol_pump: 'پٹرول پمپ',
  hospital: 'ہسپتال',
  market: 'مارکیٹ',
  bank: 'بینک',
  school: 'اسکول',
  park: 'پارک',
  landmark: 'جگہ',
};

export async function generateInstruction(step, landmark) {
  if (step.instructionType === 'depart') {
    return { urdu: 'Seedha chalein.', native: 'سیدھا چلیں۔', english: 'Go straight.' };
  }
  if (step.instructionType === 'arrive') {
    return {
      urdu: landmark
        ? `${landmark.name} ke qareeb, aap manzil par pohanch chuke hain.`
        : 'Aap apni manzil par pohanch chuke hain.',
      native: landmark
        ? `${landmark.name} کے قریب، آپ منزل پر پہنچ چکے ہیں۔`
        : 'آپ اپنی منزل پر پہنچ چکے ہیں۔',
      english: 'You have arrived at your destination.',
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/generate-instruction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, landmark }),
    });
    if (!res.ok) throw new Error('LLM instruction request failed');
    const data = await res.json();
    if (data.urdu && data.native && data.english) return data;
    throw new Error('Malformed LLM response');
  } catch (err) {
    console.warn('Falling back to rule-based instruction:', err.message);
    return ruleBasedInstruction(step, landmark);
  }
}

function ruleBasedInstruction(step, landmark) {
  const modifierWord = MODIFIER_URDU[step.modifier] ?? 'aage';
  const modifierNative = MODIFIER_NATIVE[step.modifier] ?? 'آگے';

  if (!landmark) {
    const meters = Math.round(step.distanceMeters);
    return {
      urdu: `${meters} meter aage ${modifierWord} lein.`,
      native: `${meters} میٹر آگے ${modifierNative} مڑیں۔`,
      english: `In ${meters} meters, turn ${step.modifier}.`,
    };
  }

  const categoryLabel = CATEGORY_LABEL[landmark.category] ?? landmark.name;
  const categoryNative = CATEGORY_NATIVE[landmark.category] ?? landmark.name;
  const urdu =
    step.modifier === 'straight'
      ? `${landmark.name} (${categoryLabel}) ke paas se seedha chalein.`
      : `${landmark.name} (${categoryLabel}) ke baad ${modifierWord} lein.`;
  const native =
    step.modifier === 'straight'
      ? `${landmark.name} (${categoryNative}) کے پاس سے سیدھا چلیں۔`
      : `${landmark.name} (${categoryNative}) کے بعد ${modifierNative} مڑیں۔`;
  const english =
    step.modifier === 'straight'
      ? `Continue straight past ${landmark.name}.`
      : `Turn ${step.modifier} after ${landmark.name}.`;

  return { urdu, native, english };
}
