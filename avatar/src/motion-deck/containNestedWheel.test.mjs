import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { containNestedWheel } from './containNestedWheel.js';

function fakeScroller({ scrollTop, scrollHeight, clientHeight }) {
  return {
    scrollTop,
    scrollHeight,
    clientHeight,
  };
}

function fakeWheel(deltaY) {
  return {
    deltaY,
    prevented: false,
    stopped: false,
    preventDefault() {
      this.prevented = true;
    },
    stopPropagation() {
      this.stopped = true;
    },
  };
}

describe('containNestedWheel', () => {
  it('scrolls the nested list and stops the event while mid-range', () => {
    const scroller = fakeScroller({ scrollTop: 40, scrollHeight: 200, clientHeight: 100 });
    const event = fakeWheel(20);
    containNestedWheel(event, scroller);
    assert.equal(scroller.scrollTop, 60);
    assert.equal(event.prevented, true);
    assert.equal(event.stopped, true);
  });

  it('releases the wheel at the bottom so the drawer can scroll', () => {
    const scroller = fakeScroller({ scrollTop: 100, scrollHeight: 200, clientHeight: 100 });
    const event = fakeWheel(20);
    containNestedWheel(event, scroller);
    assert.equal(scroller.scrollTop, 100);
    assert.equal(event.prevented, false);
    assert.equal(event.stopped, false);
  });

  it('does nothing when the list does not overflow', () => {
    const scroller = fakeScroller({ scrollTop: 0, scrollHeight: 80, clientHeight: 100 });
    const event = fakeWheel(20);
    containNestedWheel(event, scroller);
    assert.equal(event.prevented, false);
  });
});
