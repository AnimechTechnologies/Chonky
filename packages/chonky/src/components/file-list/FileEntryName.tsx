/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Nullable } from 'tsdef';
import { useDispatch } from 'react-redux';
import TextField from '@mui/material/TextField';

import { FileData } from '../../types/file.types';
import { ChonkyDispatch } from '../../types/redux.types';
import { reduxActions } from '../../redux/reducers';
import { thunkRequestFileAction } from '../../redux/thunks/dispatchers.thunks';
import { ChonkyActions } from '../../action-definitions';
import { makeLocalChonkyStyles } from '../../util/styles';
import { useFileNameComponent, useModifierIconComponents } from './FileEntry-hooks';

export interface FileEntryNameProps {
  file: Nullable<FileData>;
  renaming: boolean;
  className?: string;
}

export const FileEntryName: React.FC<FileEntryNameProps> = React.memo(({ file, renaming, className }) => {
  const modifierIconComponents = useModifierIconComponents(file);
  const fileNameComponent = useFileNameComponent(file);
  const [renamedValue, setRenamedValue] = useState(file?.name ?? '');
  const dispatch: ChonkyDispatch = useDispatch();

  useEffect(() => {
    setRenamedValue(file?.name ?? '');
  }, [file, renaming]);

  const stopRenaming = useCallback((saveChanges: boolean) => {
    if (saveChanges && file && file.name !== renamedValue) {
      dispatch(
        thunkRequestFileAction(ChonkyActions.RenameFile, {
          file,
          targetName: renamedValue,
        }),
      );
    }
    dispatch(reduxActions.stopRenaming());
  }, [dispatch, file, renamedValue]);

  const classes = useStyles();

  return renaming ? (
    <TextField
      className={classes.fileRenamingInputField}
      value={renamedValue}
      autoFocus
      variant="standard"
      size="small"
      onChange={(e) => setRenamedValue(e.target.value)}
      onBlur={() => stopRenaming(true)}
      onFocus={(e) => e.target.select()}
      onClick={(e) => e.stopPropagation()} // Prevent click from triggering file selection
      onKeyDown={(e) => {
        const isEnterKey = e.key === 'Enter';
        const isEscapeKey = e.key === 'Escape';
        if (isEnterKey || isEscapeKey) {
          stopRenaming(isEnterKey);
          const input = e.target as HTMLInputElement; // Typings inaccurately claim target is HTMLDivElement
          input.blur(); // Avoid issues with focus state
          e.stopPropagation(); // Prevent key from triggering file action
        }
      }}
      inputProps={{
        style: {
          textAlign: 'inherit',
          padding: '0px',
        },
      }}
      InputProps={{
        style: {
          fontSize: 'inherit',
          fontFamily: 'inherit',
        },
        disableUnderline: true,
        spellCheck: false,
        draggable: true,
      }}
    />
  ) : (
    <div className={classes.fileEntryName}>
      <span className={className} title={file ? file.name : undefined} data-chonky-file-entry-name={true}>
        {modifierIconComponents.length > 0 && <span className={classes.modifierIcons}>{modifierIconComponents}</span>}
        {fileNameComponent}
      </span>
    </div>
  );
});
FileEntryName.displayName = 'FileEntryName';

const useStyles = makeLocalChonkyStyles((theme) => ({
  modifierIcons: {
    color: theme.palette.text.primary,
    position: 'relative',
    fontSize: '0.775em',
    paddingRight: 5,
  },
  fileEntryName: {
    border: '1px solid transparent', // Prevents the text from jumping around when renaming
    textWrap: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  fileRenamingInputField: {
    display: 'inline-block',
    backgroundColor: theme.fileRenamingInputField.backgroundColor,
    borderRadius: theme.fileRenamingInputField.borderRadius,
    border: theme.fileRenamingInputField.border,
  },
}));
