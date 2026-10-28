import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Check, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { analyzeClinicalEnglish, applySingleIssue, applyAllIssuesToText } from '../services/grammarlyAnalysisEngine';
import { localRefineClinicalText } from '../hooks/useClinicalAutoRefine';
import { api } from '../services/api';

/**
 * AI Clinical English Grammar Assistant
 * Powered by PetCare AI Model (trained on petcare_grammar_ai dataset)
 * 
 * Provides live linguistic analysis, correctness checks,
 * medical terminology enhancements, and 1-click fixes for Chief Complaint & Clinical Signs.
 */
export default function GrammarlyEnglishAssistant({
  text = '',
  onApplyText,
  isRefining = false,
  onExternalRefine
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [justFixedAll, setJustFixedAll] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);

  // Compute live Grammarly metrics & actionable cards
  const analysis = useMemo(() => {
    return analyzeClinicalEnglish(text);
  }, [text]);

  // Filter out any dismissed issues
  const activeIssues = useMemo(() => {
    return analysis.issues.filter(issue => !dismissedIds.has(issue.id));
  }, [analysis.issues, dismissedIds]);

  // Reset dismissed IDs when text changes substantially
  useEffect(() => {
    if (!text || text.trim().length === 0) {
      setDismissedIds(new Set());
    }
  }, [text]);

  const handleAcceptIssue = (issue) => {
    if (!onApplyText) return;
    const newText = applySingleIssue(text, issue);
    onApplyText(newText);
    setDismissedIds(prev => new Set(prev).add(issue.id));
  };

  const handleDismissIssue = (issueId) => {
    setDismissedIds(prev => new Set(prev).add(issueId));
  };

  const handleFixAll = () => {
    if (!onApplyText || activeIssues.length === 0) return;
    const refined = applyAllIssuesToText(text, activeIssues);
    onApplyText(refined);
    setJustFixedAll(true);
    setTimeout(() => setJustFixedAll(false), 2500);
    setIsExpanded(false);
  };

  const handleAiRefine = async () => {
    if (!text || !text.trim() || !onApplyText) return;
    setIsAiRefining(true);
    try {
      let refined = null;

      // 1. First check backend AI refine endpoint
      try {
        const res = await api.ai.refineText({ text: text.trim(), fieldType: 'symptoms' });
        if (res && res.refinedText && res.refinedText.trim()) {
          refined = res.refinedText.trim();
        }
      } catch (err) {
        console.warn('Backend autocorrect fallback to local engine:', err);
      }

      // 2. Training dataset & spelling engine fallback (Tier 1)
      if (!refined) {
        refined = localRefineClinicalText(text.trim(), 'symptoms');
      }

      if (refined) {
        onApplyText(refined);
        setJustFixedAll(true);
        setTimeout(() => setJustFixedAll(false), 2500);
      }
    } catch (err) {
      console.warn('PetCare AI Refine error:', err);
      if (onExternalRefine) onExternalRefine();
    } finally {
      setIsAiRefining(false);
    }
  };

  // If text is empty or very short, show quiet readiness badge
  if (!text || text.trim().length < 3) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '6px',
        padding: '6px 12px',
        background: '#F0FDF4',
        border: '1px solid #DCFCE7',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#166534'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '800'
          }}>
            🐾
          </div>
          <span style={{ fontWeight: '600' }}>AI Grammar Assistant</span>
          <span style={{ color: '#065F46', fontSize: '11px', background: '#D1FAE5', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
            petcare-grammar-ai
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#15803D' }}>Type to begin grammar correction</span>
      </div>
    );
  }

  // Determine score color
  const scoreColor = analysis.score >= 90 ? '#10B981' : analysis.score >= 75 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{
      marginTop: '8px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'linear-gradient(to right, #F8FAFC, #F1F5F9)',
        borderBottom: isExpanded && activeIssues.length > 0 ? '1px solid #E2E8F0' : 'none',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Left: Brand & Score Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800',
            boxShadow: '0 2px 4px rgba(16,185,129,0.3)'
          }}>
            🐾
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A' }}>
                AI Grammar Assistant
              </span>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '700',
                padding: '1px 6px',
                borderRadius: '4px',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0'
              }}>
                PetCare AI
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '12px',
                background: `${scoreColor}15`,
                color: scoreColor,
                border: `1px solid ${scoreColor}30`
              }}>
                {analysis.score}/100 • {analysis.scoreLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Issue Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600' }}>
          {analysis.categories.correctness > 0 && (
            <span style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              padding: '2px 8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></span>
              {analysis.categories.correctness} Correctness
            </span>
          )}

          {analysis.categories.clarity > 0 && (
            <span style={{
              background: '#DBEAFE',
              color: '#1D4ED8',
              padding: '2px 8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
              {analysis.categories.clarity} Clarity
            </span>
          )}

          {analysis.categories.delivery > 0 && (
            <span style={{
              background: '#F3E8FF',
              color: '#7E22CE',
              padding: '2px 8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A855F7' }}></span>
              {analysis.categories.delivery} Terminology
            </span>
          )}

          {activeIssues.length === 0 && (
            <span style={{
              background: '#DCFCE7',
              color: '#15803D',
              padding: '2px 8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Check size={11} /> Clear Clinical English
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleAiRefine}
            disabled={isAiRefining || !text.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: isAiRefining ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(5,150,105,0.3)',
              transition: 'all 0.15s ease'
            }}
            title="Refine using trained PetCare AI Model"
          >
            <Sparkles size={11} />
            <span>{isAiRefining ? 'Refining...' : 'PetCare AI Refine'}</span>
          </button>

          {activeIssues.length > 0 && (
            <button
              type="button"
              onClick={handleFixAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                background: 'linear-gradient(135deg, #15C39A 0%, #0D9488 100%)',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(21,195,154,0.3)',
                transition: 'all 0.15s ease'
              }}
              title="Apply all grammar corrections"
            >
              <Check size={12} />
              Fix All ({activeIssues.length})
            </button>
          )}

          {activeIssues.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <span>{isExpanded ? 'Hide' : 'Review'}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>


      {/* Just Fixed All Banner */}
      {justFixedAll && (
        <div style={{
          padding: '6px 12px',
          background: '#ECFDF5',
          borderBottom: '1px solid #A7F3D0',
          fontSize: '12px',
          color: '#065F46',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Check size={14} color="#059669" />
          <span><strong>All Grammarly corrections applied!</strong> Text is now polished into clinical English.</span>
        </div>
      )}

      {/* Expanded Review Drawer with Actionable Cards */}
      {isExpanded && activeIssues.length > 0 && (
        <div style={{
          padding: '10px 12px',
          background: '#FAFAFA',
          maxHeight: '220px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {activeIssues.map(issue => {
            const catBg = issue.category === 'correctness' ? '#FEE2E2' : issue.category === 'clarity' ? '#DBEAFE' : '#F3E8FF';
            const catColor = issue.category === 'correctness' ? '#B91C1C' : issue.category === 'clarity' ? '#1D4ED8' : '#7E22CE';

            return (
              <div
                key={issue.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  {/* Category & Diff */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: catBg,
                      color: catColor
                    }}>
                      {issue.categoryLabel || issue.category}
                    </span>

                    <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#EF4444', fontWeight: '500' }}>
                      {issue.original}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>➔</span>
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700', background: '#ECFDF5', padding: '1px 5px', borderRadius: '4px' }}>
                      {issue.replacement}
                    </span>
                  </div>

                  {/* Explanation */}
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: '1.4' }}>
                    {issue.explanation}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleAcceptIssue(issue)}
                    style={{
                      padding: '4px 10px',
                      background: '#15C39A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDismissIssue(issue.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      color: '#94A3B8',
                      border: 'none',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
