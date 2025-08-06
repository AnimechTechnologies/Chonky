import { reduxActions } from '../redux/reducers';
import {
  getFileData,
  getIsFileSelected,
  selectDisableSelection,
  selectDisableSimpleDeselection,
  selectRenamingFileId,
  selectors,
  selectParentFolder,
  selectSelectionSize,
} from '../redux/selectors';
import { reduxThunks } from '../redux/thunks';
import { thunkRequestFileAction } from '../redux/thunks/dispatchers.thunks';
import {
  ChangeSelectionPayload,
  EndDragNDropPayload,
  KeyboardClickFilePayload,
  MouseClickFilePayload,
  MoveFilesPayload,
  OpenFileContextMenuPayload,
  OpenFilesPayload,
  RenameFilePayload,
  StartDragNDropPayload,
  StartRenamingFilePayload,
  EndRenamingFilePayload,
} from '../types/action-payloads.types';
import { ChonkyIconName } from '../types/icons.types';
import { FileHelper } from '../util/file-helper';
import { defineFileAction } from '../util/helpers';
import { Logger } from '../util/logger';
import { ChonkyActions } from './index';

export const EssentialActions = {
  /**
   * Action that is dispatched when the user clicks on a file entry using their mouse.
   * Both single clicks and double clicks trigger this action.
   */
  MouseClickFile: defineFileAction(
    {
      id: 'mouse_click_file',
      __payloadType: {} as MouseClickFilePayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      const { file, fileDisplayIndex, clickType, ctrlKey, shiftKey, targetElement } = payload as MouseClickFilePayload;
      const fileId = file.id;

      if (clickType === 'double') {
        if (FileHelper.isOpenable(file)) {
          reduxDispatch(
            thunkRequestFileAction(ChonkyActions.OpenFiles, {
              targetFile: file,

              // To simulate Windows Explorer and Nautilus behaviour,
              // a double click on a file only opens that file even if
              // there is a selection.
              files: [file],
            }),
          );
        }
      } else {
        // We're dealing with a single click

        const state = getReduxState();
        const disableSimpleDeselection = selectDisableSimpleDeselection(state);
        const disableSelection = selectDisableSelection(state);
        const selectionSize = selectSelectionSize(state);
        const isFileSelected = getIsFileSelected(state, file);
        const lastClick = selectors.getLastClick(state);

        if (
          !ctrlKey &&
          !shiftKey &&
          FileHelper.isRenamable(file) &&
          targetElement instanceof HTMLElement &&
          targetElement.dataset.chonkyFileEntryName && // Check if the click target is the file entry name
          (disableSelection ? lastClick?.fileId === fileId : isFileSelected && selectionSize === 1)
        ) {
          reduxDispatch(
            thunkRequestFileAction(EssentialActions.StartRenamingFile, {
              fileId,
            }),
          );
        } else if (FileHelper.isSelectable(file) && !disableSelection) {
          if (ctrlKey) {
            // Multiple selection
            reduxDispatch(
              reduxActions.selectFile({
                fileId: fileId,
                exclusive: false,
                toggle: true,
              }),
            );
            reduxDispatch(
              reduxActions.setLastClickIndex({
                index: fileDisplayIndex,
                fileId: fileId,
              }),
            );
          } else if (shiftKey) {
            // Range selection

            const lastClickIndex = lastClick?.index;
            if (typeof lastClickIndex === 'number') {
              // We have the index of the previous click
              let rangeStart = lastClickIndex;
              let rangeEnd = fileDisplayIndex;
              if (rangeStart > rangeEnd) {
                [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
              }

              reduxDispatch(
                reduxThunks.selectRange({
                  rangeStart,
                  rangeEnd,
                }),
              );
              reduxDispatch(
                reduxActions.setLastClickIndex({
                  index: fileDisplayIndex,
                  fileId: fileId,
                }),
              );
            } else {
              // Since we can't do a range selection, do a
              // multiple selection
              reduxDispatch(
                reduxActions.selectFile({
                  fileId: fileId,
                  exclusive: false,
                  toggle: !disableSimpleDeselection,
                }),
              );
              reduxDispatch(
                reduxActions.setLastClickIndex({
                  index: fileDisplayIndex,
                  fileId: fileId,
                }),
              );
            }
          } else {
            // Exclusive selection
            reduxDispatch(
              reduxActions.selectFile({
                fileId: fileId,
                exclusive: true,
                toggle: !disableSimpleDeselection,
              }),
            );
            reduxDispatch(
              reduxActions.setLastClickIndex({
                index: fileDisplayIndex,
                fileId: fileId,
              }),
            );
          }
        } else {
          if (!ctrlKey && !disableSelection) {
            reduxDispatch(reduxActions.clearSelection());
          }
          reduxDispatch(
            reduxActions.setLastClickIndex({
              index: fileDisplayIndex,
              fileId: fileId,
            }),
          );
        }
      }
    },
  ),
  /**
   * Action that is dispatched when the user "clicks" on a file using their keyboard.
   * Using Space and Enter keys counts as clicking.
   */
  KeyboardClickFile: defineFileAction(
    {
      id: 'keyboard_click_file',
      __payloadType: {} as KeyboardClickFilePayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      reduxDispatch(
        reduxActions.setLastClickIndex({
          index: payload.fileDisplayIndex,
          fileId: payload.file.id,
        }),
      );
      if (payload.enterKey) {
        // We only dispatch the Open Files action here when the selection is
        // empty. Otherwise, `Enter` key presses are handled by the
        // hotkey manager for the Open Files action.
        if (selectSelectionSize(getReduxState()) === 0) {
          reduxDispatch(
            thunkRequestFileAction(ChonkyActions.OpenFiles, {
              targetFile: payload.file,
              files: [payload.file],
            }),
          );
        }
      }
    },
  ),
  /**
   * Action that is dispatched when user starts dragging some file.
   */
  StartDragNDrop: defineFileAction(
    {
      id: 'start_drag_n_drop',
      __payloadType: {} as StartDragNDropPayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      const file = payload.draggedFile;
      if (!getIsFileSelected(getReduxState(), file)) {
        if (FileHelper.isSelectable(file)) {
          reduxDispatch(
            reduxActions.selectFiles({
              fileIds: [file.id],
              reset: true,
            }),
          );
        }
      }
    },
  ),
  /**
   * Action that is dispatched when user either cancels the drag & drop interaction,
   * or drops a file somewhere.
   */
  EndDragNDrop: defineFileAction(
    {
      id: 'end_drag_n_drop',
      __payloadType: {} as EndDragNDropPayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      if (getIsFileSelected(getReduxState(), payload.destination)) {
        // Can't drop a selection into itself
        return;
      }

      const { draggedFile, selectedFiles } = payload as EndDragNDropPayload;
      const droppedFiles = selectedFiles.length > 0 ? selectedFiles : [draggedFile];
      reduxDispatch(
        thunkRequestFileAction(ChonkyActions.MoveFiles, {
          ...payload,
          files: droppedFiles,
        }),
      );
    },
  ),
  /**
   * Action that is dispatched when user moves files from one folder to another,
   * usually by dragging & dropping some files into the folder.
   */
  MoveFiles: defineFileAction({
    id: 'move_files',
    __payloadType: {} as MoveFilesPayload,
  } as const),
  /**
   * Action that is dispatched after user finishes renaming a file,
   * usually by pressing Enter or the input field loses focus.
   */
  RenameFile: defineFileAction({
    id: 'rename_file',
    __payloadType: {} as RenameFilePayload,
  } as const),
  /**
   * Action that is dispatched when user starts renaming a file,
   * usually by clicking on the file name of a single selected file.
   */
  StartRenamingFile: defineFileAction(
    {
      id: 'start_renaming_file',
      __payloadType: {} as StartRenamingFilePayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      const { fileId } = payload as StartRenamingFilePayload;
      const file = getFileData(getReduxState(), fileId);
      if (FileHelper.isRenamable(file)) {
        reduxDispatch(reduxActions.startRenaming(fileId));
      } else {
        Logger.warn(
          `Start renaming file action was triggered for file that is ` +
            `not renamable. This may indicate a bug in internal components.`,
        );
      }
    },
  ),
  /**
   * Action that is dispatched when user either cancels the renaming,
   * or save the new target name.
   */
  EndRenamingFile: defineFileAction(
    {
      id: 'end_renaming_file',
      __payloadType: {} as EndRenamingFilePayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      const renamingFileId = selectRenamingFileId(getReduxState());
      if (renamingFileId) {
        const { targetName } = payload as EndRenamingFilePayload;
        if (targetName) {
          const file = getFileData(getReduxState(), renamingFileId);
          if (FileHelper.isRenamable(file) && file.name !== targetName) {
            reduxDispatch(
              thunkRequestFileAction(ChonkyActions.RenameFile, {
                file: file,
                targetName: targetName,
              }),
            );
          }
        }
        reduxDispatch(reduxActions.endRenaming());
      }
    },
  ),
  /**
   * Action that is dispatched when the selection changes for any reason.
   */
  ChangeSelection: defineFileAction({
    id: 'change_selection',
    __payloadType: {} as ChangeSelectionPayload,
  } as const),
  /**
   * Action that is dispatched when user wants to open some files. This action is
   * often triggered by other actions.
   */
  OpenFiles: defineFileAction({
    id: 'open_files',
    __payloadType: {} as OpenFilesPayload,
  } as const),
  /**
   * Action that is triggered when user wants to go up a directory.
   */
  OpenParentFolder: defineFileAction(
    {
      id: 'open_parent_folder',
      button: {
        name: 'Go up a directory',
        toolbar: true,
        contextMenu: false,
        icon: ChonkyIconName.openParentFolder,
        iconOnly: true,
      },
    } as const,
    ({ reduxDispatch, getReduxState }) => {
      const reduxState = getReduxState();
      const parentFolder = selectParentFolder(reduxState);
      if (FileHelper.isOpenable(parentFolder)) {
        reduxDispatch(
          thunkRequestFileAction(ChonkyActions.OpenFiles, {
            targetFile: parentFolder,
            files: [parentFolder],
          }),
        );
      } else if (!reduxState.forceEnableOpenParent) {
        Logger.warn(
          'Open parent folder effect was triggered even though the parent folder' +
            ' is not openable. This indicates a bug in presentation components.',
        );
      }
    },
  ),
  /**
   * Action that is dispatched when user opens the context menu, either by right click
   * on something or using the context menu button on their keyboard.
   */
  OpenFileContextMenu: defineFileAction(
    {
      id: 'open_file_context_menu',
      __payloadType: {} as OpenFileContextMenuPayload,
    } as const,
    ({ payload, reduxDispatch, getReduxState }) => {
      // TODO: Check if the context menu component is actually enabled. There is a
      //  chance it doesn't matter if it is enabled or not - if it is not mounted,
      //  the action will simply have no effect. It also allows users to provide
      //  their own components - however, users could also flip the "context menu
      //  component mounted" switch...
      const triggerFile = getFileData(getReduxState(), payload.triggerFileId);
      if (triggerFile) {
        const fileSelected = getIsFileSelected(getReduxState(), triggerFile);
        if (!fileSelected) {
          // If file is selected, we leave the selection as is. If it is not
          // selected, it means user right clicked the file with no selection.
          // We simulate the Windows Explorer/Nautilus behaviour of moving
          // selection to this file.
          if (FileHelper.isSelectable(triggerFile)) {
            reduxDispatch(
              reduxActions.selectFiles({
                fileIds: [payload.triggerFileId],
                reset: true,
              }),
            );
          } else {
            reduxDispatch(reduxActions.clearSelection());
          }
        }
      }

      reduxDispatch(
        reduxActions.showContextMenu({
          triggerFileId: payload.triggerFileId,
          mouseX: payload.clientX - 2,
          mouseY: payload.clientY - 4,
        }),
      );
    },
  ),
};
