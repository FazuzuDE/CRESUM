import { createContext, useContext } from 'react';
import type { AssetModel } from '@/lib/exercise-variant-model';

type CharacterPreference = {
  model: AssetModel;
  saving: boolean;
  error: boolean;
  disabled: boolean;
  select?: (model: AssetModel) => Promise<void>;
  retry?: () => Promise<void>;
};

const Context = createContext<CharacterPreference>({
  model: 'male',
  saving: false,
  error: false,
  disabled: true,
});

export const ExerciseCharacterProvider = Context.Provider;
export const useExerciseCharacter = () => useContext(Context);
