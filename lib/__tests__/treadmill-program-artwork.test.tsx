import { Image } from 'react-native';
import { BrandWordmark } from '@/components/BrandWordmark';
import { ExerciseCharacterProvider } from '@/components/ExerciseCharacterProvider';
import { ProgramTimedActivities } from '@/components/StarterProgramReview';
import type { CardioGuidance } from '../training-programs/model';
import type { AssetModel } from '../exercise-variant-model';

const { act, create } = jest.requireActual('react-test-renderer');

jest.mock(
  '../../assets/exercises/treadmill-walking/male/start.webp',
  () => 101,
);
jest.mock(
  '../../assets/exercises/treadmill-walking/female/start.webp',
  () => 102,
);

function activity(model: AssetModel, activity: CardioGuidance['activity']) {
  return (
    <ExerciseCharacterProvider
      value={{ model, saving: false, error: false, disabled: false }}
    >
      <ProgramTimedActivities
        cardio={{ activity, offset: 0, minutes: 25, intensity: 'moderate' }}
      />
    </ExerciseCharacterProvider>
  );
}

it('switches the treadmill image with the character and keeps the wordmark separate', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(activity('male', 'treadmill_walking'));
  });
  try {
    expect(view.root.findByType(Image).props.source).toBe(101);
    expect(view.root.findByType(BrandWordmark)).toBeDefined();
    await act(async () => view.update(activity('female', 'treadmill_walking')));
    expect(view.root.findByType(Image).props.source).toBe(102);
    expect(view.root.findByType(BrandWordmark)).toBeDefined();
    await act(async () => view.update(activity('female', 'stationary_bike')));
    expect(view.root.findAllByType(Image)).toHaveLength(0);
    expect(view.root.findAllByType(BrandWordmark)).toHaveLength(0);
  } finally {
    await act(async () => view.unmount());
  }
});
