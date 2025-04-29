/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import c from 'classnames';
import React from 'react';
import { Nullable } from 'tsdef';

import { makeGlobalChonkyStyles } from '../../util/styles';

export interface FileThumbnailProps {
  className: string;
  thumbnailElement: Nullable<React.ReactElement>;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = React.memo((props) => {
  const { className, thumbnailElement } = props;
  const classes = useStyles();
  return <div className={c([className, classes.fileThumbnail])}>{thumbnailElement}</div>;
});
FileThumbnail.displayName = 'FileThumbnail';

const useStyles = makeGlobalChonkyStyles(() => ({
  fileThumbnail: {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'contain',
  },
}));
