import React, { HTMLProps, useCallback, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Nullable, Undefinable } from 'tsdef';

import { ChonkyActions } from '../../action-definitions/index';
import { thunkRequestFileAction } from '../../redux/thunks/dispatchers.thunks';
import { DndEntryState } from '../../types/file-list.types';
import { FileData } from '../../types/file.types';
import { ChonkyIconName } from '../../types/icons.types';
import { ChonkyDispatch } from '../../types/redux.types';
import { FileHelper } from '../../util/file-helper';
import { ChonkyIconContext, ColorsDark, ColorsLight, useIconData } from '../../util/icon-helper';
import { TextPlaceholder } from '../external/TextPlaceholder';
import { KeyboardClickEvent, MouseClickEvent } from '../internal/ClickableWrapper';
import { FileEntryState } from './GridEntryPreview';

export const useFileEntryHtmlProps = (file: Nullable<FileData>): HTMLProps<HTMLDivElement> => {
  return useMemo(() => {
    const dataProps: { [prop: string]: Undefinable<string> } = {
      'data-test-id': 'file-entry',
      'data-chonky-file-id': file ? file.id : undefined,
    };

    return {
      role: 'listitem',
      ...dataProps,
    };
  }, [file]);
};

export const useFileEntryState = (file: Nullable<FileData>, selected: boolean, focused: boolean) => {
  const iconData = useIconData(file);

  return useMemo<FileEntryState>(() => {
    const thumbnailElement = file?.thumbnailElement ?? null;
    const fileColor = thumbnailElement ? ColorsDark[iconData.colorCode] : ColorsLight[iconData.colorCode];
    const iconSpin = !file;
    const icon = iconData.icon;

    return {
      childrenCount: FileHelper.getChildrenCount(file),
      icon: file && file.icon !== undefined ? file.icon : icon,
      iconSpin: iconSpin,
      thumbnailElement: thumbnailElement,
      color: file && file.color !== undefined ? file.color : fileColor,
      selected: selected,
      focused: !!focused,
    };
  }, [file, focused, iconData, selected]);
};

export const useDndIcon = (dndState: DndEntryState) => {
  let dndIconName: Nullable<ChonkyIconName> = null;
  if (dndState.dndIsOver) {
    const showDropIcon = dndState.dndCanDrop;
    dndIconName = showDropIcon ? ChonkyIconName.dndCanDrop : ChonkyIconName.dndCannotDrop;
  } else if (dndState.dndIsDragging) {
    dndIconName = ChonkyIconName.dndDragging;
  }

  return dndIconName;
};

export const useModifierIconComponents = (file: Nullable<FileData>) => {
  const modifierIcons: ChonkyIconName[] = useMemo(() => {
    const modifierIcons: ChonkyIconName[] = [];
    if (FileHelper.isHidden(file)) modifierIcons.push(ChonkyIconName.hidden);
    if (FileHelper.isSymlink(file)) modifierIcons.push(ChonkyIconName.symlink);
    if (FileHelper.isEncrypted(file)) modifierIcons.push(ChonkyIconName.lock);
    return modifierIcons;
  }, [file]);
  const ChonkyIcon = useContext(ChonkyIconContext);
  const modifierIconComponents = useMemo(
    () => modifierIcons.map((icon, index) => <ChonkyIcon key={`file-modifier-${index}`} icon={icon} />),
    // For some reason ESLint marks `ChonkyIcon` as an unnecessary dependency,
    // but we expect it can change at runtime so we disable the check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ChonkyIcon, modifierIcons],
  );
  return modifierIconComponents;
};

const _extname = (fileName: string) => {
  const parts = fileName.split('.');
  if (parts.length) {
    return `.${parts[parts.length - 1]}`;
  }
  return '';
};

export const useFileNameComponent = (file: Nullable<FileData>) => {
  return useMemo(() => {
    if (!file) return <TextPlaceholder minLength={15} maxLength={20} />;

    let name;
    let extension = null;

    const isDir = FileHelper.isDirectory(file as FileData);
    if (isDir) {
      name = file.name;
    } else {
      extension = file.ext ?? _extname(file.name);
      name = file.name.substring(0, file.name.length - extension.length);
    }

    return (
      <>
        {name}
        {extension && <span className="chonky-file-entry-description-title-extension">{extension}</span>}
      </>
    );
  }, [file]);
};

export const useFileClickHandlers = (file: Nullable<FileData>, displayIndex: number) => {
  const dispatch: ChonkyDispatch = useDispatch();

  // Prepare base handlers
  const onMouseClick = useCallback(
    (event: MouseClickEvent, clickType: 'single' | 'double') => {
      if (!file) return;

      dispatch(
        thunkRequestFileAction(ChonkyActions.MouseClickFile, {
          clickType,
          file,
          fileDisplayIndex: displayIndex,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
        }),
      );
    },
    [dispatch, file, displayIndex],
  );
  const onKeyboardClick = useCallback(
    (event: KeyboardClickEvent) => {
      if (!file) return;

      dispatch(
        thunkRequestFileAction(ChonkyActions.KeyboardClickFile, {
          file,
          fileDisplayIndex: displayIndex,
          enterKey: event.enterKey,
          spaceKey: event.spaceKey,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
        }),
      );
    },
    [dispatch, file, displayIndex],
  );

  // Prepare single/double click handlers
  const onSingleClick = useCallback((event: MouseClickEvent) => onMouseClick(event, 'single'), [onMouseClick]);
  const onDoubleClick = useCallback((event: MouseClickEvent) => onMouseClick(event, 'double'), [onMouseClick]);

  return {
    onSingleClick,
    onDoubleClick,
    onKeyboardClick,
  };
};
