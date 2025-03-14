/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import hotkeys from 'hotkeys-js';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { selectFileActionData } from '../../redux/selectors';
import { useParamSelector } from '../../redux/store';
import { thunkRequestFileAction } from '../../redux/thunks/dispatchers.thunks';
import { ChonkyDispatch } from '../../types/redux.types';

export interface HotkeyListenerProps {
  fileActionId: string;
  rootRef: React.RefObject<HTMLElement>;
}

export const HotkeyListener: React.FC<HotkeyListenerProps> = React.memo((props) => {
  const { fileActionId, rootRef } = props;

  const dispatch: ChonkyDispatch = useDispatch();
  const fileAction = useParamSelector(selectFileActionData, fileActionId);
  const element = rootRef.current;

  useEffect(() => {
    if (!fileAction || !fileAction.hotkeys || fileAction.hotkeys.length === 0) {
      return;
    }
    if (!element) {
      return;
    }

    const hotkeysStr = fileAction.hotkeys.join(',');
    const hotkeyCallback = (event: KeyboardEvent) => {
      event.preventDefault();
      dispatch(thunkRequestFileAction(fileAction, undefined));
    };
    hotkeys(hotkeysStr, { element }, hotkeyCallback);
    return () => {
      hotkeys.unbind(hotkeysStr, hotkeyCallback);
    };
  }, [dispatch, fileAction, element]);

  return null;
});
