import { Profile } from './storage';

export function calculateBMR(profile: Profile, weightKg: number): number {
  const s = profile.gender === 'male' ? 5 : -161;
  return Math.round(
    10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age + s,
  );
}
