import clsx from 'clsx';
import arrayMutators from 'final-form-arrays';
import createDecorator from 'final-form-calculate';
import { type TFunction } from 'i18next';
import partial from 'lodash-es/partial';
import React, {
  type Dispatch,
  type DispatchWithoutAction,
  type FunctionComponent,
  type SetStateAction,
  useState,
} from 'react';
import {
  DragDropContext,
  Draggable,
  type DraggableProvided,
  type DraggableStateSnapshot,
  Droppable,
} from 'react-beautiful-dnd';
import { Field, Form } from 'react-final-form';
import {
  FieldArray,
  type FieldArrayRenderProps,
} from 'react-final-form-arrays';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  Box,
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Popover,
  Typography,
} from '@material-ui/core';
import {
  Add,
  Delete,
  DragHandle,
  FontDownload,
  GridOn,
  Link,
  LinkOff,
  Lock,
  LockOpen,
  Replay,
} from '@material-ui/icons';
import { TextField } from 'mui-rff';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  getSelectedTool,
  getTakeoffGridProperties,
  setSelectedTool,
  setTakeoffGridProperties,
  type SubgridConfig,
  type TakeoffGridProperties,
} from '~/features/map/tools';
import { prepareMappingForMultiUAVMissionFromSelection } from '~/features/mission/actions';
import { toggleHomePositionsLocked } from '~/features/mission/slice';
import { setupMissionFromShow } from '~/features/show/actions';
import { type RootState } from '~/store/reducers';

import { Tool } from './tools';

// --- TakeoffSubgridProperties ---

const useStyles = makeStyles((theme) => ({
  dragged: { background: theme.palette.action.hover },
}));

const NumericTextField: FunctionComponent<
  Readonly<{
    disabled?: boolean;
    gridArea: string;
    max?: number;
    min?: number;
    name: string;
    step?: number;
    unit?: string;
  }>
> = ({ disabled, gridArea, max, min, name, step, unit }) => (
  <TextField
    disabled={disabled}
    name={name}
    size='small'
    style={{ gridArea }}
    type='number'
    variant='outlined'
    fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
    inputProps={{ style: { appearance: 'textfield' }, min, step, max }}
    InputProps={{
      ...(Boolean(unit) && {
        endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
      }),
    }}
  />
);

const LinkCheckboxField: FunctionComponent<
  Readonly<{ gridArea: string; name: string }>
> = ({ name, gridArea }) => (
  // TODO: Is `type="checkbox"` necessary?
  <Field name={name} type='checkbox'>
    {({ input }) => (
      <Checkbox
        {...input}
        icon={<LinkOff />}
        checkedIcon={<Link />}
        color='primary'
        style={{ gridArea }}
      />
    )}
  </Field>
);

const TakeoffSubgridProperties: FunctionComponent<
  Readonly<{
    fields: FieldArrayRenderProps<SubgridConfig, HTMLElement>['fields'];
    index: number;
    name: string;
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
  }>
> = ({ fields, index, name, provided, snapshot }) => {
  const classes = useStyles();
  return (
    <ListItem
      ref={provided.innerRef}
      className={clsx(snapshot.isDragging && classes.dragged)}
      {...provided.draggableProps}
    >
      <Box
        display='grid'
        gridTemplateColumns='32px 60px 75px 40px 75px'
        gridTemplateAreas={`
          '.......... .......... xLabel ......... yLabel'
          'dragHandle countLabel xCount countLink yCount'
          'removeIcon spaceLabel xSpace spaceLink ySpace'
        `}
        // TODO: Should just be `placeItems='center'`,
        //       but MUI v4 doesn't seem to support it
        alignItems='center'
        justifyItems='center'
        style={{ userSelect: 'none' }}
      >
        <ListItemIcon
          style={{ gridArea: 'dragHandle', minWidth: 32 }}
          {...provided.dragHandleProps}
        >
          <DragHandle />
        </ListItemIcon>
        <ListItemIcon style={{ gridArea: 'removeIcon' }}>
          <IconButton onClick={() => fields.remove(index)}>
            <Delete />
          </IconButton>
        </ListItemIcon>

        <Typography style={{ gridArea: 'xLabel' }}>X</Typography>
        <Typography style={{ gridArea: 'yLabel' }}>Y</Typography>

        <Typography style={{ gridArea: 'countLabel' }}>Count</Typography>
        <NumericTextField gridArea='xCount' name={`${name}.xCount`} min={1} />
        <LinkCheckboxField gridArea='countLink' name={`${name}.linkCount`} />
        <NumericTextField
          gridArea='yCount'
          name={`${name}.yCount`}
          disabled={fields?.value[index]?.linkCount}
          min={1}
        />

        <Typography style={{ gridArea: 'spaceLabel' }}>Space</Typography>
        <NumericTextField
          gridArea='xSpace'
          name={`${name}.xSpace`}
          min={0.1}
          step={0.1}
          unit='m'
        />
        <LinkCheckboxField gridArea='spaceLink' name={`${name}.linkSpace`} />
        <NumericTextField
          gridArea='ySpace'
          name={`${name}.ySpace`}
          disabled={fields.value[index]?.linkSpace}
          min={0.1}
          step={0.1}
          unit='m'
        />
      </Box>
    </ListItem>
  );
};

// --- TakeoffSubgridPropertiesForm ---

const DEFAULT_SUBGRID: SubgridConfig = {
  xCount: 2,
  yCount: 2,
  linkCount: true,
  xSpace: 1,
  ySpace: 1,
  linkSpace: true,
};

const fieldNameToSubgridIndex = (name: string): number =>
  Number(name.match(/subgrids\[(?<index>\d+)]/)?.groups?.['index']);

const decorator = createDecorator<TakeoffGridProperties>(
  {
    field: /(subgrids\[\d+].xCount)|(subgrids\[\d+].linkCount)/,
    updates(_value, name, allValues) {
      const index = fieldNameToSubgridIndex(name);
      const { linkCount, xCount } = allValues?.subgrids[index] ?? {};
      return linkCount ? { [`subgrids[${index}].yCount`]: xCount } : {};
    },
  },
  {
    field: /(subgrids\[\d+].xSpace)|(subgrids\[\d+].linkSpace)/,
    updates(_value, name, allValues) {
      const index = fieldNameToSubgridIndex(name);
      const { linkSpace, xSpace } = allValues?.subgrids[index] ?? {};
      return linkSpace ? { [`subgrids[${index}].ySpace`]: xSpace } : {};
    },
  }
);

const TakeoffGridPropertiesForm: FunctionComponent<
  Readonly<{
    anchorEl: HTMLElement | undefined;
    setAnchorEl: Dispatch<SetStateAction<HTMLElement | undefined>>;
    setTakeoffGridProperties: Dispatch<TakeoffGridProperties>;
    t: TFunction;
    takeoffGridProperties: TakeoffGridProperties;
  }>
> = ({
  anchorEl,
  setAnchorEl,
  takeoffGridProperties,
  t,
  setTakeoffGridProperties,
}) => (
  <Form
    mutators={{ ...arrayMutators }}
    initialValues={takeoffGridProperties}
    decorators={[decorator]}
    render={({ handleSubmit, form }) => (
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ style: { marginTop: 4 } }}
        onClose={() => {
          form.submit()?.catch((error) => {
            console.error('Error submitting TakeoffGridPropertiesForm:', error);
          });
          setAnchorEl(undefined);
        }}
      >
        <form onSubmit={handleSubmit}>
          <FieldArray name='subgrids'>
            {({ fields }) => (
              <DragDropContext
                onDragEnd={(result) => {
                  if (result.destination) {
                    fields.move(result.source.index, result.destination.index);
                  }
                }}
              >
                <Droppable droppableId='droppable'>
                  {(provided) => (
                    <List
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      dense
                      disablePadding
                    >
                      {fields?.map((name, index) => (
                        <Draggable key={name} draggableId={name} index={index}>
                          {(provided, snapshot) => (
                            <TakeoffSubgridProperties
                              key={name}
                              fields={fields}
                              index={index}
                              name={name}
                              provided={provided}
                              snapshot={snapshot}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <ListItem
                        button
                        style={{ minWidth: 315 }}
                        onClick={() => {
                          fields.push(DEFAULT_SUBGRID);
                        }}
                      >
                        <ListItemIcon style={{ minWidth: 32 }}>
                          <Add />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('takeoffGridEditor.addNewSubgrid')}
                          primaryTypographyProps={{ align: 'center' }}
                        />
                      </ListItem>
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </FieldArray>
        </form>
      </Popover>
    )}
    onSubmit={setTakeoffGridProperties}
  />
);

/**
 * Presentation component for the takeoff toolbar.
 */
const TakeoffToolbarPresentation: FunctionComponent<
  Readonly<{
    autoSetTakeoffGrid: DispatchWithoutAction;
    homePositionsLocked: boolean;
    onToolSelected: Dispatch<Tool>;
    resetTakeoffGrid: DispatchWithoutAction;
    selectedTool: Tool;
    setTakeoffGridProperties: Dispatch<TakeoffGridProperties>;
    t: TFunction;
    takeoffGridProperties: TakeoffGridProperties;
    toggleHomePositionsLocked: DispatchWithoutAction;
  }>
> = ({
  autoSetTakeoffGrid,
  homePositionsLocked,
  onToolSelected,
  resetTakeoffGrid,
  selectedTool,
  setTakeoffGridProperties,
  t,
  takeoffGridProperties,
  toggleHomePositionsLocked,
}) => {
  const colorForTool = (tool: Tool) =>
    selectedTool === tool ? 'primary' : undefined;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>();

  return (
    // NOTE: Box doesn't have `ref` in MUI v4, and I didn't feel like adding an
    //       extra patch / type augmentation just for the sake of this...
    //       We should use that instead of the `parentElement` trick
    //       after migrating to MUI v5!
    <Box display='flex'>
      <Tooltip placement='bottom' content={t('general.action.lock')}>
        <IconButton onClick={toggleHomePositionsLocked}>
          {homePositionsLocked ? <Lock /> : <LockOpen />}
        </IconButton>
      </Tooltip>

      <Divider flexItem orientation='vertical' />

      <Tooltip placement='bottom' content={t('general.action.reset')}>
        <IconButton onClick={resetTakeoffGrid}>
          <Replay />
        </IconButton>
      </Tooltip>

      <Tooltip placement='bottom' content={t('takeoffToolbar.grid')}>
        <IconButton
          onClick={partial(onToolSelected, Tool.TAKEOFF_GRID)}
          onContextMenu={(e) => {
            e.preventDefault();
            setAnchorEl(e.currentTarget.parentElement ?? undefined);
          }}
        >
          <GridOn color={colorForTool(Tool.TAKEOFF_GRID)} />
        </IconButton>
      </Tooltip>

      <TakeoffGridPropertiesForm
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        setTakeoffGridProperties={setTakeoffGridProperties}
        t={t}
        takeoffGridProperties={takeoffGridProperties}
      />

      <Tooltip placement='bottom' content={t('general.action.auto')}>
        <IconButton onClick={autoSetTakeoffGrid}>
          <FontDownload />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

/**
 * Takeoff toolbar on the map.
 */
const TakeoffToolbar = connect(
  // mapStateToProps
  (state: RootState) => ({
    homePositionsLocked: state.mission.homePositionsLocked,
    takeoffGridProperties: getTakeoffGridProperties(state),
    selectedTool: getSelectedTool(state),
  }),
  // mapDispatchToProps
  {
    toggleHomePositionsLocked,
    setTakeoffGridProperties,
    onToolSelected: setSelectedTool,
    autoSetTakeoffGrid: prepareMappingForMultiUAVMissionFromSelection,
    resetTakeoffGrid: setupMissionFromShow,
  }
)(withTranslation()(TakeoffToolbarPresentation));

export default TakeoffToolbar;
