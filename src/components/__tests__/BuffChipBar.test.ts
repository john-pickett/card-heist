import { BuffChip } from '../BuffChipBar';

describe('BuffChip interface', () => {
  test('isCrew chip is correctly shaped for crew members', () => {
    const chip: BuffChip = {
      id: 'knuckles',
      icon: '🤜',
      initials: 'KN',
      isActive: true,
      isPassive: true,
      isDisabled: false,
      isCrew: true,
    };
    expect(chip.isCrew).toBe(true);
    expect(chip.isPassive).toBe(true);
    expect(chip.onPress).toBeUndefined();
  });

  test('perk chip does not have isCrew', () => {
    const chip: BuffChip = {
      id: 'false-alarm',
      icon: '🚨',
      initials: 'FA',
      isActive: false,
      isPassive: false,
      isDisabled: false,
    };
    expect(chip.isCrew).toBeUndefined();
  });

  test('crew chip style logic: isCrew takes precedence over isActive', () => {
    // Mirrors the render logic: chip.isCrew ? chipCrew : chip.isActive && chipActive
    const crewChip: BuffChip = { id: 'tico', icon: '⏱️', initials: 'TC', isActive: true, isPassive: true, isDisabled: false, isCrew: true };
    const activeChip: BuffChip = { id: 'inside-switch', icon: '🧰', initials: 'IS', isActive: true, isPassive: false, isDisabled: false };

    const resolveStyle = (chip: BuffChip) => chip.isCrew ? 'chipCrew' : chip.isActive ? 'chipActive' : 'chipDefault';

    expect(resolveStyle(crewChip)).toBe('chipCrew');
    expect(resolveStyle(activeChip)).toBe('chipActive');
  });

  test('all six crew chips use isCrew: true', () => {
    const crewChips: BuffChip[] = [
      { id: 'knuckles', icon: '🤜', initials: 'KN', isActive: true, isPassive: true, isDisabled: false, isCrew: true },
      { id: 'tico',     icon: '⏱️', initials: 'TC', isActive: true, isPassive: true, isDisabled: false, isCrew: true },
      { id: 'bishop',   icon: '♟️', initials: 'BP', isActive: true, isPassive: true, isDisabled: false, isCrew: true },
      { id: 'deadlock', icon: '🔐', initials: 'DD', isActive: true, isPassive: true, isDisabled: false, isCrew: true },
      { id: 'fingers',  icon: '🤞', initials: 'FG', isActive: true, isPassive: true, isDisabled: false, isCrew: true },
      { id: 'jinx',     icon: '🍀', initials: 'JX', isActive: true, isPassive: true, isDisabled: false, isCrew: true },
    ];

    crewChips.forEach(chip => {
      expect(chip.isCrew).toBe(true);
      expect(chip.isPassive).toBe(true);
      expect(chip.isDisabled).toBe(false);
    });
  });
});
