import { Profile } from './storage';

export function calculateBMR(profile: Profile, weightKg: number): number {
  const birth = new Date(profile.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  const s = profile.gender === 'm' ? 5 : -161;
  return Math.round(
    10 * weightKg + 6.25 * profile.heightCm - 5 * age + s,
  );
}
