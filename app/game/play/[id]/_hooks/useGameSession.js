'use client';

import { useEffect, useState } from 'react';
import { generateQuestionsForLevel, getLevelDefinitions } from '../../../../../utils/generateQuestions';

/**
 * Owns the asynchronous level-loading lifecycle: looking up the level
 * definition, generating AI questions, and exposing
 * `loading` / `error` / `level` / `questions` / `generatingQuestions`.
 *
 * The page is responsible for resetting gameplay state when `level`/`questions`
 * change (it knows the difficulty-derived timer config etc.), so this hook
 * intentionally stays focused on the data-load concern.
 */
export function useGameSession({ levelId, userId, isAdmin }) {
  const [loading, setLoading] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(true);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (isAdmin) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const levelDefinitions = getLevelDefinitions();
        const currentLevel = levelDefinitions.find((l) => l.id === levelId);

        if (!currentLevel) throw new Error(`Level with ID ${levelId} not found`);
        if (cancelled) return;
        setLevel(currentLevel);

        if (userId) {
          localStorage.setItem(`lastPlayedLevel_${userId}`, levelId.toString());
        }

        // Touch the progress endpoint so admins-only checks remain consistent
        // with the previous behavior. The result was previously discarded too.
        if (userId) {
          try {
            await fetch('/api/progress');
          } catch {
            // Network failure here shouldn't block question generation.
          }
        }

        setGeneratingQuestions(true);
        const generated = await generateQuestionsForLevel(levelId);
        if (cancelled) return;
        setQuestions(generated);
        setGeneratingQuestions(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading level:', err);
          setError(`Failed to load level: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [levelId, userId, isAdmin]);

  return { loading, generatingQuestions, error, level, questions };
}
