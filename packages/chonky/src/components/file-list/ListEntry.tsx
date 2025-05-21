import React, { useContext, useMemo } from 'react';

import { DndEntryState, FileEntryProps } from '../../types/file-list.types';
import { ChonkyIconContext } from '../../util/icon-helper';
import { c, makeLocalChonkyStyles } from '../../util/styles';
import { useDndIcon, useFileEntryHtmlProps, useFileEntryState } from './FileEntry-hooks';
import { FileEntryState, useCommonEntryStyles } from './GridEntryPreview';
import { ColumnDefinition } from './FileList';
import { FileEntryName } from './FileEntryName';
import { useLocalizedFileEntryStrings } from '../../util/i18n';
import { TextPlaceholder } from '../external/TextPlaceholder';

interface StyleState {
  entryState: FileEntryState;
  dndState: DndEntryState;
}

export interface ListEntryProps extends FileEntryProps {
  columns: ColumnDefinition[];
}

export const ListEntry: React.FC<ListEntryProps> = React.memo(({ file, selected, focused, dndState, columns }) => {
  const entryState: FileEntryState = useFileEntryState(file, selected, focused);
  const dndIconName = useDndIcon(dndState);

  const { fileModDateString, fileSizeString } = useLocalizedFileEntryStrings(file);
  const styleState = useMemo<StyleState>(
    () => ({
      entryState,
      dndState,
    }),
    [dndState, entryState],
  );
  const classes = useStyles(styleState);
  const commonClasses = useCommonEntryStyles(entryState);
  const ChonkyIcon = useContext(ChonkyIconContext);
  const fileEntryHtmlProps = useFileEntryHtmlProps(file);
  return (
    <div className={classes.listFileEntry} {...fileEntryHtmlProps}>
      <div className={commonClasses.focusIndicator}></div>
      <div className={c([commonClasses.selectionIndicator, classes.listFileEntrySelection])}></div>
      {columns.map((column, index) => (
        <div
          key={index}
          className={classes.listFileEntryProperty}
          style={{
            flex: column.flex || '0 1 10%',
            justifyContent: column.justifyContent || 'left',
          }}
        >
          {column.render === 'icon' && (
            <div className={classes.listFileEntryIcon}>
              <ChonkyIcon
                icon={dndIconName ?? entryState.icon}
                spin={dndIconName ? false : entryState.iconSpin}
                fixedWidth={true}
              />
            </div>
          )}
          {column.render === 'name' && (
            <div className={classes.listFileEntryName} title={file ? file.name : undefined}>
              <FileEntryName file={file} />
            </div>
          )}
          {column.render === 'modDate' &&
            (file ? fileModDateString ?? <span>—</span> : <TextPlaceholder minLength={5} maxLength={15} />)}
          {column.render === 'size' &&
            (file ? fileSizeString ?? <span>—</span> : <TextPlaceholder minLength={10} maxLength={20} />)}
          {typeof column.render === 'function' && column.render(file)}
        </div>
      ))}
    </div>
  );
});

const useStyles = makeLocalChonkyStyles((theme) => ({
  listFileEntry: {
    boxShadow: `inset ${theme.palette.divider} 0 -1px 0`,
    fontSize: theme.listFileEntry.fontSize,
    color: ({ dndState }: StyleState) =>
      dndState.dndIsOver ? (dndState.dndCanDrop ? theme.dnd.canDropColor : theme.dnd.cannotDropColor) : 'inherit',
    alignItems: 'center',
    marginRight: 4,
    gap: 4,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    height: '100%',
  },
  listFileEntrySelection: {
    opacity: 0.6,
  },
  listFileEntryIcon: {
    color: ({ entryState, dndState }: StyleState) =>
      dndState.dndIsOver
        ? dndState.dndCanDrop
          ? theme.dnd.canDropColor
          : theme.dnd.cannotDropColor
        : theme.listFileEntry.iconColor ?? entryState.color,
    fontSize: theme.listFileEntry.iconFontSize,
    padding: [2, 4],
  },
  listFileEntryName: {
    textOverflow: 'ellipsis',
  },
  listFileEntryProperty: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    fontSize: theme.listFileEntry.propertyFontSize,
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    zIndex: 20,
  },
}));
