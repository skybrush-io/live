import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Fab from '@mui/material/Fab';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Virtuoso,
  type FlatIndexLocationWithAlign,
  type VirtuosoHandle,
} from 'react-virtuoso';

import { makeStyles } from '@skybrush/app-theme-mui';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import type { LogItem } from '~/features/log/types';

import LogMessageListItem from './LogMessageListItem';

const renderLogMessage = (_index: number, item: LogItem) => (
  <LogMessageListItem item={item} />
);

const useStyles = makeStyles((theme) => ({
  scrollToBottomButton: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

type LogMessageListProps = {
  items?: LogItem[];
};

const LogMessageList = ({ items = [] }: LogMessageListProps) => {
  const listRef = useRef<VirtuosoHandle | null>(null);
  const previousLastItemIdRef = useRef<number | null>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);
  const [scrollToBottomButtonBlocked, setScrollToBottomButtonBlocked] =
    useState(false);
  const classes = useStyles();

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      const scrollTarget: FlatIndexLocationWithAlign = {
        index: items.length,
        behavior: 'smooth',
      };
      listRef.current.scrollToIndex(scrollTarget);
    }
  }, [listRef, items]);

  useEffect(() => {
    let delayedScrollToBottomTimeout: ReturnType<typeof setTimeout> | undefined;
    let delayedUnblockScrollToBottomButtonTimeout:
      | ReturnType<typeof setTimeout>
      | undefined;

    if (items.length > 0) {
      const lastItemId = items[items.length - 1].id;

      if (lastItemId !== previousLastItemIdRef.current) {
        if (scrolledToBottom) {
          // New item was added, scroll to bottom. This is used to work around
          // a bug in react-virtuoso when two new items are added in quick
          // succession but in _different_ frames
          setScrollToBottomButtonBlocked(true);
          delayedScrollToBottomTimeout = setTimeout(scrollToBottom, 100);
          delayedUnblockScrollToBottomButtonTimeout = setTimeout(
            () => setScrollToBottomButtonBlocked(false),
            500
          );
        }

        previousLastItemIdRef.current = lastItemId;
      }
    } else {
      previousLastItemIdRef.current = null;
    }

    return () => {
      if (delayedScrollToBottomTimeout) {
        clearTimeout(delayedScrollToBottomTimeout);
      }

      if (delayedUnblockScrollToBottomButtonTimeout) {
        clearTimeout(delayedUnblockScrollToBottomButtonTimeout);
      }
    };
  }, [scrolledToBottom, items, scrollToBottom]);

  return (
    <>
      <Virtuoso
        ref={listRef}
        followOutput
        data={items}
        itemContent={renderLogMessage}
        atBottomStateChange={setScrolledToBottom}
      />
      <FadeAndSlide in={!scrolledToBottom && !scrollToBottomButtonBlocked}>
        <Fab
          color='secondary'
          size='small'
          className={classes.scrollToBottomButton}
          onClick={scrollToBottom}
        >
          <ArrowDownward />
        </Fab>
      </FadeAndSlide>
    </>
  );
};

export default LogMessageList;
