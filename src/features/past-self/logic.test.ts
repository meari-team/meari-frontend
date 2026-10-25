import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendToLatest,
  availabilityHint,
  dayPosition,
  defaultAnchor,
  dotState,
  flattenPages,
  lastConfirmedOnOrBefore,
  pastSelfTitle,
  recentSessionsView,
  relativeTime,
  selfBarLine,
  timelineMonths,
} from './logic.ts';

describe('past-self logic', () => {
  it('대화 제목', () => {
    assert.equal(pastSelfTitle('2026-09-04'), '9월 4일까지의 나');
  });

  it('7일 미만 안내', () => {
    assert.equal(availabilityHint(7, 7), null);
    assert.equal(
      availabilityHint(3, 7),
      '기록이 7일 이상 쌓이면 대화할 수 있어요 (3/7)',
    );
  });

  it('페이지를 오래된 순으로 펼친다', () => {
    const latest = { items: [{ id: 'c' }, { id: 'd' }], nextCursor: 'c' };
    const older = { items: [{ id: 'a' }, { id: 'b' }], nextCursor: null };
    assert.deepEqual(
      flattenPages([latest, older]).map((m) => m.id),
      ['a', 'b', 'c', 'd'],
    );
  });

  it('보낸 메시지는 최근 페이지 끝에, 중복 없이', () => {
    const pages = [{ items: [{ id: 'a' }], nextCursor: null }];
    const next = appendToLatest(pages, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    assert.deepEqual(
      next[0].items.map((m) => m.id),
      ['a', 'b', 'c'],
    );
    assert.deepEqual(
      appendToLatest([], [{ id: 'x' }])[0].items.map((m) => m.id),
      ['x'],
    );
  });

  const entries = [
    { date: '2026-08-03', status: 'CONFIRMED' },
    { date: '2026-09-24', status: 'CONFIRMED' },
    { date: '2026-09-26', status: 'CONFIRMED' },
    { date: '2026-10-24', status: 'GENERATED' },
  ];

  it('점 상태: 기준일 이후는 모르는 기록, 작성 중은 따로', () => {
    assert.equal(dotState(entries[1], '2026-09-25'), 'known');
    assert.equal(dotState(entries[2], '2026-09-25'), 'unknown');
    assert.equal(dotState(entries[3], '2026-10-25'), 'draft');
  });

  it('타임라인: 첫 기록 달부터 이번 달까지 최근 달이 위로', () => {
    const months = timelineMonths(entries, '2026-10-25');
    assert.deepEqual(
      months.map((m) => [m.key, m.label, m.dots.map((d) => d.day)]),
      [
        ['2026-10', '10월', [24]],
        ['2026-09', '9월', [24, 26]],
        ['2026-08', '8월', [3]],
      ],
    );
    assert.equal(months[0].days, 31);
    assert.deepEqual(timelineMonths([], '2026-10-25'), []);
    // 해가 바뀌면 연도를 붙인다
    const cross = timelineMonths(
      [{ date: '2025-12-31', status: 'CONFIRMED' }],
      '2026-01-02',
    );
    assert.deepEqual(
      cross.map((m) => m.label),
      ['1월', '25년 12월'],
    );
  });

  it('점 위치는 그 날의 가운데', () => {
    assert.equal(dayPosition(1, 10), 0.05);
    assert.equal(dayPosition(10, 10), 0.95);
  });

  it('기준일까지의 마지막 확정 일기', () => {
    assert.equal(
      lastConfirmedOnOrBefore(entries, '2026-09-25')?.date,
      '2026-09-24',
    );
    assert.equal(
      lastConfirmedOnOrBefore(entries, '2026-10-25')?.date,
      '2026-09-26',
    );
    assert.equal(lastConfirmedOnOrBefore(entries, '2026-07-01'), null);
  });

  it('처음 기준일: 1개월 전 → 다른 가능한 프리셋 → 마지막 일기 → 오늘', () => {
    const presets = [
      { preset: '1W' as const, anchorDate: '2026-10-18', available: true },
      { preset: '1M' as const, anchorDate: '2026-09-25', available: true },
    ];
    assert.equal(defaultAnchor(presets, entries, '2026-10-25'), '2026-09-25');
    assert.equal(
      defaultAnchor(
        [{ ...presets[1], available: false }, presets[0]],
        entries,
        '2026-10-25',
      ),
      '2026-10-18',
    );
    assert.equal(defaultAnchor([], entries, '2026-10-25'), '2026-09-26');
    assert.equal(defaultAnchor([], [], '2026-10-25'), '2026-10-25');
  });

  it('최근 대화 시간', () => {
    const now = Date.parse('2026-10-25T05:00:00Z'); // KST 14:00
    assert.equal(relativeTime('2026-10-25T04:59:40Z', now), '방금');
    assert.equal(relativeTime('2026-10-25T04:30:00Z', now), '30분 전');
    assert.equal(relativeTime('2026-10-25T00:00:00Z', now), '5시간 전');
    assert.equal(relativeTime('2026-10-24T05:00:00Z', now), '어제');
    assert.equal(relativeTime('2026-10-21T05:00:00Z', now), '4일 전');
    assert.equal(relativeTime('2026-10-01T05:00:00Z', now), '10월 1일');
  });

  it('아래 고정 바 둘째 줄', () => {
    const ok = { available: true, recordCount: 16, requiredCount: 7 };
    assert.equal(
      selfBarLine(ok, '페이온 코테 합격!'),
      '기록 16편 · 페이온 코테 합격!',
    );
    assert.equal(selfBarLine(ok, null), '기록 16편');
    assert.equal(
      selfBarLine(
        { available: false, recordCount: 3, requiredCount: 7 },
        '아무거나',
      ),
      '기록이 모자라요 (3/7)',
    );
  });

  it('최근 대화는 3개까지, 더 있으면 전체 보기', () => {
    assert.deepEqual(recentSessionsView([1, 2, 3]), {
      shown: [1, 2, 3],
      hasMore: false,
    });
    assert.deepEqual(recentSessionsView([1, 2, 3, 4, 5]), {
      shown: [1, 2, 3],
      hasMore: true,
    });
    assert.deepEqual(recentSessionsView([]), { shown: [], hasMore: false });
  });
});
