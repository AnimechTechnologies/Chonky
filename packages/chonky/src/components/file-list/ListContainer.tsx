/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import React, { CSSProperties, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FixedSizeList } from 'react-window';

import { selectFileViewConfig, selectors } from '../../redux/selectors';
import { FileViewMode } from '../../types/file-view.types';
import { useInstanceVariable } from '../../util/hooks-helpers';
import { makeLocalChonkyStyles } from '../../util/styles';
import { SmartFileEntry } from './FileEntry';
import { ListHeader } from './ListHeader';
import { ColumnDefinition } from './FileList';
import AutoSizer from 'react-virtualized-auto-sizer';

export interface FileListListProps {
  width: number;
  height: number;
  columns: ColumnDefinition[];
}

export const ListContainer: React.FC<FileListListProps> = React.memo((props) => {
  const { width, height, columns } = props;

  const viewConfig = useSelector(selectFileViewConfig);

  const listRef = useRef<FixedSizeList>();

  const displayFileIds = useSelector(selectors.getDisplayFileIds);
  const displayFileIdsRef = useInstanceVariable(displayFileIds);
  const getItemKey = useCallback(
    (index: number) => displayFileIdsRef.current[index] ?? `loading-file-${index}`,
    [displayFileIdsRef],
  );

  const classes = useStyles();
  const listComponent = useMemo(() => {
    // When entry size is null, we use List view
    const rowRenderer = (data: { index: number; style: CSSProperties }) => {
      return (
        <div style={data.style}>
          <SmartFileEntry
            fileId={displayFileIds[data.index] ?? null}
            displayIndex={data.index}
            fileViewMode={FileViewMode.List}
            columns={columns}
          />
        </div>
      );
    };

    return (
      <div className={classes.rootContainer} style={{ width, height }}>
        <ListHeader width={width} columns={columns} />
        <div className={classes.autoSizerContainer}>
          <AutoSizer>
            {({ width, height }) => (
              <FixedSizeList
                ref={listRef as any}
                className={classes.listContainer}
                itemSize={viewConfig.entryHeight}
                height={height}
                itemCount={displayFileIds.length}
                width={width}
                itemKey={getItemKey}
              >
                {rowRenderer}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }, [
    classes.rootContainer,
    classes.autoSizerContainer,
    classes.listContainer,
    viewConfig.entryHeight,
    height,
    displayFileIds,
    width,
    getItemKey,
  ]);

  return listComponent;
});

const useStyles = makeLocalChonkyStyles((theme) => ({
  rootContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  autoSizerContainer: {
    flex: '1 1 auto',
  },
  listContainer: {
    borderTop: `solid 1px ${theme.palette.divider}`,
    scrollbarGutter: 'stable',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
}));
