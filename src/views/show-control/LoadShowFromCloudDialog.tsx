import Dialog from '@mui/material/Dialog';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Tab from '@mui/material/Tab';
import { DialogTabs } from '@skybrush/mui-components';
import config from 'config';
import { connect } from 'react-redux';

import { loadShowFromUrl } from '~/features/show/actions';
import { closeLoadShowFromCloudDialog } from '~/features/show/slice';
import type { AppDispatch, RootState } from '~/store/reducers';

type Props = {
  open: boolean;
  onClose: () => void;
  onLoadShowFromUrl: (url: string) => void;
};

/**
 * Presentation component for the dialog that allows the user to load a show
 * file from a remote data source such as his/her Skybrush Account or a git
 * repository
 */
const LoadShowFromCloudDialog = ({
  open = false,
  onClose,
  onLoadShowFromUrl,
}: Props) => {
  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTabs value='skybrushAccount' alignment='center'>
        <Tab value='skybrushAccount' label='Skybrush Account' />
        <Tab disabled value='web' label='Web Link' />
        <Tab disabled value='git' label='Git Repository' />
      </DialogTabs>
      <List>
        <ListSubheader>Shared with me</ListSubheader>
        {config.examples.shows.map(({ id, title, url }) => (
          <ListItem key={id} disablePadding>
            <ListItemButton onClick={() => onLoadShowFromUrl(url)}>
              <ListItemText primary={title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...state.show.loadShowFromCloudDialog,
  }),

  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onClose() {
      dispatch(closeLoadShowFromCloudDialog());
    },

    onLoadShowFromUrl(url: string) {
      dispatch(closeLoadShowFromCloudDialog());
      dispatch(loadShowFromUrl(url));
    },
  })
)(LoadShowFromCloudDialog);
