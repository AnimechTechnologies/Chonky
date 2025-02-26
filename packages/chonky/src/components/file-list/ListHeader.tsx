import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeLocalChonkyStyles } from '../../util/styles';
import { ColumnDefinition } from './FileList';
import { selectSortActionId, selectSortOrder } from '../../redux/selectors';
import { SortOrder } from '../../types/sort.types';
import { ToolbarButton } from '../external/ToolbarButton';
import { ChonkyIconName } from '../../types/icons.types';
import { ChonkyDispatch } from '../../types/redux.types';
import { thunkActivateSortAction } from '../../redux/thunks/file-actions.thunks';

export interface FileListHeaderProps {
  width: number;
  columns: ColumnDefinition[];
}

export const ListHeader: React.FC<FileListHeaderProps> = React.memo((props) => {
  const { width, columns } = props;
  const classes = useStyles();
  const dispatch: ChonkyDispatch = useDispatch();
  const sortActionId = useSelector(selectSortActionId);
  const sortOrder = useSelector(selectSortOrder);

  const onClickColumn = useCallback((column: ColumnDefinition) => {
    if (column.sortActionId) {
      dispatch(thunkActivateSortAction(column.sortActionId));
    }
  }, []);

  const headerComponent = useMemo(() => {
    return (
      <div className={classes.headerRow} style={{ width }}>
        {columns.map((column, index) => (
          <div
            key={index}
            className={classes.headerCellProperty}
            onClick={() => onClickColumn(column)}
            style={{
              flex: column.flex || '0 1 10%',
              justifyContent: column.justifyContent || 'left',
            }}
          >
            {column.label}
            {column.sortActionId && (
              <ToolbarButton
                text=""
                iconOnly
                active={column.sortActionId === sortActionId}
                icon={
                  column.sortActionId === sortActionId
                    ? sortOrder === SortOrder.ASC
                      ? ChonkyIconName.sortAsc
                      : ChonkyIconName.sortDesc
                    : ChonkyIconName.sortAsc
                }
              />
            )}
          </div>
        ))}
      </div>
    );
  }, [columns, classes, width, sortActionId, sortOrder]);

  return headerComponent;
});

const useStyles = makeLocalChonkyStyles((theme) => ({
  headerRow: {
    display: 'flex',
    gap: 4,
    padding: '10px 4px',
    fontSize: theme.listFileEntry.headerFontSize,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    scrollbarGutter: 'stable',
  },
  headerCellProperty: {
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase',
  },
}));
