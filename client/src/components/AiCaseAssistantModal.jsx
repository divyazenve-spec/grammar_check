import React, { useState, useRef, useCallback } from 'react';
import { X, Sparkles, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { localRefineClinicalText } from '../hooks/useClinicalAutoRefine';

export function AiCaseAssistantModal({ isOpen, onClose, onInsertCase }) {
  const [species, setSpecies] = useState('Canine');
  const [symptoms, setSymptoms] = useState('');
  const [vitals, setVitals] = useState('');
  const [isAutocorrecting, setIsAutocorrecting] = useState(false);
  const [autocorrectDone, setAutocorrectDone] = useState(false);
  const textareaRef = useRef(null);

  // Autocorrection using training datasets & spelling rectification when arrow button is clicked
  const handleAutocorrectSymptoms = useCallback(async () => {
    if (!symptoms || !symptoms.trim() || isAutocorrecting) return;
    const rawInput = symptoms.trim();
    setIsAutocorrecting(true);

    try {
      let corrected = null;

      // 1. First check backend AI refine endpoint (backed by trained PetCare model)
      try {
        const res = await api.ai.refineText({ text: rawInput, fieldType: 'symptoms' });
        if (res && res.refinedText && res.refinedText.trim().length > 0) {
          corrected = res.refinedText.trim();
        }
      } catch (err) {
        console.warn('Backend autocorrect fallback:', err);
      }

      // 2. Training dataset & spelling engine fallback
      if (!corrected) {
        corrected = localRefineClinicalText(rawInput, 'symptoms');
      }

      if (corrected) {
        setSymptoms(corrected);
        setAutocorrectDone(true);
        setTimeout(() => setAutocorrectDone(false), 3000);
      }
    } finally {
      setIsAutocorrecting(false);
    }
  }, [symptoms, isAutocorrecting]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #093721 0%, #0D472B 100%)', color: '#FFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#F8E2AF" />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#FFF', fontSize: '18px' }}>AI Clinical Case Assistant</h3>
              <p style={{ fontSize: '12px', color: '#C8DEC9' }}>AI clinical shorthand refinement & autocorrection with PetCare AI</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} style={{ color: '#FFF' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Patient Species Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#121A15' }}>
              Patient Species & Signalment
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Canine', 'Feline', 'Equine', 'Bovine', 'Avian/Exotic'].map(sp => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecies(sp)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: species === sp ? '#0D472B' : '#E5E9E5',
                    background: species === sp ? '#E8F3ED' : '#FFFFFF',
                    color: species === sp ? '#0D472B' : '#64726A',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Chief Complaint & Clinical Signs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#121A15', margin: 0 }}>
                  Chief Complaint & Clinical Signs *
                </label>
                <span style={{ fontSize: '11px', color: '#64726A' }}>
                  (Click <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle', color: '#0D472B' }} /> to autocorrect)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isAutocorrecting && (
                  <span style={{ fontSize: '11px', color: '#0D472B', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Loader2 size={11} className="animate-spin" /> Autocorrecting...
                  </span>
                )}
                {autocorrectDone && (
                  <span style={{ fontSize: '11px', color: '#0D472B', fontWeight: '600', background: '#E8F3ED', padding: '2px 8px', borderRadius: '4px' }}>
                    ✓ Autocorrected with PetCare AI
                  </span>
                )}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                rows="3"
                className="custom-filter-select"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  paddingRight: '48px',
                  paddingBottom: '12px',
                  borderColor: autocorrectDone ? '#10B981' : undefined,
                  boxShadow: autocorrectDone ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : undefined,
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                placeholder="e.g. cat not eating from yesterday and vomit 3 times..."
                value={symptoms}
                onChange={(e) => {
                  setSymptoms(e.target.value);
                  if (autocorrectDone) setAutocorrectDone(false);
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleAutocorrectSymptoms();
                  }
                }}
                spellCheck="true"
              />

              {/* Corner Arrow Sign Autocorrect Button */}
              <button
                type="button"
                onClick={handleAutocorrectSymptoms}
                disabled={isAutocorrecting || !symptoms.trim()}
                title="Autocorrect with PetCare AI dataset (Click arrow button)"
                aria-label="Autocorrect complaint with arrow button"
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: symptoms.trim()
                    ? 'linear-gradient(135deg, #0D472B 0%, #15C39A 100%)'
                    : '#E5E7EB',
                  color: symptoms.trim() ? '#FFFFFF' : '#9CA3AF',
                  cursor: symptoms.trim() && !isAutocorrecting ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: symptoms.trim() ? '0 2px 6px rgba(13, 71, 43, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  zIndex: 3
                }}
              >
                {isAutocorrecting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={17} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Physical Exam & Vitals (Optional) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#121A15' }}>
                Physical Exam & Vitals (Optional)
              </label>
            </div>
            <input
              type="text"
              className="custom-filter-select"
              style={{ width: '100%', fontSize: '13.5px' }}
              placeholder="e.g. HR 175 bpm weak femoral pulses CRT > 2.5s..."
              value={vitals}
              onChange={(e) => setVitals(e.target.value)}
            />
          </div>

          {/* Clinical Disclaimer */}
          <div style={{ padding: '10px 12px', background: '#F8F9FA', borderRadius: '6px', border: '1px solid #E5E9E5', fontSize: '11.5px', color: '#64726A', display: 'flex', gap: '6px', marginTop: '12px' }}>
            <AlertCircle size={15} color="#C5A059" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>AI Case Assistant assists in formatting and autocorrecting patient clinical records with PetCare AI. Final clinical judgment remains with the attending veterinarian.</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E9E5', display: 'flex', gap: '10px', background: '#FFFFFF' }}>
          <button
            type="button"
            className="btn-create-profile"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onClose}
          >
            <span>Close</span>
          </button>
          <button
            type="button"
            className="btn-submit-post"
            style={{ flex: 2, justifyContent: 'center' }}
            onClick={() => {
              onClose();
              if (onInsertCase && symptoms.trim()) {
                const caseText = vitals.trim()
                  ? `[AI Case] ${species}: ${symptoms.trim()} | Vitals: ${vitals.trim()}`
                  : `[AI Case] ${species}: ${symptoms.trim()}`;
                onInsertCase(caseText);
              }
            }}
            disabled={!symptoms.trim()}
          >
            <span>Share Case to Feed</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
