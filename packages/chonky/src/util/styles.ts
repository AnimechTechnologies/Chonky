import { Theme as MuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import classnames from 'classnames';
import { createUseStyles } from 'react-jss';
import { DeepPartial } from 'tsdef';

export const lightTheme = {
  colors: {
    debugRed: '#fabdbd',
    debugBlue: '#bdd8fa',
    debugGreen: '#d2fabd',
    debugPurple: '#d2bdfa',
    debugYellow: '#fae9bd',

    textActive: '#09f',
  },

  fontSizes: {
    rootPrimary: 15,
  },

  margins: {
    rootLayoutMargin: 8,
  },

  root: {
    borderRadius: 4,
    borderStyle: 'solid 1px',
    height: '100%',
  },

  toolbar: {
    size: 30,
    lineHeight: '30px', // `px` suffix is required for `line-height` fields to work
    buttonPadding: 8,
    fontSize: 15,
    buttonRadius: 4,
  },

  dnd: {
    canDropColor: 'green',
    cannotDropColor: 'red',
    canDropMask: 'rgba(180, 235, 180, 0.75)',
    cannotDropMask: 'rgba(235, 180, 180, 0.75)',
    fileListCanDropMaskOne: 'rgba(180, 235, 180, 0.1)',
    fileListCanDropMaskTwo: 'rgba(180, 235, 180, 0.2)',
    fileListCannotDropMaskOne: 'rgba(235, 180, 180, 0.1)',
    fileListCannotDropMaskTwo: 'rgba(235, 180, 180, 0.2)',
  },

  dragLayer: {
    border: 'solid 2px #09f',
    padding: '7px 10px',
    borderRadius: 2,
  },

  fileList: {
    desktopGridGutter: 8,
    mobileGridGutter: 5,
  },

  gridFileEntry: {
    childrenCountSize: '1.6em',
    iconColorFocused: '#000',
    iconSize: '2.4em',
    iconColor: '#fff',
    borderRadius: 5,
    fontSize: 14,
    textWrap: 'wrap',

    fileColorTint: 'rgba(255, 255, 255, 0.4)',
    fileFocusedBoxShadow: 'inset rgba(0, 0, 0, 1) 0 0 0 3px',
    fileSelectedBoxShadow: 'inset rgba(0,153,255, .65) 0 0 0 3px',
    folderBackColorTint: 'rgba(255, 255, 255, 0.1)',
    folderBackFocusedColorTint: 'rgba(0, 0, 0, 0.3)',
    folderBackSelectedColorTint: 'rgba(0, 153, 255, .4)',
    folderFrontColorTint: 'rgba(255, 255, 255, 0.4)',
    folderFrontFocusedBoxShadow: 'inset rgba(0, 0, 0, 1) 0 0 0 3px',
    folderFrontSelectedBoxShadow: 'inset rgba(0, 153, 255, .65) 0 0 0 3px',
  },

  listFileEntry: {
    propertyFontSize: 14,
    iconColor: undefined as string | undefined,
    iconFontSize: '1.1em',
    iconBorderRadius: 5,
    fontSize: 14,
    headerFontSize: 10,
  },

  fileEntrySelectionIndicator: {
    background:
      'repeating-linear-gradient(' +
      '45deg,' +
      'rgba(0,153,255,.14),' +
      'rgba(0,153,255,.14) 10px,' +
      'rgba(0,153,255,.25) 0,' +
      'rgba(0,153,255,.25) 20px' +
      ')',
    backgroundColor: 'rgba(0, 153, 255, .14)',
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 10,
  },

  fileEntryFocusIndicator: {
    boxShadow: 'inset rgba(0, 0, 0, 1) 0 0 0 2px',
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 11,
  },
};

export type ChonkyTheme = typeof lightTheme;

export const darkThemeOverride: DeepPartial<ChonkyTheme> = {
  gridFileEntry: {
    fileColorTint: 'rgba(50, 50, 50, 0.4)',
    folderBackColorTint: 'rgba(50, 50, 50, 0.4)',
    folderFrontColorTint: 'rgba(50, 50, 50, 0.15)',
  },
};

export const mobileThemeOverride: DeepPartial<ChonkyTheme> = {
  fontSizes: {
    rootPrimary: 13,
  },
  margins: {
    rootLayoutMargin: 4,
  },
  toolbar: {
    size: 28,
    lineHeight: '28px',
    fontSize: 13,
  },
  gridFileEntry: {
    fontSize: 13,
  },
  listFileEntry: {
    propertyFontSize: 12,
    iconFontSize: '1em',
    fontSize: 13,
  },
};

export const useIsMobileBreakpoint = () => {
  return useMediaQuery('(max-width:480px)');
};

export const getStripeGradient = (colorOne: string, colorTwo: string) =>
  'repeating-linear-gradient(' +
  '45deg,' +
  `${colorOne},` +
  `${colorOne} 10px,` +
  `${colorTwo} 0,` +
  `${colorTwo} 20px` +
  ')';

export const makeLocalChonkyStyles = <C extends string = string>(
  styles: ((theme: ChonkyTheme & MuiTheme) => any) | (ChonkyTheme & MuiTheme),
  // @ts-ignore
): any => createUseStyles<ChonkyTheme, C>(styles);

export const makeGlobalChonkyStyles = <C extends string = string>(
  makeStyles: (theme: ChonkyTheme & MuiTheme) => any,
) => {
  const selectorMapping = {};
  const makeGlobalStyles = (theme: ChonkyTheme) => {
    const localStyles = makeStyles(theme as any);
    const globalStyles = {};
    const localSelectors = Object.keys(localStyles);
    localSelectors.map((localSelector) => {
      const globalSelector = `chonky-${localSelector}`;
      const jssSelector = `@global .${globalSelector}`;
      // @ts-ignore
      globalStyles[jssSelector] = localStyles[localSelector];
      // @ts-ignore
      selectorMapping[localSelector] = globalSelector;
    });
    return globalStyles;
  };

  // @ts-ignore
  const useStyles = createUseStyles<ChonkyTheme, C>(makeGlobalStyles as any);
  return (...args: any[]): any => {
    const styles = useStyles(...args);
    const classes = {};
    Object.keys(selectorMapping).map((localSelector) => {
      // @ts-ignore
      classes[localSelector] = selectorMapping[localSelector];
    });
    return { ...classes, ...styles };
  };
};

export const important = <T>(value: T) => [value, '!important'];

export const c = classnames;
