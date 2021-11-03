import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { Fab } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArrowDownward from '@material-ui/icons/ArrowDownward';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';

import LogMessageListItem from './LogMessageListItem';

const renderLogMessage = (index, item) => <LogMessageListItem item={item} />;

const useStyles = makeStyles((theme) => ({
  scrollToBottomButton: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const LogMessageList = ({ items }) => {
  const listRef = useRef(null);
  const previousLastItemId = useRef(null);
  const [isAtBottom, setAtBottom] = useState(true);
  const [isScrollToBottomButtonBlocked, setScrollToBottomButtonBlocked] =
    useState(false);
  const classes = useStyles();

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToIndex({
        index: items.length,
        behaviour: 'smooth',
      });
    }
  }, [listRef, items]);

  useEffect(() => {
    if (items && items.length > 0) {
      const lastItemId = items[items.length - 1].id;
      if (lastItemId !== previousLastItemId.current) {
        if (isAtBottom) {
          // New item was added, scroll to bottom. This is used to work around
          // a bug in react-virtuoso when two new items are added in quick
          // succession but in _different_ frames
          setScrollToBottomButtonBlocked(true);
          setTimeout(scrollToBottom, 100);
          setTimeout(() => setScrollToBottomButtonBlocked(false), 500);
        }

        previousLastItemId.current = lastItemId;
      }
    } else {
      previousLastItemId.current = null;
    }
  }, [isAtBottom, items, scrollToBottom]);

  return (
    <>
      <Virtuoso
        ref={listRef}
        followOutput
        data={items}
        itemContent={renderLogMessage}
        atBottomStateChange={setAtBottom}
      />
      <FadeAndSlide in={!isAtBottom && !isScrollToBottomButtonBlocked}>
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

LogMessageList.propTypes = {
  items: PropTypes.array,
};

export default LogMessageList;
