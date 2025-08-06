/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Nilable, Nullable } from 'tsdef';

import { selectDoubleClickDelay } from '../../redux/selectors';
import {
  KeyboardClickEvent,
  KeyboardClickEventHandler,
  MouseClickEvent,
  MouseClickEventHandler,
} from './ClickableWrapper';

export const useClickHandler = (
  onSingleClick: Nilable<MouseClickEventHandler>,
  onDoubleClick: Nilable<MouseClickEventHandler>,
) => {
  const doubleClickDelay = useSelector(selectDoubleClickDelay);

  const counter = useRef({
    clickCount: 0,
    clickTimeout: null as Nullable<number>,
  });

  return useCallback(
    (event: React.MouseEvent) => {
      const mouseClickEvent: MouseClickEvent = {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey || event.metaKey,
        shiftKey: event.shiftKey,
        target: event.target,
      };

      counter.current.clickCount++;
      if (counter.current.clickCount === 1) {
        if (onSingleClick) {
          event.preventDefault();
          event.stopPropagation();
          onSingleClick(mouseClickEvent);
        }
        counter.current.clickCount = 1;
        // @ts-ignore
        counter.current.clickTimeout = setTimeout(() => (counter.current.clickCount = 0), doubleClickDelay);
      } else if (counter.current.clickCount === 2) {
        if (onDoubleClick) {
          event.preventDefault();
          event.stopPropagation();
          onDoubleClick(mouseClickEvent);
        }
        if (typeof counter.current.clickTimeout === 'number') {
          clearTimeout(counter.current.clickTimeout);
          counter.current.clickTimeout = null;
          counter.current.clickCount = 0;
        }
      }
    },
    [doubleClickDelay, onSingleClick, onDoubleClick, counter],
  );
};

export const useKeyDownHandler = (onKeyboardClick?: KeyboardClickEventHandler) => {
  return useCallback(
    (event: React.KeyboardEvent) => {
      if (!onKeyboardClick) return;

      const keyboardClickEvent: KeyboardClickEvent = {
        enterKey: event.key === 'Enter',
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
      };

      if (keyboardClickEvent.enterKey) {
        event.preventDefault();
        event.stopPropagation();
        onKeyboardClick(keyboardClickEvent);
      }
    },
    [onKeyboardClick],
  );
};
