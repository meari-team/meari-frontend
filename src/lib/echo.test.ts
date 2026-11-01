import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  echoArrivalLabel,
  echoSender,
  nextRunLabel,
  scheduleSummary,
  hourLabel,
  minuteLabel,
  shiftMinuteInHour,
  shiftMonthDay,
  shiftTime,
  timeLabel,
} from './echo.ts';

describe('echo 문구', () => {
  it('날짜 구분·발신자', () => {
    assert.equal(
      echoArrivalLabel('2026-10-18'),
      '2026년 10월 18일의 나에게서 온 메아리',
    );
    assert.equal(echoSender('2026-01-05'), '2026.01.05의 나');
  });

  it('시각', () => {
    assert.equal(timeLabel('21:00'), '오후 9:00');
    assert.equal(timeLabel('00:30'), '오전 12:30');
    assert.equal(timeLabel('12:00'), '오후 12:00');
    assert.equal(shiftTime('23:30', 30), '00:00');
    assert.equal(shiftTime('00:00', -30), '23:30');
  });

  it('분 단위로 맞추기 (분은 그 시 안에서 돈다)', () => {
    assert.equal(shiftMinuteInHour('21:00', 1), '21:01');
    assert.equal(shiftMinuteInHour('21:59', 1), '21:00');
    assert.equal(shiftMinuteInHour('21:00', -1), '21:59');
    assert.equal(shiftTime('21:05', 60), '22:05');
    assert.equal(hourLabel('21:05'), '오후 9시');
    assert.equal(hourLabel('00:05'), '오전 12시');
    assert.equal(minuteLabel('21:05'), '05분');
  });

  it('월 날짜는 1~31 사이로 돈다', () => {
    assert.equal(shiftMonthDay(31, 1), 1);
    assert.equal(shiftMonthDay(1, -1), 31);
  });

  it('주기 요약', () => {
    assert.equal(
      scheduleSummary({
        frequency: 'WEEKLY',
        weekday: 0,
        monthDay: 1,
        time: '21:00',
      }),
      '매주 일요일 오후 9:00',
    );
    assert.equal(
      scheduleSummary({
        frequency: 'MONTHLY',
        weekday: 0,
        monthDay: 31,
        time: '08:30',
      }),
      '매월 31일 오전 8:30',
    );
  });

  it('다음 수신 예정은 사용자 시간대로', () => {
    assert.equal(
      nextRunLabel('2026-11-08T12:00:00.000Z', 'Asia/Seoul'),
      '11월 8일 (일) 오후 9:00',
    );
    assert.equal(
      nextRunLabel('2026-11-02T14:30:00.000Z', 'America/New_York'),
      '11월 2일 (월) 오전 9:30',
    );
  });
});
