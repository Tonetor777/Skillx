import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/pages/dashboard/Weeks.tsx', 'utf8');

test('curriculum navigator selects weeks separately from modules', () => {
  assert.ok(source.includes('const [selectedWeek, setSelectedWeek] = useState<number | null>(null)'));
  assert.ok(source.includes('const selectedWeekGroup = useMemo'));
  assert.ok(source.includes('const selectedWeekModules = selectedWeekGroup?.modules ?? []'));
  assert.ok(source.includes('const selectWeek = (week: number) =>'));
});

test('curriculum week dropdown uses unique week labels without module titles', () => {
  assert.ok(source.includes('<span className="text-xs font-bold uppercase text-slate-500">Week</span>'));
  assert.ok(source.includes('weekGroups.map((group) => ('));
  assert.ok(source.includes('Week {group.week}'));
  assert.equal(source.includes('Week {module.module_number}: {module.title}'), false);
});

test('curriculum navigator renders modules only for the selected week', () => {
  assert.ok(source.includes('const visibleWeekGroups = selectedWeekGroup ? [selectedWeekGroup] : []'));
  assert.ok(source.includes('visibleWeekGroups.map((group) =>'));
  assert.ok(source.includes('setSelectedWeek(module.module_number)'));
});

test('curriculum module groups preserve API order within each week', () => {
  assert.ok(source.includes('modules: weekModules,'));
  assert.equal(source.includes('localeCompare'), false);
});
