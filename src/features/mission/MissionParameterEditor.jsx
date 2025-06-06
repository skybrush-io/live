import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import makeStyles from '@mui/styles/makeStyles';
import { getDefaultRegistry } from '@rjsf/core';
import { Form } from '@rjsf/mui';
import { getDefaultFormState } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import omitBy from 'lodash-es/omitBy';
import pickBy from 'lodash-es/pickBy';
import uniq from 'lodash-es/uniq';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import AsyncGuard from '~/components/AsyncGuard';

import { filterSchemaByUIContext } from './schema';

const useStyles = makeStyles(
  (theme) => ({
    tabs: {
      minHeight: 36,

      position: 'sticky',
      top: 0,

      backgroundColor: theme.palette.background.paper,

      // Use the z-index of AppBars (https://mui.com/material-ui/customization/z-index/)
      zIndex: 1100,
    },

    tab: {
      minHeight: 36,

      textTransform: 'capitalize',
    },
  }),
  {
    name: 'MissionParameterEditorPresentation',
  }
);

const FORM_UI_SCHEMA_DEFAULTS = {
  'ui:options': {
    submitButtonOptions: {
      norender: true,
    },
  },
};

const isUIProperty = (_value, key) => key.startsWith('ui:');
const getUIGroupOfProperty = (p) => p['ui:group'] ?? 'default';

const TextWidget = getDefaultRegistry().widgets.TextWidget;
const TextWidgetThatBlursOnWheel = React.forwardRef((props, ref) => (
  <TextWidget
    ref={ref}
    {...props}
    onWheel={({ target }) => {
      target.blur();
    }}
  />
));

const MissionParameterEditorPresentation = ({
  onChange,
  parameters,
  schema,
}) => {
  const jsonSchema = useMemo(() => omitBy(schema, isUIProperty), [schema]);
  const uiSchema = useMemo(() => pickBy(schema, isUIProperty), [schema]);

  // Separate the full schema into the schema that contains only the parameters
  // that are to be queried from the user, and a mapping from UI context IDs to
  // the names of parameters that are to be provided by that UI context
  const { schema: formSchema, uiContexts } = useMemo(
    () => filterSchemaByUIContext(jsonSchema),
    [jsonSchema]
  );

  const tabs = uniq(
    'ui:order' in uiSchema
      ? // Get the tab names in the specified order if it's defined
        uiSchema['ui:order'].map((p) =>
          getUIGroupOfProperty(formSchema.properties[p])
        )
      : // Otherwise just fall back to getting them in alphabetical order
        Object.values(formSchema.properties).map(getUIGroupOfProperty).sort()
  );
  // const groupedSchema = groupBy(formSchema.properties, getUIGroupOfProperty);

  const [activeGroup, setActiveGroup] = useState('default');
  const handleGroupSelect = useCallback(
    (_event, value) => setActiveGroup(value),
    [setActiveGroup]
  );

  const filteredSchema = useMemo(
    () => ({
      ...formSchema,
      properties: pickBy(
        formSchema.properties,
        (p) => getUIGroupOfProperty(p) === activeGroup
      ),
    }),
    [formSchema, activeGroup]
  );

  // Make sure that all parameters are properly initialized even if the user
  // doesn't visit every group / tab, and thus render their respective fields
  useEffect(() => {
    onChange({
      fromUser: getDefaultFormState(validator, formSchema, parameters),
    });
    // NOTE: We only want to redo this if the schema or the callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSchema, onChange]);

  // When the mapping from UI context IDs to the names of parameters changes,
  // notify the parent
  useEffect(() => {
    onChange({
      fromContext: uiContexts,
    });
  }, [onChange, uiContexts]);

  const handleChange = useCallback(
    ({ errors, formData }) => {
      // TODO(ntamas): extend formData with all the parameters that are to be
      // provided by the UI context
      if (errors.length === 0 && onChange) {
        onChange({
          fromUser: formData,
        });
      }
    },
    [onChange]
  );

  const classes = useStyles();
  return (
    <>
      {tabs.length > 1 && (
        <Tabs
          centered
          variant='fullWidth'
          className={classes.tabs}
          value={activeGroup}
          onChange={handleGroupSelect}
        >
          {tabs.map((t) => (
            <Tab
              key={t}
              className={classes.tab}
              label={uiSchema?.['ui:groups']?.[t]?.title ?? t}
              value={t}
            />
          ))}
        </Tabs>
      )}
      <Form
        schema={filteredSchema}
        widgets={{ TextWidget: TextWidgetThatBlursOnWheel }}
        uiSchema={{ ...FORM_UI_SCHEMA_DEFAULTS, ...uiSchema }}
        validator={validator}
        formData={parameters}
        onChange={handleChange}
      />
    </>
  );
};

MissionParameterEditorPresentation.propTypes = {
  onChange: PropTypes.func,
  parameters: PropTypes.object,
  schema: PropTypes.object,
};

const MissionParameterEditor = ({
  getSchema,
  onChange,
  parameters,
  selectedType,
}) => {
  const func = useCallback(async () => {
    if (selectedType) {
      const { plan } = await getSchema(selectedType);
      return plan;
    } else {
      return undefined;
    }
  }, [getSchema, selectedType]);

  const { t } = useTranslation();

  return (
    selectedType && (
      <AsyncGuard
        func={func}
        errorMessage={t('mission.planner.schema.error')}
        loadingMessage={t('mission.planner.schema.loading')}
      >
        {(schema) =>
          schema ? (
            <MissionParameterEditorPresentation
              schema={schema}
              parameters={parameters}
              onChange={onChange}
            />
          ) : (
            <BackgroundHint text={t('mission.planner.schema.notFound')} />
          )
        }
      </AsyncGuard>
    )
  );
};

MissionParameterEditor.propTypes = {
  getSchema: PropTypes.func,
  onChange: PropTypes.func,
  parameters: PropTypes.object,
  selectedType: PropTypes.string,
};

export default MissionParameterEditor;
