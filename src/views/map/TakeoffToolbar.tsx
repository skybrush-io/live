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
  // useRef,
  useState,
} from 'react';
import {
  DragDropContext,
  Draggable,
  type DraggableProvided,
  type DraggableStateSnapshot,
  Droppable,
  type DropResult,
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
import { tt } from '~/i18n';
import { type RootState } from '~/store/reducers';

import { Tool } from './tools';

const DEFAULT_SUBGRID: SubgridConfig = {
  xCount: 2,
  yCount: 2,
  linkCount: true,
  xSpace: 1,
  ySpace: 1,
  linkSpace: true,
};

const makeOnDragEndFunction =
  (fields: FieldArrayRenderProps<SubgridConfig, HTMLElement>['fields']) =>
  (result: DropResult): void => {
    if (result.destination) {
      fields.move(result.source.index, result.destination.index);
    }
  };

const useStyles = makeStyles((theme) => ({
  dragged: { background: theme.palette.action.hover },
}));

const decorator = createDecorator<TakeoffGridProperties>(
  {
    field: /(subgrids\[\d+].xCount)|(subgrids\[\d+].linkCount)/,
    updates(_value, name, allValues) {
      const index = Number(
        // NOTE: Bang justified by the field name matching the RegEx in the first place.
        name.match(/subgrids\[(?<index>\d+)]/)?.groups?.['index']
      );
      return allValues?.subgrids[index]?.linkCount
        ? {
            [`subgrids[${index}].yCount`]: allValues?.subgrids[index]?.xCount,
          }
        : {};
    },
  },
  {
    field: /(subgrids\[\d+].xSpace)|(subgrids\[\d+].linkSpace)/,
    updates(_value, name, allValues) {
      const index = Number(
        // NOTE: Bang justified by the field name matching the RegEx in the first place.
        name.match(/subgrids\[(?<index>\d+)]/)?.groups?.['index']
      );
      return allValues?.subgrids[index]?.linkSpace
        ? {
            [`subgrids[${index}].ySpace`]: allValues?.subgrids[index]?.xSpace,
          }
        : {};
    },
  }
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
      {...provided.draggableProps}
      className={clsx(snapshot.isDragging && classes.dragged)}
      style={{
        ...provided.draggableProps.style,
      }}
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
        <TextField
          name={`${name}.xCount`}
          type='number'
          fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
          variant='outlined'
          size='small'
          style={{ gridArea: 'xCount' }}
          inputProps={{
            style: { appearance: 'textfield' },
            min: 1,
          }}
        />
        {/* TODO: Is `type="checkbox"` necessary? */}
        <Field name={`${name}.linkCount`} type='checkbox'>
          {({ input }) => (
            <Checkbox
              {...input}
              icon={<LinkOff />}
              checkedIcon={<Link />}
              color='primary'
              style={{ gridArea: 'countLink' }}
            />
          )}
        </Field>
        <TextField
          name={`${name}.yCount`}
          disabled={fields?.value[index]?.linkCount}
          type='number'
          fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
          variant='outlined'
          size='small'
          style={{ gridArea: 'yCount' }}
          inputProps={{
            style: { appearance: 'textfield' },
            min: 1,
          }}
        />

        <Typography style={{ gridArea: 'spaceLabel' }}>Space</Typography>
        <TextField
          name={`${name}.xSpace`}
          type='number'
          fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
          variant='outlined'
          size='small'
          style={{ gridArea: 'xSpace' }}
          inputProps={{
            style: { appearance: 'textfield' },
            min: 0.1,
            step: 0.1,
          }}
          InputProps={{
            endAdornment: <InputAdornment position='end'>m</InputAdornment>,
          }}
        />
        {/* TODO: Is `type="checkbox"` necessary? */}
        <Field name={`${name}.linkSpace`} type='checkbox'>
          {({ input }) => (
            <Checkbox
              {...input}
              icon={<LinkOff />}
              checkedIcon={<Link />}
              color='primary'
              style={{ gridArea: 'spaceLink' }}
            />
          )}
        </Field>
        <TextField
          name={`${name}.ySpace`}
          disabled={fields.value[index]?.linkSpace}
          type='number'
          fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
          variant='outlined'
          size='small'
          style={{ gridArea: 'ySpace' }}
          inputProps={{
            style: { appearance: 'textfield' },
            min: 0.1,
            step: 0.1,
          }}
          InputProps={{
            endAdornment: <InputAdornment position='end'>m</InputAdornment>,
          }}
        />
      </Box>
    </ListItem>
  );
};

const TakeoffGridPropertiesForm: FunctionComponent<
  Readonly<{
    anchorEl: HTMLElement | undefined;
    setAnchorEl: Dispatch<SetStateAction<HTMLElement | undefined>>;
    setTakeoffGridProperties: Dispatch<TakeoffGridProperties>;
    takeoffGridProperties: TakeoffGridProperties;
  }>
> = ({
  anchorEl,
  setAnchorEl,
  takeoffGridProperties,
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
              <DragDropContext onDragEnd={makeOnDragEndFunction(fields)}>
                <Droppable droppableId='droppable'>
                  {(provided, _snapshot) => (
                    <List
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      dense
                      disablePadding
                      style={
                        {
                          // ...(snapshot.isDraggingOver && { background: 'gray' }),
                        }
                      }
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
                          primary='Add new subgrid'
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
 * Presentation component for the drawing toolbar.
 */
const TakeoffToolbarPresentation: FunctionComponent<
  Readonly<{
    homePositionsLocked: boolean;
    toggleHomePositionsLocked: DispatchWithoutAction;
    setTakeoffGridProperties: Dispatch<TakeoffGridProperties>;
    takeoffGridProperties: TakeoffGridProperties;
    onToolSelected: Dispatch<Tool>;
    selectedTool: Tool;
    t: TFunction;
    autoSetTakeoffGrid: DispatchWithoutAction;
    resetTakeoffGrid: DispatchWithoutAction;
  }>
> = ({
  homePositionsLocked,
  toggleHomePositionsLocked,
  setTakeoffGridProperties,
  takeoffGridProperties,
  onToolSelected,
  selectedTool,
  t,
  autoSetTakeoffGrid,
  resetTakeoffGrid,
}) => {
  const colorForTool = (tool: Tool) =>
    selectedTool === tool ? 'primary' : undefined;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>();
  // const toolbarRef = useRef();

  return (
    // NOTE: Box doesn't have `ref` in MUI v4, and I didn't feel like adding an
    //       extra patch / type augmentation just for the sake of this...
    //       We should use it instead of the `parentElement` trick when migrating to MUI v5 though
    // <Box ref={toolbarRef} display='flex'>
    <Box display='flex'>
      <Tooltip placement='bottom' content='Lock'>
        <IconButton onClick={toggleHomePositionsLocked}>
          {homePositionsLocked ? <Lock /> : <LockOpen />}
        </IconButton>
      </Tooltip>

      <Divider flexItem orientation='vertical' />

      <Tooltip placement='bottom' content='Reset'>
        <IconButton onClick={resetTakeoffGrid}>
          <Replay />
        </IconButton>
      </Tooltip>

      <Tooltip placement='bottom' content={t('takeoffToolbar.grid')}>
        <IconButton
          onClick={partial(onToolSelected, Tool.TAKEOFF_GRID)}
          onContextMenu={(e) => {
            console.log({ e });
            e.preventDefault();
            // setAnchorEl(toolbarRef.current);
            setAnchorEl(e.currentTarget.parentElement ?? undefined);
            // setAnchorEl(e.currentTarget);
          }}
        >
          <GridOn color={colorForTool(Tool.TAKEOFF_GRID)} />
        </IconButton>
      </Tooltip>

      <TakeoffGridPropertiesForm
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        takeoffGridProperties={takeoffGridProperties}
        setTakeoffGridProperties={setTakeoffGridProperties}
      />

      <Tooltip placement='bottom' content='Auto'>
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
