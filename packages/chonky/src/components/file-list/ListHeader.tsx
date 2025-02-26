import React, { useMemo } from 'react';
import { makeLocalChonkyStyles } from '../../util/styles';
import { ColumnDefinition } from './FileList';

export interface FileListHeaderProps {
  width: number;
  columns: ColumnDefinition[];
}

export const ListHeader: React.FC<FileListHeaderProps> = React.memo((props) => {
  const { width, columns } = props;
  const classes = useStyles();
  const headerComponent = useMemo(() => {
    return (
      <div className={classes.headerRow} style={{ width }}>
        {columns.map((column, index) => (
          <div
            key={index}
            className={classes.headerCellProperty}
            style={{
              flex: column.flex || '0 1 10%',
              justifyContent: column.justifyContent || 'left',
            }}
          >
            {column.label}
          </div>
        ))}
      </div>
    );
  }, [columns, classes, width]);

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
