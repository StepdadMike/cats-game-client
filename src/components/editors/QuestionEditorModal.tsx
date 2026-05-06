import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { GridCell, Question, QuestionType } from '../../types';
import { QUESTION_TYPE_LABELS, QUESTION_DEFAULT_TIME } from '../../types';
import MultipleChoiceEditor from './MultipleChoiceEditor';
import GuessWavesEditor from './GuessWavesEditor';
import GuessImageEditor from './GuessImageEditor';
import GuessAudioEditor from './GuessAudioEditor';
import DrawThisEditor from './DrawThisEditor';
import EitherOrEditor from './EitherOrEditor';
import MemefyEditor from './MemefyEditor';
import OddOneOutEditor from './OddOneOutEditor';
import TimelineEditor from './TimelineEditor';

interface Props {
  cell: GridCell;
  initialType: QuestionType;
  points: number;
  onSave: (question: Question | null) => void;
  onClose: () => void;
}

export default function QuestionEditorModal({ cell, initialType, points, onSave, onClose }: Props) {
  const [type, setType] = useState<QuestionType>(cell.question?.type ?? initialType);
  const [prompt, setPrompt] = useState(cell.question?.prompt ?? '');
  const [timeLimit, setTimeLimit] = useState(cell.question?.timeLimit ?? QUESTION_DEFAULT_TIME[initialType]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [typeData, setTypeData] = useState<Record<string, any>>(cell.question ?? {});

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    setTimeLimit(QUESTION_DEFAULT_TIME[newType]);
    setTypeData({});
  };

  const handleSave = () => {
    const base = { id: cell.question?.id ?? uuidv4(), type, prompt, timeLimit, points };
    let question: Question;

    switch (type) {
      case 'multiple-choice':
        question = {
          ...base, type: 'multiple-choice',
          options: (typeData as any).options ?? ['', '', '', ''],
          correctAnswer: (typeData as any).correctAnswer ?? 0,
          imageUrl: (typeData as any).imageUrl || undefined,
        };
        break;
      case 'guess-waves':
        question = {
          ...base, type: 'guess-waves',
          hints: (typeData as any).hints ?? [],
          correctAnswer: (typeData as any).correctAnswer ?? '',
        };
        break;
      case 'guess-image':
        question = {
          ...base, type: 'guess-image',
          imageUrl: (typeData as any).imageUrl ?? '',
          correctAnswer: (typeData as any).correctAnswer ?? '',
        };
        break;
      case 'guess-audio':
        question = {
          ...base, type: 'guess-audio',
          audioUrl: (typeData as any).audioUrl ?? '',
          correctAnswer: (typeData as any).correctAnswer ?? '',
        };
        break;
      case 'draw-this':
        question = { ...base, type: 'draw-this' };
        break;
      case 'either-or':
        question = {
          ...base, type: 'either-or',
          optionA: (typeData as any).optionA ?? '',
          optionB: (typeData as any).optionB ?? '',
          correctAnswer: (typeData as any).correctAnswer ?? 'A',
        };
        break;
      case 'memefy':
        question = {
          ...base, type: 'memefy',
          imageUrl: (typeData as any).imageUrl ?? '',
        };
        break;
      case 'odd-one-out':
        question = {
          ...base, type: 'odd-one-out',
          oddPrompt: (typeData as any).oddPrompt ?? '',
        };
        break;
      case 'timeline':
        question = {
          ...base, type: 'timeline',
          events: (typeData as any).events ?? [],
        };
        break;
      default:
        return;
    }

    onSave(question);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateTypeData = (data: Record<string, any>) => setTypeData((prev: Record<string, any>) => ({ ...prev, ...data }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal question-editor-modal">
        <div className="modal-header">
          <h2>Edit Question — {points} pts</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Type selector */}
        <div className="editor-type-selector">
          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(t => (
            <button
              key={t}
              className={`type-btn ${type === t ? 'active' : ''}`}
              onClick={() => handleTypeChange(t)}
            >
              {QUESTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Common fields */}
        <div className="editor-fields">
          <label className="field-label">
            Prompt / Question
            <textarea
              className="input editor-prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter the question or prompt…"
              rows={3}
            />
          </label>

          <label className="field-label field-label--inline">
            Time limit (seconds)
            <input
              type="number"
              className="input input--sm"
              min={5}
              max={300}
              value={timeLimit}
              onChange={e => setTimeLimit(Number(e.target.value))}
            />
          </label>
        </div>

        {/* Type-specific fields */}
        <div className="editor-type-fields">
          {type === 'multiple-choice' && (
            <MultipleChoiceEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'guess-waves' && (
            <GuessWavesEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'guess-image' && (
            <GuessImageEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'guess-audio' && (
            <GuessAudioEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'draw-this' && (
            <DrawThisEditor />
          )}
          {type === 'either-or' && (
            <EitherOrEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'memefy' && (
            <MemefyEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'odd-one-out' && (
            <OddOneOutEditor data={typeData as any} onChange={updateTypeData} />
          )}
          {type === 'timeline' && (
            <TimelineEditor data={typeData as any} onChange={updateTypeData} />
          )}
        </div>

        <div className="editor-actions">
          {cell.question && (
            <button className="btn btn--danger-ghost" onClick={() => onSave(null)}>
              Remove Question
            </button>
          )}
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary btn--lg" onClick={handleSave} disabled={!prompt.trim()}>
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
