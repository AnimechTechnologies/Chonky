/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import React from 'react';

import { FileBrowserHandle, FileBrowserProps } from '../../types/file-browser.types';
import { ColumnDefinition, FileList } from '../file-list/FileList';
import { FileBrowser } from './FileBrowser';
import { FileContextMenu } from './FileContextMenu';
import { FileNavbar } from './FileNavbar';
import { FileToolbar } from './FileToolbar';

export interface FullFileBrowserProps extends FileBrowserProps {
  /**
   * Overrides column definitions for the list view, allowing customization of
   * which properties to display and how they are presented.
   * When not specified, default definitions will be used for the 'icon', 'name', 'size' and 'modDate' properties.
   */
  columns?: ColumnDefinition[];
}

export const FullFileBrowser = React.memo(
  React.forwardRef<FileBrowserHandle, FullFileBrowserProps>((props, ref) => {
    const { onScroll, columns } = props;
    return (
      <FileBrowser ref={ref} {...props}>
        {props.folderChain?.length ? <FileNavbar /> : undefined}
        <FileToolbar />
        <FileList onScroll={onScroll} columns={columns} />
        <FileContextMenu />
      </FileBrowser>
    );
  })
);
FullFileBrowser.displayName = 'FullFileBrowser';
