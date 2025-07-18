import { useCallback, useEffect, useMemo } from 'react';
import { DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { ExcludeKeys, Nullable } from 'tsdef';

import { EssentialActions } from '../action-definitions/essential';
import { ChonkyActions } from '../action-definitions/index';
import { selectCurrentFolder, selectFolderChain, selectInstanceId, selectSelectedFiles } from '../redux/selectors';
import { thunkRequestFileAction } from '../redux/thunks/dispatchers.thunks';
import { StartDragNDropPayload } from '../types/action-payloads.types';
import { ChonkyDndDropResult, ChonkyDndFileEntryItem, ChonkyDndFileEntryType } from '../types/dnd.types';
import { DndEntryState } from '../types/file-list.types';
import { FileData } from '../types/file.types';
import { ChonkyDispatch, ChonkyStore } from '../types/redux.types';
import { useDragIfAvailable, useDropIfAvailable } from './dnd-fallback';
import { FileHelper } from './file-helper';
import { useInstanceVariable } from './hooks-helpers';

export const useFileDrag = (file: Nullable<FileData>) => {
  // Prepare the dnd payload
  const store: ChonkyStore = useStore();
  const fileRef = useInstanceVariable(file);
  const getDndStartPayload = useCallback<() => StartDragNDropPayload>(() => {
    const reduxState = store.getState();
    // We force non-null type below because by convention, if drag & drop for
    // this file was possible, it must have been non-null.
    const draggedFile = fileRef.current!;
    const currentlySelectedFiles = selectSelectedFiles(reduxState);

    return {
      sourceInstanceId: selectInstanceId(reduxState),
      source: selectCurrentFolder(reduxState),
      draggedFile,
      // In cases where the user starts dragging an unselected file, we want
      // the drag operation to only treat the dragged file as selected and ignore the other selected files.
      selectedFiles: currentlySelectedFiles.includes(draggedFile) ? currentlySelectedFiles : [draggedFile],
    };
  }, [store, fileRef]);

  // For drag source
  const dispatch: ChonkyDispatch = useDispatch();
  const canDrag = useCallback(() => FileHelper.isDraggable(fileRef.current), [fileRef]);
  const onDragStart = useCallback((): ChonkyDndFileEntryItem => {
    const item: ChonkyDndFileEntryItem = {
      type: ChonkyDndFileEntryType,
      payload: getDndStartPayload(),
    };
    // NOTE: In our use-case we want to preserve the current selection
    // when dragging a file, since the current selection may affect what
    // happens when dropping the file in other parts of our application.
    // We therefore avoid dispatching ChonkyActions.StartDragNDrop at this point.
    // dispatch(thunkRequestFileAction(ChonkyActions.StartDragNDrop, item.payload));
    return item;
  }, [dispatch, getDndStartPayload]);
  const onDragEnd = useCallback(
    (item: ChonkyDndFileEntryItem, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult() as ChonkyDndDropResult;
      if (!FileHelper.isDraggable(item.payload.draggedFile) || !dropResult || !dropResult.dropTarget) {
        return;
      }

      dispatch(
        thunkRequestFileAction(ChonkyActions.EndDragNDrop, {
          ...item.payload,
          destination: dropResult.dropTarget,
          copy: dropResult.dropEffect === 'copy',
        }),
      );
    },
    [dispatch],
  );

  // Create refs for react-dnd hooks
  const collect = useCallback((monitor: DragSourceMonitor) => ({ isDragging: monitor.isDragging() }), []);
  const [{ isDragging: dndIsDragging }, drag, preview] = useDragIfAvailable({
    item: onDragStart,
    type: ChonkyDndFileEntryType,
    canDrag,
    // @ts-ignore
    end: onDragEnd,
    collect,
  });

  useEffect(() => {
    // Set drag preview to an empty image because `DnDFileListDragLayer` will
    // provide its own preview.
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return { dndIsDragging, drag };
};

interface UseFileDropParams {
  file: Nullable<FileData>;
  forceDisableDrop?: boolean;
  includeChildrenDrops?: boolean;
}

export const useFileDrop = ({ file, forceDisableDrop, includeChildrenDrops }: UseFileDropParams) => {
  const folderChainRef = useInstanceVariable(useSelector(selectFolderChain));
  const onDrop = useCallback(
    (_item: ChonkyDndFileEntryItem, monitor: DropTargetMonitor) => {
      if (!monitor.canDrop()) return;
      const customDropResult: ExcludeKeys<ChonkyDndDropResult, 'dropEffect'> = {
        dropTarget: file,
      };
      return customDropResult;
    },
    [file],
  );
  const canDrop = useCallback(
    (item: ChonkyDndFileEntryItem, monitor: DropTargetMonitor) => {
      if (
        forceDisableDrop ||
        !FileHelper.isDroppable(file) ||
        (!monitor.isOver({ shallow: true }) && !includeChildrenDrops)
      ) {
        return false;
      }
      const { source, draggedFile, selectedFiles } = item.payload;

      // We prevent folders from being dropped into themselves. We also prevent
      // any folder from current folder chain being moved - we can't move the
      // folder that we are currently in.
      const prohibitedFileIds = new Set<string>();
      prohibitedFileIds.add(file.id);
      folderChainRef.current.map((folder) => {
        if (folder) prohibitedFileIds.add(folder.id);
      });
      const movedFiles: FileData[] = [draggedFile, ...selectedFiles];
      for (const currFile of movedFiles) {
        if (prohibitedFileIds.has(currFile.id)) return false;
      }

      // Finally, prohibit files from being moved into their parent folder
      // (which is a no-op).
      return file.id !== source?.id;
    },
    [forceDisableDrop, file, includeChildrenDrops, folderChainRef],
  );
  const collect = useCallback(
    (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
    [],
  );
  const [{ isOver: dndIsOver, isOverCurrent: dndIsOverCurrent, canDrop: dndCanDrop }, drop] = useDropIfAvailable({
    accept: ChonkyDndFileEntryType,
    drop: onDrop,
    canDrop,
    collect,
  });
  return { dndIsOver, dndIsOverCurrent, dndCanDrop, drop };
};

export const useFileEntryDnD = (file: Nullable<FileData>) => {
  const { dndIsDragging, drag } = useFileDrag(file);
  const { dndIsOver, dndCanDrop, drop } = useFileDrop({ file });
  const dndState = useMemo<DndEntryState>(
    () => ({
      dndIsDragging,
      dndIsOver,
      dndCanDrop,
    }),
    [dndCanDrop, dndIsDragging, dndIsOver],
  );
  return {
    drop,
    drag,
    dndState,
  };
};

export const useDndHoverOpen = (file: Nullable<FileData>, dndState: DndEntryState) => {
  const dispatch: ChonkyDispatch = useDispatch();
  const currentFolderRef = useInstanceVariable(useSelector(selectCurrentFolder));
  useEffect(() => {
    let timeout: Nullable<any> = null;
    if (dndState.dndIsOver && FileHelper.isDndOpenable(file) && file.id !== currentFolderRef.current?.id) {
      timeout = setTimeout(
        () =>
          dispatch(
            thunkRequestFileAction(EssentialActions.OpenFiles, {
              targetFile: file,
              files: [file],
            }),
          ),
        // TODO: Make this timeout configurable
        1500,
      );
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [dispatch, file, dndState.dndIsOver, currentFolderRef]);
};
