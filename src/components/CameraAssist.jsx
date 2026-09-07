import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { t } from '../i18n/strings';
import './CameraAssist.css';

const ALERT_CLASSES = new Set(['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle']);
const ALERT_COOLDOWN_MS = 5000;

export default function CameraAssist({ language = 'roman' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
  const timerRef = useRef(null);
  const lastAlertRef = useRef({ label: '', at: 0 });
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('idle');
  const [lastDetection, setLastDetection] = useState(null);

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    if (active) {
      stopCamera();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    try {
      setStatus('loading');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      modelRef.current ??= await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      setActive(true);
      setStatus('ready');
      timerRef.current = window.setInterval(detectFrame, 900);
    } catch (error) {
      stopCamera();
      setStatus(error.name === 'NotAllowedError' ? 'permission' : 'error');
    }
  }

  function stopCamera() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setLastDetection(null);
    setStatus('idle');
  }

  async function detectFrame() {
    if (!modelRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
    const predictions = await modelRef.current.detect(videoRef.current, 10, 0.58);
    const detected = predictions
      .filter((prediction) => ALERT_CLASSES.has(prediction.class))
      .sort((first, second) => second.score - first.score)[0];
    if (!detected) return;

    const [left, , width] = detected.bbox;
    const frameWidth = videoRef.current.videoWidth || 1;
    const horizontal = (left + width / 2) / frameWidth;
    const zone = horizontal < 0.34 ? 'left' : horizontal > 0.66 ? 'right' : 'ahead';
    const label = `${detected.class}:${zone}`;
    setLastDetection({ name: detected.class, zone });

    const now = Date.now();
    if (lastAlertRef.current.label === label && now - lastAlertRef.current.at < ALERT_COOLDOWN_MS) return;
    lastAlertRef.current = { label, at: now };
    speakAlert(detected.class, zone, language);
  }

  const zoneLabel = (zone) =>
    zone === 'left' ? t(language, 'cameraAssistZoneLeft')
    : zone === 'right' ? t(language, 'cameraAssistZoneRight')
    : t(language, 'cameraAssistZoneAhead');

  return (
    <section className={`camera-assist ${active ? 'is-active' : ''}`}>
      <div className="camera-assist__header">
        <div>
          <p className="camera-assist__eyebrow">{t(language, 'cameraAssistEyebrow')}</p>
          <h3>{t(language, 'cameraAssistTitle')}</h3>
        </div>
        <button className="camera-assist__toggle" onClick={startCamera} type="button">
          {active ? t(language, 'cameraAssistStop') : t(language, 'cameraAssistStart')}
        </button>
      </div>
      {active && <video className="camera-assist__video" ref={videoRef} muted playsInline />}
      {status === 'loading' && <p className="camera-assist__status">{t(language, 'cameraAssistLoading')}</p>}
      {status === 'permission' && <p className="camera-assist__status">{t(language, 'cameraAssistPermission')}</p>}
      {status === 'unsupported' && <p className="camera-assist__status">{t(language, 'cameraAssistUnsupported')}</p>}
      {active && lastDetection && (
        <p className="camera-assist__detection">
          {t(language, 'cameraAssistDetected', { name: lastDetection.name, zone: zoneLabel(lastDetection.zone) })}
        </p>
      )}
      <p className="camera-assist__note">{t(language, 'cameraAssistNote')}</p>
    </section>
  );
}

function speakAlert(objectName, zone, language) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const text = language === 'ur'
    ? `${objectName} ${zone === 'ahead' ? 'آگے' : zone === 'left' ? 'بائیں' : 'دائیں'} ہے`
    : language === 'roman'
      ? `${objectName} ${zone === 'ahead' ? 'aagay' : zone === 'left' ? 'baen' : 'daen'} hai`
      : `${objectName} ${zone}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-PK' : 'ur-PK';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
