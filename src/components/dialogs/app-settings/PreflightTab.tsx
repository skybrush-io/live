import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TextField } from 'mui-rff';
import { Form } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import FormSubmissionButtonRow from '~/components/forms/FormSubmissionButtonRow';
import { updateManualPreflightCheckItemsFromString } from '~/features/preflight/actions';
import { getFormattedHeadersAndItems } from '~/features/preflight/selectors';
import type { RootState } from '~/store/reducers';

type Props = {
  items?: string;
  onSubmit: (values: { items?: string }) => void;
};

const PreflightTabPresentation = ({ items, onSubmit }: Props) => {
  const { t } = useTranslation();

  return (
    <Form initialValues={{ items }} onSubmit={onSubmit}>
      {({ dirty, form, handleSubmit }) => (
        <Box>
          <Typography>{t('preflightTab.enterCheckItems')}</Typography>
          <Box sx={{ py: 1 }}>
            <TextField
              fullWidth
              multiline
              name='items'
              label={t('preflightTab.manualPreflightCheckItems')}
              minRows={10}
              variant='filled'
              helperText={t('preflightTab.headingsHint')}
            />
          </Box>
          <FormSubmissionButtonRow
            label={t('preflightTab.preflightCheckItems')}
            dirty={dirty}
            form={form}
            onSubmit={handleSubmit}
          />
        </Box>
      )}
    </Form>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    items: getFormattedHeadersAndItems(state),
  }),
  // mapDispatchToProps
  {
    onSubmit({ items }: { items?: string }) {
      return updateManualPreflightCheckItemsFromString(items);
    },
  }
)(PreflightTabPresentation);
